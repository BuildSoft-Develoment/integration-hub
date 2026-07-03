# Doble check async a escala (1M registros) — 2026-07-02

Revisión del feature async (ADR-015) bajo la lente de 1 millón de registros. Hallazgos ordenados por
severidad; **F1 y F2 corregidos y verificados**, F3-F5 reportados con recomendación.

## Contexto clave: ¿por dónde fluyen 1M registros?

Un proceso de 1M **registros** los procesa con una tarea `batch`/`per-record`, que en el camino de
alto volumen se **fusiona en el `FileReadTaskFastPath`** (streaming a memoria constante) y **omite
`runTask`**. Es decir: los 1M registros **no** viajan por el despacho async — y **no deben**, porque
el async está scopeado a tareas `once` (ver F5). El async ofrece robustez/offload por-tarea, no
throughput por-record.

## F1 (HIGH, corregido) — el fast path ignoraba `async` en silencio

`FileReadTaskFastPath.supports()` no consultaba el flag `async`. Una tarea `batch` marcada
`async:true` en un proceso de gran volumen tomaba el fast path y corría **síncrona en silencio**,
ignorando el flag — mientras que por `runTask` el mismo caso lanza un error explícito. Fallback
silencioso e inconsistente (viola "sin caminos legacy").

**Fix**: `supports()` devuelve `false` si la tarea siguiente es async (reusando `TaskDispatchPlanner`
— DRY) → cede a `runTask`, que lanza el error explícito "async no soporta executionMode batch". Sin
fallback silencioso, comportamiento consistente entre ambos caminos.
Test: `FileReadTaskFastPathTest.doesNotSupportAsyncSinkSoItFallsToRunTaskWhichRejectsIt` (3/3).

## F2 (HIGH, corregido) — falta índice para la correlación de la completación

`ProcessTaskExecutionRepository.findActiveSuspendedByExecutionAndTask(peId, tdId)` filtra por
`process_execution_id` — que era **solo FK, sin índice** (Postgres no lo crea). Se ejecuta **una vez
por completación**; a muchas ejecuciones (p.ej. 1M procesos async) sería un **seq-scan por work-item**
→ O(N²).

**Fix**: `V80__task_execution_active_suspension_index.sql` — índice **parcial**
`(process_execution_id, task_definition_id) WHERE resumed_at is null and status='SUSPENDED'`: exacto
para la consulta y diminuto (solo suspensiones activas). Verificado: migración aplica (v80), E2E 3/3.

## F3 (HIGH, reportado) — sin retención de `task_inbox` ni `task_dispatch_outbox`

`audit_spool` tiene `AuditSpoolMaintenanceScheduler` (purga SENT > retention-days). Las tablas async
**no tienen cleanup**: a 1M+ work-items, `task_inbox` (una fila por work-item procesado, para siempre)
y `task_dispatch_outbox` (filas SENT nunca purgadas) crecen **sin límite** → bloat, vacuum, degradación.

**Recomendación**: replicar `AuditSpoolMaintenanceScheduler` para ambas tablas (borrar `PROCESSED`/
`SENT` más viejas que una retención configurable; conservar `DEAD`/`POISON` para forense). Config
`tasks.inbox.cleanup.*` / `tasks.outbox.cleanup.*`. Inerte hoy (gate OFF ⇒ 0 filas), pero requerido
antes de operar el feature a volumen.

## F4 (MEDIUM, reportado) — throughput del relay por defecto

`tasks.relay.every=5s` × `tasks.relay.batch-size=100` = **20 msg/s** → **~14 h para 1M**. El default
es una trampa a escala.

**Recomendación**: para volumen, subir `batch-size` (p.ej. 1000-5000) y bajar `every` (p.ej. 1s), o
drenar en bucle continuo mientras haya pendientes. Es config (ops), pero el default debería
documentarse como "bajo volumen" y el runbook fijar valores de escala.

## F5 (design boundary, documentado) — async es por-tarea (`once`), no por-record

El modelo de correlación es por `(processExecutionId, taskDefinitionId)`: `completeFromExternalResult`
reanuda **la** tarea suspendida. Si una tarea se despachara como N work-items (per-record/slice), solo
el **primero** reanudaría (los demás → `NOT_FOUND`, resultado descartado). Por eso el guard
async+`batch`/`per-record` **lanza** (es load-bearing para la correctitud, no un "todavía no"). El
offload por-record a 1M exigiría un modelo de correlación por-slice y agregación N→1 (dise ño futuro),
no la correlación por-tarea actual.

## Resumen

| # | Hallazgo | Severidad | Estado |
|---|---|---|---|
| F1 | Fast path ignora `async` en silencio | HIGH | **Corregido** (test) |
| F2 | Sin índice para la correlación (seq-scan por item) | HIGH | **Corregido** (V80, E2E) |
| F3 | Sin retención de task_inbox/task_dispatch_outbox | HIGH | Reportado (+plan) |
| F4 | Throughput del relay por defecto (~14h/1M) | MEDIUM | Reportado (+tuning) |
| F5 | Async es por-tarea (`once`), no por-record | boundary | Documentado |

El feature sigue **gated OFF** (cero impacto). F3/F4 son requisitos de operación a volumen; F5 es un
límite de diseño a comunicar. F1/F2 eran defectos reales (fallback silencioso + O(N²)) ya corregidos.
