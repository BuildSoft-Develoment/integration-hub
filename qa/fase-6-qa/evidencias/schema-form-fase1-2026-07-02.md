# Evidencia: config dirigida por schema — Fase 1 (renderer) - 2026-07-02

## Gap que ataca (extensibilidad real de plugins externos)

Los formularios de configuración estaban **hardcoded por tipo**
(`connection-type-form-host` con `@switch (connectionType())`: `MONGODB`→form, default→JDBC) y
el descriptor backend **no expone** schema de config; la config se guarda como `configurationJson`
crudo. Consecuencia: un **plugin backend** que registra un tipo nuevo (`providedTypes`) **no se
puede configurar en la UI** sin programar a mano un formulario frontend. La extensión backend
queda acoplada a código frontend — el techo real de la extensibilidad.

## Fase 1 entregada (frontend: contrato + renderer)

- **Contrato** `schema-form.models.ts`: `SchemaFieldDescriptor` (`key`, `type`, `labelKey`,
  `required`, `options`, `min`/`max`, `pattern`, `default`, …), `SchemaFormSchema`,
  `SchemaFormValue`. Es el mismo contrato que el descriptor backend expondrá por `providedType`.
- **`SchemaFormComponent`** (`ih-schema-form`, en `shared/ui`): construye un `FormGroup` desde el
  schema con validación (required/min/max/pattern), renderiza cada campo con Material
  (text/number/select/boolean/textarea/password/**secret**), emite `valueChange` y `validChange`,
  soporta `readonly`. Tipos `secret` **enmascarados** → el valor es una **referencia** a un
  secreto gestionado (integra con los `SecretValueProvider`), nunca el valor en claro.
- **Demo** en la galería in-app `/ui-kit` (tiene DI, igual que `catalog-list` → va en la galería,
  no en Storybook): schema de ejemplo + salida JSON en vivo + badge válido/incompleto.

## Pruebas

- **Unit (`nx test web`)**: **406/406** (+6). Cubren: un control por campo con el tipo correcto
  (secret enmascarado como password), inválido mientras falten `required` y válido al rellenar,
  emite el objeto completo al editar, siembra desde el `value` entrante **sin** emitir (evita
  bucles), deshabilita todo en `readonly`, y aplica validadores `min`/`max`.
- **Build**: `nx build web` OK.
- **e2e (chromium, stack real :8080)**: el test de `/#/ui-kit` verifica que `ih-schema-form`
  renderiza (≥4 `mat-form-field` + `mat-slide-toggle` + `input[type=password]` para el secret).
  **1 passed** — render confirmado en la app, no solo en build.

## Siguientes fases (para cerrar el desbloqueo)

- **Fase 2 (backend)**: el descriptor de plugin expone el schema de config por `providedType`
  (`GET /api/plugins/{id}/types/{type}/schema` o inline en el descriptor).
- **Fase 3 (wiring)**: los editores (connection/source/reader/task) usan `ih-schema-form` como
  renderer **por defecto**, con un registro `tipo → form custom` para los overrides existentes
  (JDBC/Mongo) y fallback al schema-form. A partir de ahí, un plugin backend-only queda
  configurable sin remote frontend.
