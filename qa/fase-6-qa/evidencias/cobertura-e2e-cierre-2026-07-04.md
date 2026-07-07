# Cierre de cobertura e2e (#1 + #2) — 2026-07-04

Cierre de los dos pendientes "rápidos y de valor" de la capa de observabilidad async.

## #1 — E2E de render de F2 en verde
El e2e de progreso (`shows live progress in the execution detail`) daba flaky localmente. Con el source
**estable** (sin mis ediciones churneando Quinoa) el run pasó **verde en 7.5s** contra el stack real
(:8080). Conclusión: la flakiness previa era el rebuild continuo de Quinoa por mis ediciones, no el
test. **Los tres e2e (F1, F2, F3) dan verde reproducible.** (Sin cambio de código.)

## #2 — Cobertura del progreso sync por executeByMode (call-site)
El upsert throttled del camino `executeByMode` (batch/table-input) vivía en `ProcessTaskRuntimeService`
sin test que cubriera el call-site (el upsert del repo sí estaba cubierto en `AsyncTaskDlqIT`).

- **`ProcessTaskRuntimeSyncProgressTest`** (2): stubea `executeByMode` para invocar el executor real con
  12 slices y verifica:
  - **Throttling**: upsert sólo en `batchNumber` 0 y 10 (`% PROGRESS_EVERY_N_SLICES == 0`), con el
    `batchTo` acumulado (10 y 110); no uno por slice; el slice 5 (batchTo=60) NO se persiste.
  - **Best-effort**: un `RuntimeException` del upsert NO rompe la tarea (el trabajo real ya se hizo).

- **Hallazgo documentado**: `batchNumber` es **0-based** en `executeByMode`, así que el slice 0 siempre
  dispara un upsert → incluso tareas cortas (<10 slices) registran progreso. La contracara: el último
  slice sólo se captura si su índice es múltiplo de 10 (el valor final autoritativo vive en
  `process_task_execution`; esto es progreso en vivo, no el conteo final).

## #2 (reforzado) — E2E de MOTOR COMPLETO del progreso sync por executeByMode
El unit `ProcessTaskRuntimeSyncProgressTest` STUBEA `executeByMode`, así que valida el call-site *dado*
un modelo de slices — no la integración real. Para un tema delicado eso no basta; se agrega un IT de
motor completo contra Postgres real:

- **`SyncProgressExecuteByModeIT`** (@QuarkusTest): proceso FILE_READ → **TEST_FOLLOW_UP** ejecutado por
  el motor. Con `batchSize=1` y 12 filas hay 12 slices; el motor persiste `records_processed=11` en
  `task_sync_progress` (upsert en slices 0 y 10, GREATEST) y el sink corre 12 veces. Valida la
  integración real: semántica de slices de `executeByMode`, el upsert throttled y su persistencia en DB.

- **Hallazgo del doble check (real)**: el fastpath (`FileReadTaskFastPath.supports`) aplica a FILE_READ →
  **cualquier `BatchTaskProvider`** (línea 76: `provider instanceof BatchTaskProvider`), NO solo DB_WRITE.
  Un test ingenuo FILE_READ→TEST_SCATTER_BATCH habría bypasseado `executeByMode` en silencio (fastpath) y
  dado falsa confianza. Por eso el sink del IT es un `TaskProvider` plano (TEST_FOLLOW_UP), forzando el
  camino `executeByMode`.

## Estado
Cobertura e2e/test de la capa async cerrada (unit + motor completo). Los pendientes restantes son del
backbone async (Etapa 4: adaptador de broker + complete-from-external-result; puesta en marcha/tuning
ops), de mayor alcance.
