# Implementación — claim atómico distribuido de `process_execution` (#8, v53-fix)

Fecha: 2026-07-05
Alcance: implementa el diseño del [análisis previo](2026-07-05-analisis-claim-distribuido-process-execution.md).
Cierra el doble-dispatch en cluster (`PENDING → RUNNING` deja de ser read-then-write) y habilita recuperación segura
de ejecuciones huérfanas con la regla `NEEDS_RECONCILIATION`. Sin rutas legacy.

## Cambios

### Esquema (V86)
`process_execution` += `execution_owner`, `execution_token`, `execution_lease_until`, `execution_heartbeat_at`,
`execution_attempt` + índice `(status, execution_lease_until)`. Nuevo `ExecutionStatus.NEEDS_RECONCILIATION`.

### Claim atómico distribuido
`ProcessExecutionRepository.claimForRunning` = `UPDATE process_execution SET status='RUNNING', owner, token, lease,
heartbeat, attempt+1, started_at=coalesce(started_at, now) WHERE id=? AND status='PENDING'`. Devuelve filas afectadas:
**1 = este nodo ganó; 0 = otro nodo la tomó antes**. `ProcessExecutionStateService.claimProcessForExecution` lo
envuelve (reemplaza el read-then-write `markProcessRunningIfPending`, eliminado). El dispatcher lo usa: en cluster,
solo el nodo cuyo UPDATE afecta la fila despacha; los demás ven 0 y siguen — sin doble-dispatch. El
`synchronized(dispatchMonitor)` queda como optimización intra-JVM, ya no como única barrera.

### Heartbeat (evita falso-reclamo)
El dispatcher (`@Scheduled` cada 2s) trackea las ejecuciones que ESTE nodo tiene activas (`id → token`) y renueva su
lease (`renewLease`, solo si sigue siendo dueño por token y RUNNING). Con lease de 30s renovado cada 2s, una ejecución
sana nunca vence.

### Recuperación de huérfanas (regla de seguridad money-path)
Nuevo `@Scheduled` (cada 30s) → `recoverExpiredExecutions(limit, "MT101_PAY")`: para cada RUNNING con lease vencido
(nodo caído), **si ya inició MT101_PAY** (`hasStartedTaskType`) → `NEEDS_RECONCILIATION` (nunca re-ejecución a ciegas;
se resuelve por STATUS/RECONCILE o `resolve-uncertain-normal-pay`); **si no** → `PENDING` (re-encolar para un claim
fresco). `recoverExpiredRunning` es atómico (`WHERE status='RUNNING' AND lease<now`), evitando doble recuperación
entre nodos.

## Pruebas (evidenciadas)

- `ProcessExecutionStateServiceTest` (12, +1): `claimProcessForExecutionSucceedsWhenAtomicUpdateAffectsTheRow`,
  `claimReturnsFalseWhenAnotherNodeWonTheClaim`, y la **regla money-path**:
  `recoverRoutesAnExpiredExecutionThatStartedPayToNeedsReconciliation` (PAY iniciado → `NEEDS_RECONCILIATION`) +
  `recoverReQueuesAnExpiredExecutionThatDidNotStartPay` (sin PAY → `PENDING`).
- **Suite Mt101 + `ProcessExecutionStateServiceTest`: 303 tests, 0 fallos** (BUILD SUCCESS). Los E2E con Flyway real
  (`Mt101AllTasksProcessE2EIT`, `Mt101MillionFileProcessE2EIT` 1M, `Mt101OutboundEndToEndIT`) **ejercitan el JPQL real
  del claim** (el pipeline despacha vía `BackgroundProcessExecutionDispatcher` → `claimForRunning`; el log confirma
  "claimed by node-…") y validan la migración V86 + el mapeo de las columnas nuevas al arrancar.
- **Motor de ejecución (regresión del cambio central): 21 tests, 0 fallos** — `AsyncTaskExecutionE2EIT` (dispatch
  async), `AsyncScatterRecoverySchedulerIT`, `ProcessExecutionFailurePropagationIT`, `ProcessExecutionSuspendResumeIT`,
  `ExecutionApiMapperTest` (mapeo del enum con `NEEDS_RECONCILIATION`), `ProcessTaskRuntimeAsyncGuardTest`,
  `ProcessTaskRuntimeSyncProgressTest`.

## Nota de correctitud

- La atomicidad del claim es inherente al `UPDATE ... WHERE status='PENDING'` (semántica SQL estándar): dos nodos que
  intenten reclamar la misma fila, solo uno afecta 1 fila.
- **Defensa en capas**: aun sin este cambio, v51/v52 ya impedían el doble-envío a nivel de fragmento; el claim
  distribuido cierra el doble-dispatch de proceso de raíz (corrección/eficiencia en cluster) y habilita la
  recuperación segura de huérfanas — que antes no existía (una RUNNING de un nodo caído quedaba colgada para siempre).

## Conclusión

`PENDING → RUNNING` es ahora un claim atómico distribuido: en multi-nodo no hay doble-dispatch. El heartbeat mantiene
vivas las ejecuciones sanas y la recuperación reclama las huérfanas con la regla estricta de no re-ejecutar a ciegas un
proceso que ya inició PAY (`NEEDS_RECONCILIATION`). Cerrado el pendiente #8 de cluster-readiness.
