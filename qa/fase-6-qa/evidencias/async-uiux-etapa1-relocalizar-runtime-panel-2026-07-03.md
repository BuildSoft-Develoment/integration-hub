# UI/UX Etapa 1: relocalizar el toggle async al runtime panel — 2026-07-03

Aplica la Parte 1 de la propuesta UI/UX: los controles de despacho async viven en el
**`process-task-runtime-panel`** (hogar idiomático de las opciones de runtime, usado por 13 forms),
no en el `process-task-form-host`.

## Por qué el panel y no el host

- El panel ya renderiza `executionMode`/source/`batchSize` (todas opciones de runtime) y opera sobre el
  **`ProcessTaskRuntimeDraft` tipado** que ya incluye `async`/`asyncTransport`/`continueOnFailure`.
- El form pasa `[draft]="draft()"` y escucha `(runtimeChange)="updateDraft($event)"` → flujo tipado,
  **sin merge de JSON crudo ni carrera host/form** (que tenía el enfoque anterior en el host).
- Agrupa async junto a executionMode/batchSize, como pide la propuesta.

## Cambios

- **`process-task-runtime-panel`**: embebe (DRY) los componentes ya verificados
  `<ih-async-dispatch-section>` (toggle async + transporte, progressive disclosure) y
  `<ih-task-continue-on-failure>`, ligados al draft tipado y emitiendo `runtimeChange`. Carga los
  transportes de `GET /api/messaging/transports` (fallback `['KAFKA']`). `updateAsync(false)` limpia
  también `asyncTransport`.
- **`process-task-form-host`**: revertida la integración previa (los controles ya no viven aquí).

## Estándar cumplido

Material (`MatSlideToggle`/`MatSelect`/`MatFormField`), i18n `i18n.t('ui.*')`, standalone + signals
`input()/output()`. El "compilador automático" (abstraer el JSON) sigue en la base compartida
`ProcessTaskProvider` (`hydrateRuntime`/`withRuntime`).

## Pruebas (`nx test web --include=<specs>`)

- **`process-task-runtime-panel.spec`** (nuevo) **3/3**: activar async emite `{async:true}`; desactivar
  emite `{async:false, asyncTransport:undefined}`; expone los transportes del endpoint.
- **`process-task-form-host.spec`** **3/3**: revertido a su comportamiento original (schema-driven), sin
  el fetch de transportes ni el merge.
- **`async-dispatch-section.spec`** **8/8**. Total 14/14.

## Estado

Parte 1 de la propuesta cerrada y bien ubicada. Sigue la Parte 2 (badge async/scatter en el canvas
`process-flow-node`).
