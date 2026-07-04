# F3 — Tile de salud del backbone async en el overview — 2026-07-04

## Objetivo
Dar un vistazo de salud del backbone async (ADR-015) en la landing: filas muertas del DLQ + scatters
streaming estancados, con enlace a la consola DLQ (F1).

## Decisión de arquitectura (del doble check del análisis)
En vez de importar `AsyncDlqApiService` cross-feature (overview→executions) + una llamada aparte, se
**extendió `/overview-summary`** —que ya es el agregador de salud cross-cutting y está gateado a los
mismos 5 roles de lectura que la landing—. Beneficios: sin acoplamiento frontend overview→executions,
**cero llamadas nuevas** (reusa el `getSummary()` existente), y mismo gating que la página (no hay caso
"rol ve la landing pero 403 en el tile").

También el doble check corrigió una premisa falsa: el card de plugins NO es admin-only (su fetch está
abierto a `{admin, integration-admin, auditor}`) y **no gatea su enlace** aunque auditor no pueda entrar
a `/plugins`. Por consistencia, el enlace del tile async tampoco se gatea (sigue el precedente).

## Alcance entregado
- **Backend**: `OverviewSummaryResponse` + `asyncDeadLetters`/`asyncStalledScatters`; poblados en
  `ExecutionQueryService.overviewSummary()` vía `AsyncTaskDlqService.health(5min)` (nuevo), que suma las
  filas muertas (`summary()`) y cuenta los estancados con `TaskAsyncDispatchRepository.countStalledStreaming`
  (nuevo, count barato sin cargar filas).
- **Frontend**: `AsyncHealth` model + `OverviewStore.asyncHealth` (computed derivado del `summary()`,
  null si no hay summary → card oculto) + `ih-overview-async-health-card` (molde plugin-health: semáforo
  `dead>0→error`, `stalled>0→warn`) + ubicación en `metrics-grid` + i18n `overview.async.*` (es/en).

## Pruebas
- **Backend** (Testcontainers Postgres):
  - `AsyncTaskDlqIT.healthAggregatesDeadAndStalled` — siembra 1 outbox DEAD + 1 inbox DEAD + 1 POISON +
    1 scatter estancado (10 min) + 1 reciente ⇒ `health.dead()==3`, `health.stalled()==1`. **10/10**.
  - `CatalogAndExecutionResourceIT` **3/3** (overview-summary sigue OK con los campos nuevos).
- **Frontend** (`nx test web`, 10/10): store (`asyncHealth` derivado del summary, null sin summary) +
  card (alert error/warn/null, prioridad error, render de contadores + enlace a `/executions/async-dlq`).
- **Build** `nx build web` OK. i18n completo es/en.
- **Live** contra el stack real (token Keycloak admin, Quarkus hot-reload): `/overview-summary` devuelve
  `asyncDeadLetters:0, asyncStalledScatters:0` (con `processes.total:2`), confirmando el campo end-to-end.

## Cierre
F1 (consola DLQ) + F2 (progreso en vivo) + F3 (tile de salud) completan la capa frontend de
observabilidad async sobre los endpoints del backend. Pendiente conocido de F2: e2e de render sujeto a
la inestabilidad de Quinoa/Keycloak (spec queda para CI).
