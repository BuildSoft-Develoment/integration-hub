# Scripts de bajada (rollback de esquema)

Aqui viven los scripts que **deshacen** una migracion destructiva. Lo exige la regla D7 de
[ADR-030](../../../docs/fase-3-arquitectura/adr/ADR-030-despliegue-automatizado-vm-pull-aprobacion-rollback.md).

## Cuando hace falta uno

Solo cuando la migracion es **destructiva**: `DROP COLUMN`, renombrado, estrechar un tipo, o
`NOT NULL` sin `DEFAULT`. Una migracion aditiva (`ADD COLUMN ... DEFAULT`, `CREATE TABLE`,
`CREATE INDEX`) no necesita script: para retroceder basta arrancar la imagen anterior con
`QUARKUS_FLYWAY_IGNORE_FUTURE_MIGRATIONS=true`.

## Convencion

Un fichero por migracion destructiva, con **su mismo numero de version**:

```
Vnnn__<nombre>.down.sql
```

Los numeros son globales: Flyway mezcla los dos directorios de `quarkus.flyway.locations` en un unico
historial, asi que no puede haber dos `Vnnn` aunque vengan de modulos distintos.

## Por que no viven en db/migration

Porque Flyway los escanearia, y falla de **dos formas distintas** segun el numero que lleven:

- **Con el mismo numero** que la migracion que deshacen —que es lo que manda la convencion de
  arriba— la aplicacion ni siquiera arranca:
  `Found more than one migration with version 101`.
- **Con un numero nuevo** arranca, y es peor: Flyway lo aplica **hacia adelante** en el siguiente
  despliegue, deshaciendo la migracion que acababa de aplicar.

Por eso quedan fuera de las rutas que Flyway escanea, y no por prudencia.

## Las dos mitades

Un script de bajada con solo el DDL **no sirve**: la imagen vieja tampoco arranca. Flyway valida al
migrar y aborta cuando el historial contiene versiones que su jar no lleva dentro. Hay que borrar
tambien esas filas:

```sql
-- 1. deshacer el DDL
ALTER TABLE system_theme_setting ADD COLUMN density varchar(20);

-- 2. y devolver el historial a donde estaba
DELETE FROM flyway_schema_history WHERE version IN ('101');
```

## Antes de aprobar, se ensaya

D15: contra un Postgres desechable por defecto, y en integracion solo si el script toca datos. El
ensayo **no** puede llevar `QUARKUS_FLYWAY_IGNORE_FUTURE_MIGRATIONS` puesta: con esa variable la
imagen vieja arranca aunque el script este mal, que es justo lo que el ensayo viene a descartar.

## Estado actual

Vacio, y es correcto. Las dos unicas migraciones destructivas del historial ya estan aplicadas en
todos los entornos, asi que escribirles un script hoy seria para un rollback que nadie va a hacer.
