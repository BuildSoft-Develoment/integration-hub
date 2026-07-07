# Recuperación de la page-chain rota — 2026-07-03

## Problema

Bajo `failure-strategy=dead-letter-queue` (el modo recomendado a volumen), si una página del streaming
scatter **muere/DLQ** antes de encolar su sucesora, la cadena se rompe: la sucesora nunca se encola, el
tracker queda unsealed y la tarea **colgada sin recuperación** (el inbox no guarda el payload de un DEAD
→ el cursor se perdía).

## Solución: persistir la última página + re-inyección

En vez de reconstruir el work-item desde config+continuation, el **tracker persiste la última página
despachada (JSON completo + índice)**; la recuperación la re-encola directo.

- **Migración V83**: `task_async_dispatch` + `last_page_index` + `last_page_json`.
- **`recordDispatchedPage`** (repo): update **monótono** (`where last_page_index is null or < ?`) → una
  reentrega/procesado fuera de orden no regresa el progreso.
- **`AsyncPageChainService.enqueuePage`**: al encolar cada página (seed y sucesoras) registra su JSON en
  el tracker. Invariante: el tracker siempre tiene la página más avanzada encolada.
- **`AsyncTaskDlqService.requeueSuspension`**: para un scatter en **streaming** (`last_page_json != null`)
  re-inyecta esa página (limpiando su dedup outbox/inbox) → al re-correr, encola su sucesora y **la cadena
  reanuda**. El scatter **materializado** sigue rechazándose (su recuperación es redrive de slices).

Idempotente: re-inyectar una página dedupea por su `idempotencyKey` (`page-i`); re-correrla re-encola la
sucesora (dedup) y re-ejecuta el provider (at-least-once, ya asumido).

## Pruebas

- **`TaskAsyncDispatchRepositoryIT` 9/9** (+1): `recordDispatchedPageIsMonotonic` (índice 0→2→1: queda en 2).
- **`AsyncStreamingScatterE2EIT` 4/4** (+1, Testcontainers): `brokenChainIsRecoveredByRequeueingTheLastPage`
  — 5 filas/batch 2; se consume la semilla (encola page-1) y se **borra page-1 del outbox** (simula
  DLQ/pérdida) → cadena atascada (tracker PENDING, `last_page_index=1`, proceso SUSPENDED); `requeueSuspension`
  re-inyecta page-1 → drain → la cadena reanuda → **COMPLETED**, los 5 records procesados.
- **Regresión async** verde (DLQ materializado sigue rechazando; scatter/once/suspendible sin cambios).

## Alcance / pendiente

Entregada la **recuperación robusta** (palanca DLQ `requeueSuspension`, ya usable por ops/API). El
**auto-resume por scheduler** (detectar scatters unsealed estancados > umbral y llamar la primitiva
automáticamente) queda como automatización encima de esta primitiva — requiere una heurística de
detección de estancamiento (p.ej. `last_progress_at`) que no se incluyó aquí para no meter falsos
positivos. La primitiva manual + el `redriveOutboxDead` existente cubren la recuperación operativa.
