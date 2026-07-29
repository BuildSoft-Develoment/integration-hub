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

## Deuda relacionada que este ADR NO resuelve

- `TaskInputRepository` (lectura paginada en modo tabla: FILE_WRITE, BUILD_FROM_TABLE) resuelve el
  motor por `getDatabaseProductName()` — un mecanismo distinto del de SP, FN y ahora DB_WRITE — y no
  tiene pruebas de compatibilidad multi-motor.
- `TaskInputRepository.paginationDialect` devuelve `LIMIT` como "default seguro" cuando falla la
  lectura de metadatos. Es un fallback silencioso: contra Oracle o SQL Server produce SQL invalido.
- `ConnectionMetadataService` usa la API portable `DatabaseMetaData`, pero pasa el schema como
  `schemaPattern` con catalogo nulo; en MySQL la base de datos es el *catalogo*. Hipotesis sin
  comprobar: el autocompletado de tablas podria devolver vacio contra MySQL.
