# Fix: aislamiento por conexión en el scheduler de lifecycle MT101

**Fecha:** 2026-07-07
**Rama:** `fix/mt101-lifecycle-scheduler-connection-isolation`
**Archivo:** `platform-app/.../service/payments/swift/Mt101RebuildService.java`

## Síntoma

Con la app corriendo, el `Mt101RebuildLifecycleScheduler` fallaba **cada ~60s**:

```
ERROR [...Mt101RebuildLifecycleScheduler] MT101 rebuild lifecycle sync failed:
  java.lang.IllegalStateException: Cannot synchronize active MT101 rebuild lifecycles
Caused by: org.postgresql.util.PSQLException: FATAL: password authentication failed for user "postgres"
```

La app quedaba **UP** (datasource por defecto sano, health `Database connections health check: UP`), pero el sync de lifecycle no avanzaba nunca y el log se llenaba de errores.

## Causa raíz

`Mt101RebuildService.synchronizeActiveLifecycles()` sincroniza:
1. el `defaultDataSource`, y luego
2. **cada conexión JDBC activa** registrada (`connectionPoolManager.activeJdbcConnectionRefs()`),
   resolviendo su datasource desde el `configuration_json` de `connection_definition`.

Había una conexión registrada (`bdtrama`, id=1) apuntando a **`localhost:5432`** con
password `ADMIN`, mientras el Postgres real de la app está en **`localhost:5433`** con
password `admin`. Algo en 5432 rechazaba esas credenciales. Como los dos pasos estaban en un
**único `try`**, el fallo de esa sola conexión lanzaba `IllegalStateException` y **abortaba el
sync completo** (incluido el trabajo ya hecho del default y las demás conexiones sanas), y se
repetía en cada tick.

Es decir: **una conexión externa mal configurada bastaba para inutilizar el scheduler de
lifecycle para TODAS las conexiones**.

## Cambio

Se aísla cada `connectionRef` en su propio `try/catch`:

- El `defaultDataSource` es crítico → su fallo **se propaga** (lo cubren los health checks).
- Cada conexión JDBC externa que falle se **registra fuerte** (`LOG.errorf` con el
  `connectionRef` y la causa) y **se continúa** con las demás. *Fail-loud por conexión,
  resiliente en el agregado* — no es un fallback silencioso: el fallo sigue siendo visible,
  pero acotado a la conexión culpable.

Antes: `MT101 rebuild lifecycle sync failed: ... Cannot synchronize active ...` (abort total).
Después: `MT101 lifecycle sync skipped JDBC connection 'bdtrama': FATAL: password auth...`
(la sana avanza; solo se salta la rota).

## Pruebas

`Mt101RebuildServiceTest` (Testcontainers):

- **Nuevo** `schedulerIsolatesFailingJdbcConnectionAndStillSyncsHealthyOnes`: una conexión
  rota (`getConnection()` lanza el error real de auth) puesta **primero**, seguida de una sana
  con un run activo. Se verifica que `synchronizeActiveLifecycles()` **no lanza**, devuelve `1`
  y el run de la conexión sana avanza a `ARCHIVED`.
- **Sin regresión**: `schedulerDiscoversActiveRunsInNonDefaultJdbcConnections` y
  `synchronizeLifecycleAdvancesQuarantineUntilFinancialClosure` siguen verdes (3/3).

## Nota de entorno (dato, no código)

La conexión `bdtrama` (id=1) del entorno local está mal configurada (puerto 5432 en vez de
5433). El fix de código evita que rompa el scheduler, pero la conexión sigue siendo inválida:
conviene **corregir su puerto a 5433** (y password `admin`) o **desactivarla** si no se usa.
