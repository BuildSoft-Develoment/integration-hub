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

---

## Doble check (2 bugs reales encontrados)

### Bug A — `records_processed` podía RETROCEDER bajo concurrencia
El upsert escribía el valor **absoluto** (`set records_processed = ?3`). En los modos paralelos,
varios hilos cruzan el umbral; el reporter emite valores crecientes por CAS, pero **el orden de
aplicación de los `upsert()` en la DB no está garantizado**: un `upsert(105000)` podía aplicarse
antes que un `upsert(51000)` y dejar la fila en 51000 → el contador **regresa** y la UI ve el
progreso ir hacia atrás.
- **Fix**: `do update set records_processed = greatest(task_sync_progress.records_processed, ?3)`
  (+ `updated_at` solo avanza cuando el valor sube). Monotonía garantizada en la DB, indiferente al
  orden de aplicación. Blinda **ambos** caminos (fastpath + executeByMode con slices en paralelo).
- **E2E** (`AsyncTaskDlqIT.syncProgressIsMonotonicUnderOutOfOrderUpserts`, Postgres real):
  `upsert(500k)` seguido de `upsert(200k)` tardío ⇒ queda 500k; luego `upsert(750k)` ⇒ 750k.
- El unit `SyncProgressReporterTest` se corrigió: su aserción de monotonía por orden-de-llamada era
  teóricamente flaky (asumía orden de llamada = orden de aplicación). Ahora el repo capturador emula
  `GREATEST` y se verifica la monotonía del valor **efectivamente almacenado**.

### Bug B — fuga de progreso entre tests (destapada por el fix A)
`GREATEST` hizo fallar `CatalogAndExecutionResourceIT` (`recordsProcessed` esperado 2, real **5**):
el `@BeforeEach` truncaba todo **menos `task_sync_progress`** y, con `RESTART IDENTITY`, el `peId`
reinicia a 1 en cada test → el otro test del fastpath (5 registros, mismo `peId`/tarea sink) dejaba
`task_sync_progress(1, 2, 5)` y `GREATEST` conservaba el 5 en vez de pisarlo. Antes el overwrite lo
enmascaraba.
- **Fix**: `task_sync_progress` agregado al `TRUNCATE` de ambos ITs. (En producción no aplica: los
  `peId` son únicos/monótonos, no se reutilizan.)

### Regresión tras el doble check
- `SyncProgressReporterTest` 4/4, `AsyncTaskDlqIT` **9/9** (nuevo test de monotonía), `CatalogAndExecutionResourceIT` 3/3.
