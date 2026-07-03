# Evidencia: schema-form extensible con renderers de campo custom — Fase 3a - 2026-07-02

## Contexto (decisión de scope)

El doble check de la fase 3 destapó que los forms hardcoded por tipo (p.ej.
`process-notification-task-form`) **no son legacy**: son editores ricos (autocompletado de
tokens `{fuente.output.campo}`, binding de fuentes/readers, sub-form HTTP, runtime panel).
Reemplazarlos por un `ih-schema-form` plano sería una **regresión** de UX.

Decisión (elegida): **enriquecer el schema-form primero** con un mecanismo de extensión, para
poder migrar built-ins más adelante **sin perder** esas features.

## Qué se hizo (fase 3a: extensibilidad)

- **Registro de renderers de campo custom** (`schema-field-renderer.ts`): `SCHEMA_FIELD_RENDERERS`
  (InjectionToken multi) + `provideSchemaFieldRenderers([{ type, component }])` +
  `SchemaFieldRendererRegistry.rendererFor(type)`. Mismo patrón DI que `slots`/`actions` — un
  feature (o un plugin) registra un tipo de campo rico sin que `shared/ui` dependa de internals.
- **`ih-schema-form`** ahora, por cada campo: si hay un renderer registrado para su `type`, lo
  renderiza vía `NgComponentOutlet` (pasándole `field` + su `FormControl` + `readonly`); si no,
  usa el built-in (text/number/select/boolean/textarea/password/secret). El control custom
  bindea `[formControl]="control()"` → participa en el mismo FormGroup (validación + valueChange).
- `SchemaFieldDescriptor.type` admite `type` custom (`string & {}` preserva el autocompletado de
  los built-in).

## Pruebas

- **Unit (`nx test web`)**: **408/408** (+1). Nuevo test: un tipo `token-text` con renderer
  registrado se pinta con el componente custom (cableado a su FormControl, con el valor sembrado),
  y un campo `text` built-in del mismo schema sigue renderizando nativo (`mat-form-field`).
- **Build** `nx build web` OK.
- **e2e (chromium, :8080)**: el test de `/#/ui-kit` sigue verde tras reestructurar el template
  (los built-ins renderizan igual: ≥4 `mat-form-field` + toggle + input password).

## Estado del desbloqueo

- Fase 1 (renderer) ✅ · Fase 2 (contrato + endpoint backend) ✅ · **Fase 3a (renderers custom)** ✅.
- Fase 3b (siguiente): un tipo de campo rico real (p.ej. `token-text` con autocompletado de
  fuentes) empaquetado en el feature de procesos + registrado, para poder migrar
  `process-notification-task-form` a schema-driven **sin regresión**.
- Fase 3c: cableo del host de task-forms para que un tipo de plugin (sin form registrado, con
  schema backend) renderice con `ih-schema-form`.
