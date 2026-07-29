# ADR-022 — El upsert de DB_WRITE se emite por dialecto de motor

- **Estado**: aceptada
- **Fecha**: 2026-07-29
- **Ambito**: motor (`platform-app`), tarea `DB_WRITE` en modo `upsert`

## Contexto

`DB_WRITE` escribe sobre la base de datos **del cliente**, resuelta en runtime a traves de una
Conexion. El producto sale por defecto contra PostgreSQL y solo sale con otros motores a peticion
expresa, pero las tablas internas de la plataforma siguen siendo PostgreSQL en todos los casos.

`DbWriteRepository.upsertDynamic` emitia una unica sentencia:

```sql
insert into T (c...) values (...) on conflict (k...) do update set c = excluded.c
```

`ON CONFLICT ... DO UPDATE SET ... excluded.x` es sintaxis exclusiva de PostgreSQL. Contra Oracle,
SQL Server o MySQL la tarea fallaba con error de sintaxis en ejecucion. No corrompia datos —fallaba
ruidoso— pero el modo `upsert` era, de hecho, inutilizable fuera de PostgreSQL.

La causa de fondo no era la linea del SQL sino una **perdida de informacion en la frontera**:
`DbWriteTaskProvider` resolvia el destino con `resolveJdbcDataSource`, que devuelve un `DataSource`
pelado y descarta el `ConnectionType`. En el punto donde se construia el SQL ya no habia forma de
saber contra que motor se escribia.

Ningun test lo detecto porque `DbWriteTaskProviderTest` corre contra un contenedor PostgreSQL, donde
la sentencia es correcta. La cobertura existia y estaba verde; lo que faltaba era un motor distinto.

## Decision

1. El upsert se delega a un **dialecto por motor**, `DbWriteUpsertDialect`, siguiendo el mismo
   mecanismo que ya usan SP y FN: interfaz con `ConnectionType connectionType()`, implementaciones
   registradas en CDI e inyectadas como `Instance<>`, y resolucion a partir del **tipo declarado en
   la Conexion** (no por `getDatabaseProductName()`).
2. `DbWriteTaskProvider` resuelve `JdbcConnectionTarget` en vez de un `DataSource` suelto, de modo
   que el `ConnectionType` llega hasta la construccion del SQL. Sin `connectionRef` el destino es la
   base interna, que es PostgreSQL por diseno.
3. Un `ConnectionType` sin dialecto (hoy `MONGODB`) lanza `IllegalStateException` nombrando el tipo.
   No se emite SQL de otro motor "por si cuela".

### Invariante que sostiene el diseno

La sentencia debe consumir **un parametro por cada `?`, en orden y una sola vez**. Los dialectos
`MERGE` lo cumplen materializando la fila entrante una sola vez en la sub-consulta `using` y
refiriendose a ella por alias en las ramas `matched` / `not matched`, en vez de repetir los
parametros. Gracias a eso `bindInsertValues` es **identico para los cuatro motores** y no existe una
ruta de binding por dialecto que pueda desincronizarse del SQL.

Dos restricciones se cumplian ya sin haberlo buscado: `DbTaskSupport.updateAssignments` excluye las
columnas clave —justo lo que Oracle exige, porque prohibe actualizar una columna de la clausula
`ON`— y `keyColumns` vacio ya fallaba antes de llegar al SQL.

### Sentencia por motor

| Motor | Forma |
|---|---|
| PostgreSQL | `insert ... on conflict (k) do update set c = excluded.c` (sin cambios) |
| MySQL | `insert ... on duplicate key update c = values(c)` |
| Oracle | `merge into T tgt using (select ? c from dual) src on (...) when matched ... when not matched ...` |
| SQL Server | igual que Oracle, sin `from dual` y **terminando en punto y coma** |

## Consecuencias

- El modo `upsert` de `DB_WRITE` pasa a funcionar en los cuatro motores SQL soportados.
- **Diferencia de semantica que queda documentada, no oculta**: MySQL no admite que se le indique
  sobre que columnas es el conflicto — dispara la rama de actualizacion ante *cualquier* indice
  unico de la tabla. Los otros tres si acotan al conjunto declarado. Si la tabla destino tiene mas de
  un indice unico, MySQL se comporta distinto. Es del motor, no del arreglo.
- Se emite `values(columna)` en MySQL y no la forma con alias de fila (`new.columna`): la primera
  funciona de 5.7 a 8.4 (obsoleta desde 8.0.20 pero operativa), la segunda solo desde 8.0.19. Como la
  version del motor del cliente es una incognita, se prefiere la que cubre mas versiones. El test de
  compatibilidad de MySQL es lo que avisara si una version futura la retira.
