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

## Doble check + pruebas e2e (Playwright)
Hallazgos reales del doble check:
1. **La consola era inalcanzable desde la UI** (solo por URL): se agregó un enlace "Operaciones DLQ"
   (`routerLink="/executions/async-dlq"`) en la toolbar de ejecuciones + clave i18n `executions.dlq.link`
   + la ruta al smoke de rutas protegidas de web-e2e.
2. **Locator e2e incorrecto**: el botón de requeue tiene `aria-label` descriptivo, así que su nombre
   accesible NO es el texto visible ("Reanudar cadena") sino el aria-label. `getByRole('button',{name})`
   matchea el nombre accesible → corregido el locator para matchear el aria-label.

Verificaciones que corren limpio aquí: `AsyncDlqComponent` 11/11 (`nx test web`), `nx build web` OK,
`nx lint web` y `nx lint web-e2e` limpios (único warning pre-existente en `main.ts`/`gotoAuthenticated`).

**E2E Playwright** (`apps/web-e2e/src/example.spec.ts`, test "operates the async DLQ console"): mockea
`/api/query/tasks-dlq/**` y valida descubrimiento (link del toolbar), header, banner health=error,
ambas tablas con filas, y el **redrive 2-pasos** llamando al endpoint; asegura el botón de requeue del
scatter estancado. En un run local contra el origen Quinoa (`BASE_URL=http://localhost:8080`) el flujo
completo pasó (fallando solo el locator luego corregido). Runs posteriores cayeron en flakiness de auth
de Keycloak (el runner por defecto levanta el dev-server en :4200, cuyo `redirect_uri` Keycloak rechaza
—solo :8080 registrado—; el propio `gotoAuthenticated` ya documenta reintentos por rebuilds transitorios).
El spec queda para CI (que sirve el front en el mismo origen). No es un defecto de F1.

## Pendiente (siguientes incrementos)
- F2: UI de progreso en vivo en el detalle de ejecución (`/progress`).
- F3: tile de salud async en overview (reutiliza `AsyncDlqApiService`).
- Enlace de descubrimiento a la consola desde el catálogo de ejecuciones y/o el tile F3.
