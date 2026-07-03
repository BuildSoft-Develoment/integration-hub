# Auto-recuperación de la page-chain estancada — 2026-07-03

## Motivación

La recuperación de la page-chain rota ([async-page-chain-recovery](async-page-chain-recovery-2026-07-03.md))
dejó una **palanca manual** (`requeueSuspension`). Este incremento la **automatiza**: un scheduler detecta
scatters estancados y re-inyecta su última página, sin intervención de ops.

## Diseño

- **`last_progress_at`** (migración V84) en `task_async_dispatch`: se actualiza en **cada mutación**
  (openStreaming / recordSliceCompleted / recordSliceFailed / recordDispatchedPage / seal). Es la señal de
  actividad para detectar estancamiento (no basta `created_at`: una cadena larga sana también es "vieja").
- **`findStalledStreaming(cutoff, limit)`**: scatters `PENDING` + streaming (`last_page_json != null`) +
  `last_progress_at < cutoff`.
- **`AsyncTaskDlqService.recoverStalledStreamingScatters(threshold, limit)`**: por cada estancado llama
  `requeueSuspension` (re-inyecta la última página). `requeueStreamingPage` **toca `last_progress_at`** al
  re-inyectar → no re-dispara antes de que la página tenga chance de procesarse.
- **`AsyncScatterRecoveryScheduler`** (`@Scheduled`, `concurrentExecution=SKIP`): **gated OFF** por
  `tasks.async.recovery.enabled` (default false). Solo hace falta bajo `failure-strategy=dead-letter-queue`
  (con `fail`, el restart+redelivery ya reanuda). Config: `stall-threshold=5m`, `every=120s`,
  `max-per-sweep=50`.

**Seguro ante falsos positivos**: re-inyectar una página de un scatter que en realidad progresó/cerró es
idempotente (dedup por `page-i` + cortocircuito por `isScatterTerminal` en el consumer).

## Pruebas

- **`TaskAsyncDispatchRepositoryIT` 10/10** (+1): `findStalledStreaming` devuelve solo el streaming
  estancado (no el materializado ni el de progreso reciente).
- **`AsyncStreamingScatterE2EIT` 6/6** (+1, Testcontainers): `stalledChainIsAutoRecoveredBySweep` — se
  rompe la cadena (page-1 perdida) → `recoverStalledStreamingScatters(threshold=0)` re-inyecta → drain →
  proceso **COMPLETED**, los 5 records procesados.
- **Regresión** tracker/gather/scatter/DLQ verde (el `last_progress_at` en las mutaciones no cambia la
  lógica de conteo/seal).

## Estado

Cierra el pendiente explícito de (2): la recuperación de la page-chain es ahora **automática** (gated,
para el modo dead-letter-queue). Con esto el feature async no deja procesos colgados por una cadena rota
sin intervención. Pendiente menor documentado: optimización de escala de `recordDispatchedPage` (guarda el
JSON completo por página; el contexto es invariante) — marginal, no forzada.
