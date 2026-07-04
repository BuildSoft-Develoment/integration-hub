# F1 — Consola de operaciones DLQ async (frontend) — 2026-07-04

## Objetivo
Dar UI a la operación del backbone async (ADR-015): hoy los endpoints DLQ (summary/dead/stalled +
redrive/requeue) existen pero no había forma de operarlos desde la consola. Primer incremento de la
capa frontend de observabilidad a escala (1M+).

## Alcance entregado
- **`AsyncDlqApiService`** ([async-dlq-api.service.ts](../../../frontend/libs/features/executions/src/lib/api/async-dlq-api.service.ts)):
  summary/dead/stalled + redriveOutbox/requeue contra `/api/query/tasks-dlq`.
- **`AsyncDlqComponent`** (`ih-async-dlq`): patrón de la consola de spool (signals, `forkJoin`,
  auto-refresh apagado por defecto vía `effect`+`setInterval`, semáforo `health`, confirmación
  2-pasos con `ActionDispatcherService`). Dos tablas: filas muertas (DEAD/POISON) y scatters
  streaming estancados.
- **Ruta** `/executions/async-dlq` en `execution-catalog.routes.ts`; API y modelos exportados desde el
  índice de la feature para reuso (F3/overview).
- **i18n** `executions.dlq.*` en es/en.

## Decisiones de diseño (derivadas del doble check del análisis)
- **Requeue = acción PRIMARIA de recuperación** en la tabla de estancados. El backend, para un scatter
  streaming (page-chain), re-inyecta la última página y **reanuda la cadena**; requeue es lo correcto,
  no el redrive. (El análisis inicial lo tenía al revés; corregido.)
- **Gating**: los reads los abre la sección (paso 0 amplió el backend a 5 roles de lectura). Las
  acciones mutantes (redrive/requeue) se ocultan a no-admin (`access.canAdmin`) y el backend las
  restringe igual → doble barrera.
- **Semáforo**: cualquier fila muerta (outbox/inbox/poison) = crítico; scatters estancados =
  advertencia; limpio = sano.

## Pruebas
- **Unit** `AsyncDlqComponent` (11): semáforo (error/warn/ok/prioridad), confirmación 2-pasos
  (redrive y requeue por (pe,td), sin ejecutar en el 1er clic, no arma sin admin), carga puebla
  signals, auto-refresh limpia en destroy. → **11/11 verde** (`nx test web` filtrado).
- **Build** `nx build web` **OK**: ruta, exports del índice, template AOT e i18n compilan y wire-up.
- **Backend** (soporte de esta UI): `AsyncTaskDlqResourceAccessIT` 4/4 (gating), `AsyncTaskDlqIT` 9/9.

## Pendiente (siguientes incrementos)
- F2: UI de progreso en vivo en el detalle de ejecución (`/progress`).
- F3: tile de salud async en overview (reutiliza `AsyncDlqApiService`).
- Enlace de descubrimiento a la consola desde el catálogo de ejecuciones y/o el tile F3.
