# ADR-023 — Cada modulo es dueno de su esquema de base de datos

- **Estado**: aceptada
- **Fecha**: 2026-07-30
- **Ambito**: motor (`platform-app`) y vertical SWIFT (`vertical-swift-mt101`); PostgreSQL

## Contexto

ADR-021 establecio la frontera motor↔vertical **en Java**: modulos separados, SPI, y reglas ArchUnit
congeladas que impiden que el motor conozca al vertical.

En la base de datos esa frontera **no existia en absoluto**:

| | Antes |
|---|---|
| Migraciones Flyway en `platform-app` | **103**, incluidas las 53 del vertical |
| Migraciones en `vertical-swift-mt101` | **0** |
| Tablas en `public` | 45: 22 del vertical, 22 del motor, 1 compartida |
| `default-schema` / `flyway.schemas` | sin declarar |
| Entidades JPA con `schema=` | 0 de 22 |

El motor era dueno del DDL del vertical. Ademas, **cuatro tablas del vertical no llevan el prefijo
`mt101_`** —`swift_inbound_message`, `swift_message_envelope`, `inbound_routed_transaction`,
`payment_validation_rule`— y solo se identifican por quien las usa: el nombre no delataba su lado.

## Decision

### 1. La propiedad se expresa por directorio, no por numero

Las 53 migraciones del vertical se mueven a
`vertical-swift-mt101/src/main/resources/db/migration-mt101/`, y Flyway escanea las dos ubicaciones:

```
quarkus.flyway.locations=classpath:db/migration,classpath:db/migration-mt101
```

**El historial NO se parte**: un unico `flyway_schema_history` en el schema del motor. Reescribir
retroactivamente el historial rompe toda instalacion existente, y no aporta nada: lo que expresa la
propiedad es donde vive el fichero.

De los 103 ficheros, **53 son puro vertical, 49 puro motor y 1 mixto**. La clasificacion se hizo por
contenido, no por nombre: `V15__staging_record_index_mt101_scale.sql` indexa `staging_record` y es del
motor pese a su nombre, y `V25__mt101_fragment_source_row_lookup.sql` es del vertical pese a mencionar
`process_execution_id`, que es una columna y no una tabla.

### 2. Los objetos del vertical NACEN en `vertical_mt101`

Las 53 migraciones del vertical se **reescribieron** para crear sus objetos ya cualificados
(`create table vertical_mt101.mt101_archive`), en lugar de crearlos en `public` y moverlos despues con
un `alter table ... set schema`. Son **207 objetos**: 22 tablas, 61 indices, 7 triggers, 5 funciones,
1 secuencia y 13 claves ajenas internas.

Esto solo es posible porque el producto **aun no esta en produccion** y la base de integracion se
recrea desde cero: reescribir migraciones historicas cambia sus checksums y seria inviable con
instalaciones existentes. Se hizo ahora precisamente porque es el unico momento en que sale gratis.

`V12` —la primera migracion del vertical por numero de version— crea el schema antes que nada.

`staging_record` **no se mueve**. Es la zona de aterrizaje generica donde el fichero pesado se
descompone en filas antes de que ningun vertical lo toque: nace en `V1`, su `payload_json` es un blob
opaco, se acota por `process_execution_id`, y desde ADR-021 decision 3 **el motor es su unico
escritor** (el vertical tenia tres `update` y se promovieron al motor). El vertical la lee en 12
sentencias; dejandola donde esta, ninguna necesita cualificarse.

Se descarto **una `staging_record` por vertical**: obligaria al motor a saber a que vertical va el
fichero *en el momento de aterrizarlo*, cuando el enrutado es posterior. Eso devuelve al motor el
conocimiento del vertical que ADR-021 vino a quitar.

### 3. El SQL de Java NO cualifica: lo resuelve el `search_path`

El DDL cualifica; las ~231 sentencias SQL del vertical en Java **no**. Se apoyan en el `search_path`,
que `V12` fija **a nivel de base de datos**:

```sql
alter database <current> set search_path = public, vertical_mt101;
```

Declararlo solo en el datasource de la aplicacion
(`quarkus.datasource.jdbc.additional-jdbc-properties.currentSchema`) **no basta**:
`ConnectionPoolManager.createJdbcDataSource()` construye los pools por `connectionRef` unicamente con
lo que trae `connection_definition` —url, credenciales, `initialSql`, `jdbcProperties`— y no hereda
nada de `application.properties`. **La mayoria de las tareas MT101 llega a la base por una
`connection_definition` que apunta a la propia plataforma**, porque es donde viven sus tablas: el
camino mas transitado es justo el que la configuracion del datasource no cubre.

Fijarlo en la base lo hereda toda sesion nueva: aplicacion, pools por `connectionRef`, scripts de seed
que entran por `psql` y consultas manuales de operacion.

`ALTER DATABASE ... SET` **exige ser dueno de la base** (comprobado: un rol no-dueno responde
`must be owner of database`). `V12` lo verifica antes y falla nombrando la sentencia exacta que debe
ejecutar un administrador, en vez de degradar a `alter role current_user`, que solo cubriria a ese
usuario y dejaria fuera precisamente los pools con otras credenciales.

### 4. Las entidades JPA declaran su schema explicitamente

`PaymentValidationRule` —la unica entidad del vertical— lleva `@Table(schema = "vertical_mt101")`.

El `search_path` resuelve el SQL crudo pero **no la validacion de esquema de Hibernate**, que
inspecciona unicamente el schema por defecto (el primero de la lista, `public`). Sin la anotacion, la
aplicacion no arranca: `Schema validation: missing table [payment_validation_rule]`. Lo detecto el
reactor, no la revision.

