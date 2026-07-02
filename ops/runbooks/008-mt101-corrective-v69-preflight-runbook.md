# Runbook 008 — Release gate del preflight de V69 (mt101 correctivo)

Ámbito: despliegue de la migración `V69__mt101_corrective_pay_plan_validate_and_sanitize.sql`, que sanea punteros
`active_plan_revision` a revisiones no-ACTIVE y luego ejecuta `VALIDATE CONSTRAINT` de las FKs históricas
(`fk_pay_plan_run`, `fk_pay_plan_fragment_plan`). Si la base destino tiene datos huérfanos, ese `VALIDATE` **falla y
aborta el despliegue**. Este runbook lo convierte en un gate de release con decisión auditada.

## ¿Es obligatorio si todavía no hay producción?

Depende del estado de la base destino, no de si es "producción":

| Escenario | ¿Preflight obligatorio? |
|---|---|
| Base nueva y vacía (V1→…→V69 desde cero) | No necesario, pero **debe ejecutarse y dar 0** (verificación barata). |
| Ambiente DEV/QA/UAT ya poblado por versiones anteriores | **Sí**. |
| Restauración desde backup, clon o carga manual | **Sí**. |
| Upgrade futuro de producción sobre base poblada | **Sí (gate de despliegue)**. |

No es un bloqueador para seguir desarrollando: es una utilidad de operación que se ejecuta **en el momento de
promover** a un ambiente con datos. En una base limpia devuelve 0 filas y `VALIDATE` pasa sin incidencias.

## Gate de release (pasos)

1. **Ejecutar el preflight** (solo lectura) contra la base destino, ANTES de aplicar V69:
   ```
   psql "$TARGET_DB_URL" -f ops/sql/mt101-corrective-v69-preflight.sql
   ```
2. **Evaluar**: las tres primeras consultas (planes sin run; fragmentos de plan sin cabecera; punteros
   `active_plan_revision` que no terminan en una cabecera ACTIVE) deben devolver **conteo 0**. Si alguna devuelve
   filas → **detener la promoción**.
3. **Resolver con evidencia**: corregir, archivar o invalidar los registros huérfanos conservando traza (quién, qué,
   por qué). No borrar a ciegas: revisar caso por caso (ver §"Notas" sobre runs en vuelo).
4. **Aplicar V69** una vez el preflight da 0/0/0.
5. **Verificar** que el `VALIDATE` de las FKs pasó (Flyway en verde; sin constraints `NOT VALID` residuales en
   `mt101_corrective_pay_plan` / `mt101_corrective_pay_plan_fragment` / `mt101_rebuild_run`).

## Consideración de actualización de algoritmo V2 → V3 (pay_plan_set_hash)

El algoritmo del hash del conjunto es `MT101_PAY_PLAN_SET_V3`. La aprobación exige que run, revisión ACTIVE y ledger
coincidan en algoritmo + conteo + hash (ver `Mt101CorrectiveLifecycleService`). Implicaciones de despliegue:

- Un run **REQUESTED** firmado con un algoritmo anterior se **INVALIDA al aprobar** con motivo explícito de versión
  (no es un fallo de migración; requiere re-solicitud). La consulta informativa (4) del preflight los lista.
- Un run **EXECUTING** NO debe invalidarse automáticamente durante el despliegue: puede estar esperando respuesta del
  banco. La validación de versión solo corre en la transición REQUESTED→EXECUTING, así que el código **no** toca un
  run ya EXECUTING; aun así, el gate operativo debe exigir, antes de promover:
  - **sin PAY EXECUTING en vuelo**, o
  - resolverlos vía MT101_STATUS / MT101_RECONCILE a un estado terminal (SENT, REJECTED o UNCERTAIN) conservando
    evidencia, antes de aplicar V69 / promover v50.

## Notas

- El preflight es **solo lectura** (no modifica datos): seguro de correr en cualquier ambiente.
- Para runs REQUESTED/EXECUTING cuyo puntero anularía el saneamiento de V69, la transición a INVALIDATED/UNCERTAIN
  según evidencia de envío + acción append-only es una **tarea operativa deliberada** (stateful), no apta para una
  migración automática.
- Script asociado: [`ops/sql/mt101-corrective-v69-preflight.sql`](../sql/mt101-corrective-v69-preflight.sql).
