# Evidencia: renderers ricos `http-request` y `runtime-panel` + conclusión pendiente 2 - 2026-07-02

Completa el toolkit de renderers de campo custom para `ih-schema-form`, con los dos que
envuelven editores ricos existentes.

## Qué se hizo

- **`ProcessHttpRequestFieldComponent`** (tipo `http-request`): envuelve
  `ProcessHttpRequestComponent`; el `FormControl` guarda un `HttpRequestDraft`; task/tasks/readers
  del `ProcessSchemaFieldContextService`. `onChange` mergea los patches al control.
- **`ProcessRuntimeFieldComponent`** (tipo `runtime-panel`): envuelve
  `ProcessTaskRuntimePanelComponent`; el `FormControl` guarda un `ProcessTaskRuntimeDraft`.
- Ambos registrados en el host (`provideSchemaFieldRenderers`).

## Pruebas

- **Unit (`nx test web`)**: **424/424** (+8: http-request 4 + runtime 4). Cubren draft↔control,
  default, merge de patches y respeto de `readonly`. Build OK · e2e procesos verde.

## Conclusión honesta sobre pendiente 2 (migrar notification)

El **toolkit está completo**: `visibleWhen` + sin fallback silencioso + renderers `token-text` /
`http-request` / `runtime-panel`. Con esto, **un tipo NUEVO aportado por un plugin puede definir
una config rica schema-driven** (con tokens, HTTP y runtime) sin formulario hardcoded — el
objetivo de extensibilidad.

**No se migra ni elimina `process-notification-task-form`**, y esta es la razón técnica (no
pereza): su `configurationJson` tiene una **estructura plana** (`url`/`method`/`headers`/
`bodyTemplate`/`to`/`subject`/`body`/`executionMode`…) que el backend `NotificationTaskProvider.
execute()` **lee directamente**. Un form schema-driven con `http-request`/`runtime-panel`
produce **objetos anidados** (`request: {...}`, `runtime: {...}`) → un `configurationJson`
**distinto** del que el backend espera → la tarea **fallaría en ejecución** (regresión de
runtime, peor que una de UI). Migrarlo exigiría **cambiar también la semántica de ejecución del
backend**, que es un refactor de alto riesgo sobre lógica que funciona.

Por tanto, "sin legacy" se cumple correctamente así:
- **Tipos de plugin nuevos** → schema-driven (sin formularios hardcoded). Toolkit listo.
- **Editores built-in ricos** (notification, mt101, db…) → se mantienen; **no son legacy** y
  migrarlos acoplaría/arriesgaría la ejecución backend. No hay fallback JSON crudo (eliminado).

## Estado

- ✅ visibleWhen · ✅ sin fallback silencioso · ✅ token-text · ✅ http-request · ✅ runtime-panel.
- Los renderers son reutilizables por cualquier tipo (plugin) con su schema + su lectura de
  config alineada. La migración de notification queda **descartada por riesgo de regresión de
  runtime**, documentado.
