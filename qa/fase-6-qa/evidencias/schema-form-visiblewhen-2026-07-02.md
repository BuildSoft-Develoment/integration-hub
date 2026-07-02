# Evidencia: campos condicionales (`visibleWhen`) en schema-form - 2026-07-02

Enabler para migrar editores ricos a schema-driven sin regresión (pendiente 2), y útil en
general para la config de cualquier plugin (campos que dependen de otro campo).

## Qué se hizo

- **`SchemaFieldDescriptor.visibleWhen?: { field, equals }`**: el campo solo se muestra y se
  valida cuando el campo referenciado tiene el valor indicado.
- **`ih-schema-form`**: `formValue` (signal) dirige la visibilidad; `updateFormState()`
  sincroniza, por control, la **habilitación** (deshabilitado si es `readonly` o está oculto →
  **no afecta a la validez**) y reemite `validChange`. El template envuelve cada campo en
  `@if (isVisible(field))`.
- Demo en `/ui-kit`: campo `serviceName` que solo aparece si el motor es `oracle`.

## Pruebas

- **Unit (`nx test web`)**: **412/412** (+1). El test cubre: con `channel='log'` el campo `url`
  (`visibleWhen webhook`, `required`) está **oculto y deshabilitado** → el form es **válido** pese
  al `required`; al cambiar a `webhook` el `url` aparece, se **habilita** y el form pasa a
  inválido hasta rellenarlo.
- **Build** OK · **e2e** `/#/ui-kit` verde (el condicional oculto no altera el conteo de campos).

## Estado del pendiente 2 (migrar notification, sin regresión)

`process-notification-task-form` (223 líneas) usa: runtime panel, **campos condicionales por
canal** (log/webhook/email), **HTTP sub-form** y autocompletado de tokens en varios campos.
Migrarlo sin regresión requiere, sobre el schema-form:

- ✅ **Campos condicionales** (`visibleWhen`) — este commit.
- ⏳ Renderer de campo **`token-text`** (autocompletado de tokens/binding de fuentes).
- ⏳ Renderer **`http-request`** (envuelve `ProcessHttpRequestComponent`).
- ⏳ Renderer **`runtime-panel`** (envuelve `ProcessTaskRuntimePanelComponent`).
- ⏳ Schema NOTIFICATION que combine todo + registro + **eliminar** el form hardcoded.

No se elimina el editor rico hasta tener el reemplazo verificado sin regresión (los renderers
`token-text`/`http-request`/`runtime-panel` son el trabajo grande restante).
