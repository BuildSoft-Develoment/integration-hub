# Async Etapa 3 — productor cableado en el motor (runTask) — 2026-07-02

Cablea la decisión de despacho async (ADR-015) en el motor de ejecución. Una tarea marcada
`async: true` (con el feature activo) se **offloada al broker** en vez de ejecutarse in-process: el
motor encola el work-item en el outbox durable (Etapa 1) y suspende la tarea; el relay lo publica y
el consumer (Etapa 2) lo ejecuta. **Gated OFF** por defecto → cero cambio de comportamiento.

## Hallazgo del doble check (acoplamiento Etapa 3 ↔ 4)

El resume existente (`ProcessExecutionResumeService.resumeTransactional`) exige que el provider sea
`SuspendableTaskProvider` y **re-invoca** `resume()`. Una tarea async suspendida (p.ej. `DB_WRITE`, no
suspendable) **no** podría reanudarse por ese camino. Por eso el despacho async y la **continuación
complete-from-external-result** (Etapa 4) están acoplados: la suspensión async se resolverá con un
camino nuevo que reusa `continueAfterResume` (que **no** re-invoca al provider) aplicando el resultado
que el consumer registró en el `task_inbox`. Consecuencia: el gate se mantiene **OFF** hasta que la
Etapa 4 exista; encenderlo sin ella dejaría el proceso suspendido — documentado, no silencioso.

## Piezas (SOLID)

- **`AsyncTaskDispatchService`** (productor): `planner.plan(config)` → si async y gate on, construye el
  `AsyncTaskEnvelope` (idempotencyKey determinista via `TaskIdempotency`, `payload` = JSON de la
  `configuration`) y lo **encola** por el puerto `TaskOutboxStore` (DIP). Devuelve `AsyncSuspension`
  (idempotencyKey + transport) o vacío (síncrono).
- **`TaskOutboxStore.enqueue`** promovido al **puerto** (antes solo en el adaptador) → el productor
  depende de la abstracción, no del JPA.
- **`ProcessTaskRuntimeService.runTask`** (single-path): antes de `provider.execute`, consulta el
  dispatch; si es async devuelve `TaskRunResult.suspended` con `{asyncDispatch, idempotencyKey,
  transport}` → el motor persiste token + `suspendedState` + continuación por la maquinaria M-2 ya
  existente (sin código nuevo de suspensión).
- **Gate**: `tasks.async.execution.enabled=false`.

## Sin caminos legacy / sin fallback silencioso

- Gate OFF → `dispatch` devuelve vacío siempre → **toda** tarea corre síncrona como hoy.
- Async + `executionMode` batch/per-record → **lanza** `IllegalStateException` (el offload por lotes
  aún no existe); **no** cae a síncrono en silencio.
- Async sin `processExecutionId`/`taskDefinitionId` → **lanza** (no hay idempotencyKey determinista).
- Contrato del payload simétrico con el consumer: `envelope.payload()` = JSON de la `configuration`.
  Limitación documentada: solo son offloadables tareas cuyo input está en la configuración (la
  propagación de contexto en vivo —readResult/taskOutputs— es trabajo posterior).

## Pruebas

- **`AsyncTaskDispatchServiceTest`** (unit, fake outbox + planner real): **6/6** — gate off = síncrono
  sin encolar; config síncrona con gate on = síncrono; async encola envelope con campos correctos
  (taskType/ids/transport/traceId/idempotencyKey) y `payload` = config JSON; idempotencyKey
  determinista; override de transport en mayúsculas; async sin ids lanza.
- **No regresión del motor** (gate OFF por defecto): `ProcessExecutionSuspendResumeIT` **5/5**
  (runTask + suspensión + resume intactos), `CatalogAndExecutionResourceIT` **3/3** (ejecución
  síncrona normal). `TaskOutboxRelayTest` **4/4** tras extender el puerto.

## Estado

Productor cableado y probado, inerte en producción (gate OFF). Pendiente **Etapa 4** para cerrar el
lazo end-to-end: (1) adaptador de broker (`@Incoming` patrón `tasks.*`) que delega en
`AsyncTaskConsumer`; (2) continuación *complete-from-external-result* que, con el resultado del
`task_inbox`, marca COMPLETED la tarea suspendida (por correlación de `idempotencyKey`) y continúa el
pipeline via `continueAfterResume`; (3) IT Kafka end-to-end (Testcontainers).
