# Evidencia: renderer de campo `token-text` para schema-form - 2026-07-02

Pieza de pendiente 2 (migrar editores ricos a schema-driven sin regresión): el campo rico más
reutilizable — textarea con **inserción de tokens** `{fuente.output.campo}`.

## Qué se hizo

- **`ProcessSchemaFieldContextService`** (`providedIn: 'root'`, signals): el host publica el
  contexto de binding (task/tasks/readers) para los renderers de campo; expone `groupedOptions`
  (vía `ProcessTaskBindingContextService`) y `tokenFor(key)`.
- **`ProcessTokenFieldComponent`** (`ih-process-token-field`): renderer de campo custom para el
  tipo `token-text`. Recibe el contrato `field`/`control`/`readonly`, bindea el `FormControl`
  del schema-form (participa en validación/`valueChange`), y ofrece un menú "Insertar token" con
  las opciones de binding; inserta el token en el caret. Respeta `readonly`.
- **Wiring en el host** (`ProcessTaskFormHostComponent`): registra el renderer para `token-text`
  vía `provideSchemaFieldRenderers` y **publica el contexto** (task/tasks/readers) por un effect.
  Así cualquier form schema-driven que el host renderice (tipos de plugin) puede usar campos
  `token-text` con autocompletado.

## Pruebas

- **Unit (`nx test web`)**: **416/416** (+3). El spec cubre: renderiza textarea + muestra el menú
  cuando hay opciones; `insert()` mete el token en el valor del control; con `readonly` no
  modifica el valor. Paridad i18n OK (`schemaForm.insertToken`).
- **Build** OK · **e2e** catálogo de procesos verde (el wiring del host no rompe los editores).

## Estado del pendiente 2

Enablers para migrar `notification` sin regresión:
- ✅ Campos condicionales (`visibleWhen`).
- ✅ Sin fallback silencioso (tipos desconocidos → mensaje explícito).
- ✅ Renderer **`token-text`** (este commit).
- ⏳ Renderer **`http-request`** (envuelve `ProcessHttpRequestComponent`).
- ⏳ Renderer **`runtime-panel`** (envuelve `ProcessTaskRuntimePanelComponent`).
- ⏳ Schema NOTIFICATION (channel select + campos condicionales por canal usando `token-text` /
  `http-request` / `runtime-panel`) + registro + **eliminar** `process-notification-task-form`.

No se elimina el editor rico hasta tener el reemplazo completo verificado sin regresión.