- Anadir un quinto motor SQL exige anadir su dialecto; si no, `upsert` falla en el acto contra ese
  tipo de conexion con un mensaje que lo nombra.

## Alternativas descartadas

- **Emitir siempre `on conflict` y documentar que `upsert` solo vale en PostgreSQL.** Deja una opcion
  en la UI que revienta en runtime segun a que conexion apunte la tarea.
- **Detectar el motor por `getDatabaseProductName()`**, como hace `TaskInputRepository`. Habria sido
  un tercer mecanismo de deteccion en la misma base de codigo, y ademas exige una conexion abierta
  para decidir la forma del SQL.
- **Simular el upsert con `select` + `insert`/`update`.** Deja de ser atomico y abre una ventana de
  carrera en una escritura sobre la base del cliente.

## Ampliacion: paginacion de entrada por tabla

`TaskInputRepository` (lectura paginada en modo tabla: FILE_WRITE y BUILD_FROM_TABLE) resolvia el
motor leyendo `getDatabaseProductName()` de la conexion viva — un cuarto mecanismo de deteccion en la
misma base de codigo, y una segunda fuente de verdad para la misma pregunta. Ademas devolvia `LIMIT`
como "default seguro" tanto al fallar la lectura de metadatos como para cualquier motor no
contemplado: contra un motor que no lo entiende (DB2 necesita `FETCH FIRST`) eso emitia SQL invalido
en silencio.

Ahora el dialecto sale del `ConnectionType` declarado, igual que el resto. **Se resuelve con un
`switch` exhaustivo sin `default`, y no con dialectos CDI como en el upsert**: la diferencia entre
motores es un sufijo de una linea, y a cambio se gana algo que CDI no puede dar — anadir un motor a
`ConnectionType` deja de compilar hasta que alguien decida su paginacion. Fallo en compilacion en vez
de en ejecucion.

Los tres llamantes (`TaskInputResolver`, `AsyncPageChainService`, `FileWriteTaskProvider`) tenian la
misma perdida de informacion que DB_WRITE y ahora resuelven `JdbcConnectionTarget`.

## Ampliacion: lectura de campos tolerante al caso

Las pruebas multi-motor de la paginacion destaparon un segundo defecto, independiente del SQL: las
claves de un registro leido de tabla son las etiquetas que devuelve el driver, y **Oracle pone en
MAYUSCULAS los identificadores no entrecomillados** mientras PostgreSQL los pasa a minusculas. Los
consumidores hacian `values().get(...)` exacto (`DbTaskSupport.value`, y en `FileWriteTaskProvider` la
columna de payload y el agregado `sum` del trailer), de modo que una configuracion redactada contra
PostgreSQL y reapuntada a Oracle encontraba el campo vacio **en silencio**. Que
`TaskInputResolver.cursorValue` ya llevase su propio rodeo case-insensitive indicaba que alguien
choco con esto y parcheo solo el cursor.

No esta roto siempre: la introspeccion devuelve `COLUMN_NAME` tal cual, asi que quien elige la columna
del autocompletado guarda `ID` y coincide. Rompe con config redactada contra otro motor, nombres
tecleados a mano y defaults en minuscula (`payload_json`).

Decision: un accesor canonico `ReadRecord.value(String)`; ningun `values().get(...)` queda en `main`.

- **La coincidencia exacta tiene prioridad**, de modo que una tabla con columnas entrecomilladas
  distinguibles (`"id"` y `"ID"`) se sigue resolviendo sin ambiguedad y nada del comportamiento actual
  cambia.
- **La ambiguedad falla ruidosa**: si dos columnas coinciden solo ignorando el caso, lanza en vez de
  elegir — escoger una daria un resultado distinto segun el orden de las columnas.
- Usa `containsKey` y no `get() != null`: una columna presente con valor NULL devuelve null sin caer a
  la busqueda por caso, que podria acabar devolviendo el valor de *otra* columna.
- Se elimina el rodeo propio de `cursorValue`: una sola forma canonica, sin fallback paralelo.

**Alternativa descartada: normalizar las claves a minusculas en `readRecords`.** Habria roto el caso
que hoy funciona —config `ID` tomada del autocompletado contra una clave normalizada a `id`—
introduciendo una regresion a quien ya opera contra Oracle.

**Alternativa descartada: `TreeMap` con `CASE_INSENSITIVE_ORDER` en `ReadRecord`.** Ordena las claves
alfabeticamente y los escritores de fichero dependen del orden de columnas.

## Deuda relacionada que este ADR NO resuelve

- `ConnectionMetadataService` usa la API portable `DatabaseMetaData`, pero pasa el schema como
  `schemaPattern` con catalogo nulo; en MySQL la base de datos es el *catalogo*. Hipotesis sin
  comprobar: el autocompletado de tablas podria devolver vacio contra MySQL.
