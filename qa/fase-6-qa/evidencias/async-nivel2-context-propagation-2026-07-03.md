# Nivel 2: propagación de contexto en scatter → REST_CALL async-capable — 2026-07-03

## Motivación

El doble check anterior ([async-capability-guard](async-capability-guard-2026-07-03.md)) dejó a
`REST_CALL` como `UNSUPPORTED` porque sus plantillas resuelven variables de las **tareas origen**
(`${task-1.output}`) vía `TaskOutputSupport.mergeTaskOutputs`, y ese contexto no viajaba en el slice.
Con el envelope de solo config+records, **ningún provider de producción era async-safe**.

Este cambio implementa la **propagación de contexto serializable** en el camino scatter, reactivando
`REST_CALL`.

## Qué viaja ahora (camino SLICE)

`AsyncSliceWorkItem` lleva, además de `configuration` + `records`, el contexto **serializable** que el
motor síncrono inyecta:

- `taskOutputs` — outputs acumulados de las tareas origen elegidas (para `${task-N.x}`).
- `metadata` — metadata de ejecución de la tarea (recomputada determinísticamente en dispatch vía
  `taskOutputRegistry.taskMetadata`).
- `executionVariables` — variables de ejecución del proceso.

**No** viaja `sourcePayload` (stream no serializable): los providers que lo requieren (p.ej. `DB_WRITE`,
que abre el stream para el fingerprint/dedup del staging vía `sourceFileHash`) siguen `UNSUPPORTED`.

### Flujo

1. `runTask` (scatter) construye `ScatterDispatch` con `taskOutputs`/`metadata`/`executionVariables`.
2. `AsyncSliceDispatchService.dispatchSlices` los mete en cada `AsyncSliceWorkItem`.
3. `AsyncTaskConsumer.consumeSlice` rehidrata el `TaskContext` (`hydrateSliceContext`) antes de
   `executeRecords`, así que el provider resuelve variables igual que en el motor síncrono.

### Alcance / scope

- Solo el camino **scatter** (batch/per-record). El camino `once` sigue config-only: los records no
  viajan en once igual, y su payload lo comparte el **redrive del DLQ**, que re-encola desde la
  suspensión colgada y **no tiene contexto vivo** → propagarlo ahí sería incorrecto.
- `REST_CALL` → **`SLICE_ONLY`** (reactivado): usa records + variables de plantilla (ahora propagadas) y
  no usa `sourcePayload`.

## Costo a escala (1M registros)

El contexto se **duplica por slice** (cada slice es un mensaje de broker independiente). A `N =
ceil(registros / batchSize)` slices, `taskOutputs` se copia N veces. Para plantillas con pocos outputs
de origen el costo es marginal; si `taskOutputs` fuese muy grande, escala con N. Aceptado como trade-off
de esta etapa (mismo patrón con el que ya se duplicaba `configuration`).

## Pruebas

- **`AsyncTaskConsumerTest` 13/13** (+1 nuevo `sliceRehydratesPropagatedContext`): la slice lleva
  `taskOutputs`/`metadata`/`executionVariables` y el consumer los rehidrata en el `TaskContext` del
  provider (asserts sobre `context.attributes()`).
- **`ProcessTaskRuntimeAsyncGuardTest` 4/4**: el guard sigue correcto.
- **ITs scatter/async 9/9** (sin regresión, contexto vacío por defecto en los fixtures):
  `AsyncScatterGatherE2EIT` (1), `AsyncScatterWiringIT` (1), `AsyncTaskExecutionE2EIT` (3),
  `AsyncTaskDlqIT` (4).
- **Frontend**: sin cambios — `SLICE_ONLY` ya se gatea (visible en batch/per-record, oculto en once); la
  capacidad de `REST_CALL` fluye por `GET /api/task-types`.

## Estado

`REST_CALL` es el primer provider de producción genuinamente async-capable (scatter). `DB_WRITE` y los
demás que dependen de `sourcePayload` o suspenden siguen `UNSUPPORTED` (correcto). La cobertura se puede
seguir creciendo declarando providers que solo usen contexto serializable. Nivel 3 (suspensión anidada
para `MT101_STATUS`) queda pendiente.
