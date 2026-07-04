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

## Estado
Cobertura e2e/test de la capa async cerrada. Los pendientes restantes son del backbone async (Etapa 4:
adaptador de broker + complete-from-external-result; puesta en marcha/tuning ops), de mayor alcance.