### 5. Un ratchet vigila la propiedad

`MigrationOwnershipRatchetTest` no congela la lista de ficheros —crecera— sino la **regla**: una
migracion del motor no declara DDL sobre objetos del vertical y viceversa. Cubre **tablas, indices y
triggers**, porque el DDL de un modulo no es solo `create table`: hay 61 indices y 7 triggers frente a
22 tablas, y 7 de los 53 ficheros movidos no contienen ninguna sentencia `table`.

La regex acepta nombres cualificados y se queda con la **ultima** parte. Una que capturase la primera
leeria el schema en `alter table vertical_mt101.mt101_x`, y el guard se apagaria justo cuando alguien
sigue la convencion.

`V31__record_traceability_source_row.sql` es la **unica excepcion admitida**: anadio `source_file_hash`
a `staging_record` y a la vez las columnas de linaje a `mt101_build_fragment`, o sea que es la
migracion que creo el vinculo `staging_id` entre ambos lados.

## Consecuencias

- **Toda tabla nueva del vertical debe crearse cualificada**: `create table vertical_mt101.mt101_x`.
  Con `public` primero en el `search_path`, un `create table` sin cualificar aterrizaria en el schema
  del motor. El ratchet no vigila esto todavia.
- **Este cambio NO da aislamiento de permisos.** Hay un unico datasource y un unico rol de base de
  datos: la separacion es organizativa y documental. El aislamiento real exigiria dos roles, que
  exigen dos datasources, que romperian las 7 sentencias del vertical que necesitan que ambas tablas
  sean alcanzables en la misma conexion —incluido el `count(*)` con SHA-256 que protege la aprobacion
  del rebuild masivo—. La garantia la da el ratchet, no los `GRANT`.
- Las **claves ajenas del vertical hacia el motor** (`process_execution`, `process_task_definition`)
  son cross-schema. Eso cierra la puerta a separar el vertical a su propia **base de datos** sin
  reescribirlas como validacion aplicativa.
- **Los checksums de las 53 migraciones cambiaron**: cualquier base que ya las tuviera aplicadas es
  incompatible y debe recrearse. Es aceptable hoy y no lo sera en cuanto exista una instalacion real.
- **Scripts que entran por `psql`** (`qa/fase-6-qa/perfiles-simulados/payment-validation-rule-seed.sql`,
  `ops/.../preload-pay-casuistica.sql`, `scripts/seed-audit-mt101-e2e.sql`) heredan el `search_path` de
  la base. El unico que necesita retoque es el primero, que cualifica `public.payment_validation_rule`
  de forma explicita.
- `Mt101RebuildRepository` ejecuta `nextval('mt101_rebuild_reference_seq')` sin cualificar. Funciona por
  el `search_path`, pero es el primer sitio que fallaria si alguien lo alterase.

## Alternativas descartadas

- **Cualificar tambien el SQL de Java.** Se intento y se revirtio con la medicion delante: eran **230
  literales** en 7 ficheros —no los 95 estimados— y ademas **23 clases de test con 96 `create table`**
  en sus fixtures, que crean el esquema a mano en `public`. El intento dejo 182 tests en rojo. El
  problema de fondo es que los fixtures duplican el esquema; el arreglo correcto seria que los tests
  usaran Flyway, no cualificar los fixtures. Queda como trabajo aparte.
- **Mover las tablas con `alter table ... set schema`** (la primera version de este ADR, `V104`). Valida
  y necesaria si hubiera instalaciones existentes; innecesaria pre-produccion, y deja el rastro
  incoherente de crear en un sitio para mover a otro.
- **Rangos de version disjuntos por modulo** (motor `V200+`, vertical `V500+`). Es **incompatible** con
  un historial compartido y `outOfOrder=false`: aplicada una `V500`, la siguiente `V200` del motor
  abortaria el arranque con *"Detected resolved migration not applied to database"*. Se sustituye por
  la invariante que si funciona: ninguna version reclamada por los dos modulos a la vez.
- **Dos instancias de Flyway con historial propio**. Exige partir retroactivamente el historial.
- **Normalizar el `search_path` desde `ConnectionPoolManager`**. El motor pasaria a conocer el nombre
  del schema del vertical: exactamente lo que ADR-021 prohibe.

## Evidencia

`SchemaSeparationCompatibilityTest` aplica las **103 migraciones** sobre un PostgreSQL real —contenedor
propio, no el compartido de la suite `compat-db`— y comprueba: las 22 tablas nacidas en su schema,
ninguna tabla del motor arrastrada, `staging_record` en el motor, la secuencia y las 5 funciones en su
sitio, las FK cross-schema vivas, el `search_path` resolviendo ambos lados sin cualificar **incluido el
JOIN cruzado**, y el historial unico en el schema del motor.

Verifica ademas el numero de migraciones aplicadas: sin esa asercion, un jar del vertical
desactualizado dejaria migraciones fuera y los tests de ubicacion fallarian con un mensaje que no
senala la causa. Ya ocurrio una vez durante la implementacion.

Comprobaciones deterministas sobre los 54 ficheros reescritos: cero tablas del vertical sin cualificar
en DDL ejecutable, cero tablas del motor cualificadas por error, cero prefijos duplicados, 13 FK al
vertical cualificadas y 2 al motor sin cualificar, y las 5 funciones coincidiendo con sus 5
invocaciones desde triggers.
