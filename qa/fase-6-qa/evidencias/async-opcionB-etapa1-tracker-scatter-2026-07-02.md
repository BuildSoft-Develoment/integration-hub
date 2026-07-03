# Opción B (scatter-gather por-slice) — Etapa B1: tracker de agregación N→1 — 2026-07-02

Primera etapa de la Opción B (offload async por-slice para distribuir una tarea batch/per-record de
1M registros entre workers). Entrega la pieza keystone —el **tracker de agregación N→1**— inerte
(nada la usa aún), con incremento atómico probado.

## Roadmap de Opción B (etapas verificables)

| Etapa | Qué | Estado |
|---|---|---|
| **B1** | **Tracker N→1 (tabla + incremento atómico)** | **Esta entrega** |
| B2 | Dispatch por-slice: partir la tarea en N work-items (slice discriminator en la idempotencyKey) + `open(N)` en el tracker, atómico con la suspensión | pendiente |
| B3 | Consumer por-slice: al completar cada slice, `recordSliceCompleted`; cuando cierra (completed==total) disparar la reanudación **una vez** | pendiente |
| B4 | Fallos parciales: slice a DLQ → `recordSliceFailed` + política (requeue por-slice / fallar la tarea) | pendiente |
| B5 | Front: toggle sync/async + transporte + paralelismo + badge de "tarea distribuida" (hoy no existe UI de tareas) | pendiente |

## B1 — lo entregado

- **`TaskAsyncDispatch`** (entidad) + **`V81__task_async_dispatch.sql`**: una fila por tarea
  despachada en N slices; único por `(process_execution_id, task_definition_id)`. Estados
  `PENDING` → `COMPLETED` / `FAILED`.
- **`TaskAsyncDispatchRepository`**:
  - `open(peId, tdId, N)` — abre el scatter (idempotente, `ON CONFLICT DO NOTHING`).
  - `recordSliceCompleted(peId, tdId)` — **incremento atómico** vía `UPDATE ... RETURNING` bajo lock
    de fila: exactamente **un** consumer (el que lleva el conteo a `total`) recibe
    `batchCompleted=true` → dispara la reanudación una sola vez. Una reentrega de una slice ya contada
    no re-incrementa mal porque el `where status='PENDING'` deja de matchear al cerrar.
  - `recordSliceFailed(...)` — transición a `FAILED` (una slice muerta ⇒ el scatter no puede cerrar).

## Por qué el incremento atómico importa

Con N workers en paralelo procesando slices, N consumers llaman `recordSliceCompleted` concurrentemente.
El `UPDATE ... SET completed = completed + 1 ... RETURNING` serializa por lock de fila en Postgres, así
que el conteo es exacto y **solo el último** ve `batchCompleted` → **exactamente-una** reanudación de la
tarea (sin doble continuación ni continuación perdida). Es la garantía central del gather.

## Pruebas

- **`TaskAsyncDispatchRepositoryIT`** (Postgres real) **3/3**:
  - agrega 1→2→3 y solo la 3.ª (de 3) reporta `batchCompleted` + estado `COMPLETED`;
  - una slice reentregada tras cerrar **no** vuelve a contar ni a disparar (idempotente);
  - una slice fallida transiciona el scatter a `FAILED` y bloquea el cierre.
- `open` idempotente (dos llamadas no duplican ni reabren). Migración V81 aplicada.

## Estado

Fundamento del scatter-gather listo y probado, sin tocar el flujo actual. Sigue B2 (dispatch por-slice)
sobre esta base.
