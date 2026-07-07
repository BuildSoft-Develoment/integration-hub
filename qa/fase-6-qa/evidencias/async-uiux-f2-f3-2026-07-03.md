# UI/UX F2 (cobertura) + F3 (badge/toggle vs feature flag) — 2026-07-03

## F2 — falsa alarma (corregida), sin cambio de código

Mi reporte previo de "3 forms sin control async" fue un **artefacto del grep** (solo miré `.html`, pero
`mt101-parse`/`mt101-split` tienen template **inline** en `.ts`). Cobertura real (grep en `.ts` + `.html`):
**15 de 16 forms** tienen el `ih-process-task-runtime-panel` (y por tanto los controles async). El único
sin panel es **`file-read`** — y async no aplica a un lector (correcto no exponerlo). ⇒ la relocalización
**no** regresó cobertura; F2 no requiere cambio.

## F3 — el badge/toggle reflejaba intent, no si el feature está activo

Si `tasks.async.execution.enabled=false` en el entorno, el motor **ignora** `async:true` y corre síncrono,
pero la UI no lo indicaba (podía inducir a error). Solución: exponer el estado del feature y avisar.

### Backend

- **`GET /api/messaging/async-status`** → `{ executionEnabled }` leyendo `tasks.async.execution.enabled`.
  Se refactorizó el `@Path` del resource a `/api/messaging` con métodos `/transports` y `/async-status`
  (la URL de transports **no cambia**). Role-gated igual que transports.

### Frontend

- **`MessagingTransportsService.asyncStatus()`** consume el endpoint.
- El **`process-task-runtime-panel`** lo carga al iniciar y pasa `featureEnabled` a la sección async.
- **`AsyncDispatchSectionComponent`**: input `featureEnabled` (default true); si async está on y el
  feature está off, muestra un **aviso** (`ui.asyncFeatureDisabled`) de que la tarea correrá síncrona.

## Pruebas

- **Backend `MessagingTransportsResourceTest`** (nuevo) **2/2**: `transports()` devuelve los tipos;
  `asyncStatus()` refleja el flag (true/false).
- **Front** (`nx test web --include=<specs>`): `process-task-runtime-panel.spec` **5/5** (2 nuevos:
  feature enabled/disabled), `async-dispatch-section.spec` **10/10** (2 nuevos: muestra/oculta el aviso).

## Estado

F2 aclarado (sin regresión real). F3 cerrado: la UI ahora refleja si el despacho async está activo en el
entorno y avisa cuando no lo está.
