# Progreso sync del streaming fastpath (FILE_READ→DB_WRITE) — 2026-07-03

## Contexto
El doble check con E2E dejó documentado un gap: el progreso sync (tabla `task_sync_progress`)
solo cubría el camino `executeByMode` (batch table-input). El **streaming fastpath**
`FILE_READ→DB_WRITE` — el caso 1M sync más común — **no pasa por `executeByMode`**
(`StreamingPipelineService`/`StreamingPipelineWorker`), así que no reportaba progreso: la UI
solo veía el estado terminal, sin avance intermedio.

## Cambio
Instrumentado el fastpath con un `SyncProgressReporter` (nuevo) que upsertea a
`task_sync_progress` bajo la tarea **sink** (donde aterrizan las escrituras):

- **Dos chokepoints** de escritura en `StreamingPipelineWorker` cubren los 3 modos:
  `processSingleFile` (secuencial/parallel-por-archivo) y `processBatch` (parallel-por-lote).
  Tras cada escritura exitosa se llama `reporter.batchWritten(n)`.
- **Throttling**: upsert cada `50_000` registros (no por lote) → a 1M son ~20 upserts, no uno
  por lote. Contador acumulativo del run; el upsert escribe el **valor absoluto** (monótono).
- **Flush final** en `StreamingPipelineService.run()` dentro de `finally` → persiste la cola por
  debajo del umbral **aun si el pipeline falla** (se ve el avance real logrado hasta el corte).
- **Thread-safe**: `AtomicLong` + CAS sobre `lastFlushed` ⇒ un solo upsert por cruce de umbral
  bajo lotes concurrentes. **Best-effort**: un fallo de progreso NO rompe el pipeline (debug log).

## Pruebas

### Unit — `SyncProgressReporterTest` (4)
- `doesNotUpsertPerBatchAndFlushesTail`: 5×10k ⇒ 1 upsert al cruzar 50k; +3k ⇒ sin upsert; flush ⇒ 53k.
- `smallRunOnlyPersistsOnFlush`: 2 registros (como el E2E) ⇒ solo persiste en el flush final.
- `flushIsIdempotentAndZeroIsNoOp`: run vacío no persiste; doble flush no re-upsertea.
- `isThreadSafeAndConverges`: 200 lotes concurrentes de 5k = 1M ⇒ último valor = 1_000_000 exacto,
  ≤25 upserts (throttled, no 200), valores monótonos crecientes.

### E2E — `CatalogAndExecutionResourceIT` (3, Testcontainers Postgres)
`shouldCreateAndExecuteConfiguredProcess` ahora asserta que tras COMPLETED el poll de progreso
del fastpath devuelve `syncTasks.size()==1` y `syncTasks[0].recordsProcessed==2` (las 2 filas
del CSV). Antes este assert se había quitado porque el fastpath no reportaba; ahora sí.

### Regresión
- `StreamingPipelineServiceTest` 7/7 (pipeline no revienta al reportar).
- `ProcessTaskRuntimeAsyncGuardTest` 6/6.
- `AsyncTaskDlqIT` 8/8 (camino `executeByMode` + agregación en `/progress` intactos).

## Resultado
Progreso sync cubierto por **los dos** caminos de ejecución sync (executeByMode + fastpath),
ambos a `task_sync_progress`. El gap documentado en el doble check anterior queda cerrado.
