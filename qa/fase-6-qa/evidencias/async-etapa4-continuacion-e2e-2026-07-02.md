# Async Etapa 4 — continuación (complete-from-external-result) + E2E — 2026-07-02

Cierra el lazo async (ADR-015): tras ejecutar la tarea offloada, el consumer **reanuda el proceso**
con el resultado ya calculado —sin re-invocar al provider— y continúa el pipeline downstream. Probado
**end-to-end** (productor → outbox → consumer → completación → COMPLETED) sin necesidad de broker.

## Hallazgo del análisis (por qué el resume existente no servía)

`ProcessExecutionResumeService.resumeTransactional` re-invoca `SuspendableTaskProvider.resume()`. Una
tarea async ya ejecutada en el consumer NO debe re-ejecutarse; hay que **aplicar** su resultado. Pero
la *cola* del resume (completeTask/failProcess + continuación downstream via `continueAfterResume`) es
idéntica a lo que async necesita. Solución SOLID: **extraer esa cola** y reusarla.

## Piezas

- **`ProcessExecutionResumeService`** refactor (DRY):
  - Extraída la cola terminal a `finishTerminalResult(...)` (completeTask/failProcess + rehidratar
    envelope de continuación) — compartida por el resume por callback y la completación async.
  - Extraída la continuación fuera de transacción a `runContinuation(...)` — compartida.
  - Nuevo `completeFromExternalResult(peId, tdId, result)` + `completeTransactional`: correlaciona la
    tarea suspendida por `(processExecutionId, taskDefinitionId)`, la marca reanudada y aplica el
    resultado **sin** re-invocar al provider. Idempotente: si ya fue reanudada → `Outcome.NOT_FOUND`.
  - Implementa el puerto `AsyncTaskCompletion`.
- **`AsyncTaskCompletion`** (puerto, DIP): el consumer depende de esta abstracción, no del motor.
- **`ProcessTaskExecutionRepository.findActiveSuspendedByExecutionAndTask`**: lookup de la suspensión
  por ids (el consumer los conoce del envelope).
- **`AsyncTaskConsumer`** wiring: `execute → completeFromExternalResult → registra inbox`. El orden
  (completar antes de registrar) hace que un crash entre ambos se auto-cure: la reentrega re-ejecuta
  (at-least-once) y la completación vuelve a ser idempotente, sin dejar el proceso colgado.

## Correlación y semántica

- El `AsyncTaskEnvelope` ya lleva `processExecutionId` + `taskDefinitionId` → correlación directa, sin
  mapear el token de resume.
- Éxito → completeTask(outputs) + continúa downstream (o completa el proceso). Fallo de negocio →
  failTask + failProcess. Ambos van por la misma cola que el resume.
- No re-suspensión en el consumer: un provider que devuelve `suspended` es DEAD (no hay forma de
  reanudarlo desde ahí) — sin degradar en silencio.

## Pruebas

- **`AsyncTaskExecutionE2EIT`** (Postgres, flag async ON) **3/3**:
  1. Tarea async suspende + encola (provider NO corre in-process); el consumer la ejecuta, registra
     `task_inbox=PROCESSED` y **el proceso queda COMPLETED** (tarea reanudada).
  2. La completación **continúa la tarea downstream** sola (2 ejecuciones, proceso COMPLETED).
  3. **Reentrega idempotente**: la 2ª entrega de la misma trama → DUPLICATE, sin re-ejecutar el
     provider ni re-reanudar (1 sola ejecución, 1 sola fila PROCESSED, proceso COMPLETED).
- **`AsyncTaskConsumerTest`** **8/8** (ahora verifica que la completación se invoca en success/failure
  y NO en duplicate/dead/poison/suspended, con fake del puerto).
- **Sin regresión del resume por callback**: `ProcessExecutionSuspendResumeIT` **5/5**,
  `ProcessExecutionFailurePropagationIT` **2/2** (la cola extraída es idéntica).
- Batería async unitaria completa **40/40** verde.

## Estado

Lazo async **funcional y probado end-to-end**. Falta solo el binding de transporte real:
un adaptador `@Incoming` (patrón `tasks.*`) que saque la trama de Kafka y delegue en
`AsyncTaskConsumer.consume` + un IT Kafka (Testcontainers). Es una decisión de topología (¿platform-app
auto-consume o un worker aparte, como `audit-consumer`?) que conviene acordar antes de cablear el canal.
