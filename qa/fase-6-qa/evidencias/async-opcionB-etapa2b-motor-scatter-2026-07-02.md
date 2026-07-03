# Opción B — Etapa B2b: cableado del motor (sync/async en el camino de lotes) — 2026-07-02

Conecta el scatter-gather al motor: una tarea `batch`/`per-record` marcada `async:true` (con el
feature activo) se **reparte en N slices** en vez de ejecutarse in-process, atómicamente con la
suspensión. Responde la consulta: **B2b es el enrutador sync/async para tareas de lotes.**

## Dónde se decide sync vs async (respuesta a la consulta)

En `ProcessTaskRuntimeService.runTask`, `asyncTaskDispatchService.prepare(...)` (que envuelve
`TaskDispatchPlanner.plan(config).isAsync()` + el gate) decide:
- **no async** → ejecución in-process actual (streaming/fastpath o `executeByMode`) — sin cambios;
- **async + `once`** → per-task (Etapa 3);
- **async + `batch`/`per-record`** → **scatter** (Opción B): resuelve el input, parte los records en
  slices de `batchSize` y construye un `ScatterDispatch`.

Como el `FileReadTaskFastPath` ya rechaza async (F1), una tarea batch async **no** pasa por el
streaming: va por `runTask`, que ya tiene los records resueltos → **no se toca `StreamingPipelineService`**.

## Atomicidad (reusa el transactional-outbox del per-task)

`runTask` devuelve `TaskRunResult.suspendedScatter(..., scatterDispatch)`. El motor
(`ProcessExecutionService`) llama al nuevo overload `ProcessExecutionStateService.suspendTask(...,
ScatterDispatch)` que, en la **misma tx REQUIRES_NEW** de la suspensión, invoca
`AsyncSliceDispatchService.dispatchSlices` (`@Transactional(REQUIRED)` → se une): **abre el tracker
N→1 y encola los N work-items** junto con la suspensión. Nunca hay slices/tracker sin su suspensión, ni
suspensión sin sus slices (cierra la ventana que el doble check F-B1/F-B2 señaló).

## Salvaguardas (sin fallback silencioso)

- Input por **table-streaming** (unknown N) → **lanza** (`scatter no soporta table-streaming aún`);
  el scatter por-slice actual cubre records ya resueltos en memoria (los de taskOutputs). El streaming
  de N desconocido es un follow-up.
- **Sin records** → `generic(success)` (nada que repartir), no suspende colgado.

## Pruebas

- **`AsyncScatterWiringIT`** (Postgres) **1/1**: `suspendTask(..., scatter)` de 3 slices abre el
  tracker con `total=3` y encola **3** work-items `kind=SLICE` PENDING, con la tarea SUSPENDED — todo
  en una tx.
- **Sin regresión**: per-task `AsyncTaskExecutionE2EIT` 3/3, `ProcessExecutionSuspendResumeIT` 5/5
  (refactoricé `suspendTask` extrayendo `persistSuspension`, compartida por per-task y scatter),
  `ProcessExecutionStateServiceTest` 11/11, `FileReadTaskFastPathTest` 3/3, unidades async de B1–B3
  intactas.

## Estado del roadmap

| Etapa | Qué | Estado |
|---|---|---|
| B1 | Tracker N→1 atómico | ✅ |
| B2 | Dispatch por-slice (productor) | ✅ |
| B3 | Consumer por-slice + gather | ✅ |
| B2b | Cablear el motor (routing sync/async de lotes + suspend atómico) | ✅ (esta entrega) |
| B4 | Fallos parciales: requeue por-slice (hoy fail-fast) | pendiente |
| B5 | Front: toggle sync/async + transporte + paralelismo + badge | pendiente |
| — | Scatter para input por table-streaming (unknown N) | follow-up |

El lazo scatter-gather está **cableado y atómico**; falta la política de requeue por-slice (B4) y el
front (B5). El E2E completo runTask→N consumers→gather→COMPLETED se apoya en: wiring atómico (este IT)
+ gather (B3 unit) + la ruta de reanudación (per-task E2E).
