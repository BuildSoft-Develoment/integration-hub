# Scatter por table-streaming: page-chain (P1+P2+P3) — 2026-07-03

## Problema

El scatter async solo repartía records **materializados** (todos en memoria) y **lanzaba** si el input
era por table-streaming. A 1M+ registros eso no escala: OOM al materializar y, si se despachara todo
upfront, una tx gigante que además **bloquea el hilo del motor** durante la paginación. El doble check
del plan descartó el dispatch upfront por eso y por requerir recuperación a medida.

## Diseño: page-chain (cadena auto-propagante)

En vez de despachar N slices upfront (N desconocido con keyset paging), se encola **una página semilla**
atómica con la suspensión, y **cada consumer de página encola la siguiente** (cursor keyset avanzado)
antes de procesar la suya:

- **No bloquea el motor**: la paginación se distribuye entre workers (no en `suspendTask`).
- **Memoria acotada**: una página por consumer.
- **Recuperación automática**: at-least-once → la reentrega re-encola la siguiente (dedup por
  `idempotencyKey` determinista `page-i`) y re-procesa; sin mecanismo de recuperación a medida.
- **Paralelismo**: encolar-siguiente-antes-de-procesar hace correr el frente de dispatch adelante
  mientras el procesamiento se abre en abanico.

### P1 — Tracker open-ended + seal atómico

`task_async_dispatch.total_slices` pasa a **NULLABLE** (NULL = unsealed). Con NULL la condición terminal
(`completed+failed >= total`) es NULL en SQL → nunca cierra hasta el seal, evitando el cierre prematuro
si todas las slices completan antes de conocer el total. `openStreaming()` abre unsealed; `seal(total)`
es un `UPDATE` atómico condicional (`where status='PENDING' and total_slices is null`) que **reclama el
terminal** —cubriendo el caso en que ninguna slice futura lo dispararía—. (Commit `38feb450`.)

### P2 — Page-chain

- `AsyncPageWorkItem`: tabla/orderBy/filtros/batchSize + cursor + pageIndex + config + contexto (Nivel 2).
- `AsyncPageChainService`: `seed()` (openStreaming + encolar página 0, atómico con la suspensión) y
  `readAndChain()` (lee la página keyset y encola la siguiente si hay más).
- `ScatterDispatch` extendido: `.streaming(seedPage)` vs `.materialized(slices)`; `dispatchSlices` rutea.
- `AsyncTaskConsumer.consumePage` (kind=PAGE): lee+encola-siguiente, procesa records, cuenta la slice y,
  si es la última, **sella**. La reanudación la dispara exactamente uno (la slice/seal que cierra).
- `runTask`: quita el `throw`; si `resolvedInput.tableInput() != null` → scatter streaming.

### P3 — E2E

## Pruebas

- **`TaskAsyncDispatchRepositoryIT` 8/8** (+4 P1): seal-tras-completar, seal-antes-de-completar,
  tabla vacía `seal(0)`, seal idempotente.
- **`AsyncTaskConsumerTest` 17/17** (+3 P2): última página sella y reanuda; página intermedia encola
  pero no sella; página vacía sella sin ejecutar el provider.
- **`AsyncStreamingScatterE2EIT` 2/2** (P3, Testcontainers, tabla real): 5 filas / batchSize 2 → la
  cadena despacha **3 páginas** auto-propagadas, procesa los 5 records una vez, la última sella
  `total=3`, la tarea reanuda y el proceso **COMPLETED** (dedup: 3 filas PROCESSED); + tabla vacía →
  `seal(0)` inmediato → COMPLETED.
- **Regresión async 50/50**: scatter materializado, guard, once, DLQ, suspendible — sin cambios.

## Límites conocidos (documentados)

- **Fail-fast en medio de la cadena**: las páginas ya encoladas siguen drenando (sus commits son no-op
  sobre el tracker FAILED); la tarea falla correctamente, pero hay lecturas de páginas desperdiciadas.
- **Re-ejecución at-least-once**: una reentrega re-ejecuta el provider sobre su página (el conteo del
  tracker/inbox no se duplica, pero el trabajo del provider sí puede repetirse — como el scatter
  materializado). El provider debe ser idempotente.

## Estado

El scatter por table-streaming funciona a escala (memoria/tx acotadas, sin bloquear el motor, con
recuperación automática por at-least-once), verificado E2E. Cierra el último pendiente técnico del
feature async.
