# Evidencia: host de task-form usa schema-driven para tipos de plugin — Fase 3c - 2026-07-02

Cierra el desbloqueo "config dirigida por schema" para **tipos aportados por un plugin
backend**. Junto a fase 1 (renderer), fase 2 (contrato+endpoint) y fase 3a (renderers custom).

## Qué se hizo

- **`PluginConfigSchemaService`** (processes/api): `GET /api/plugins/config-schema/{type}` → el
  schema del tipo (o `{ fields: [] }`).
- **`ProcessTaskFormHostComponent`** (el host que resuelve el form por tipo, "M-1b puro, sin
  switch legacy"): añadido un tercer camino. Ahora:
  1. Tipo con **form registrado** (built-in) → su editor rico (sin cambios).
  2. Tipo **sin form registrado pero con config-schema** (plugin backend) → **`ih-schema-form`**
     con el schema del backend, sembrado desde `configurationJson` y persistiendo el valor de
     vuelta como `configurationJson`.
  3. Tipo sin form ni schema → el mensaje explícito **`formNotRegistered`** (fail-fast).
- **Sin fallback legacy**: no se añadió un editor JSON crudo genérico. El path schema-driven es
  el **único** camino para tipos de plugin (no un fallback de los editores built-in), y los tipos
  sin nada siguen fallando explícito.
- Los tipos **registrados no disparan HTTP** (el effect corta si `isRegistered`), así que los
  editores built-in no pagan coste extra.

## Pruebas

- **Unit (`nx test web`)**: **411/411** (+3, 86 files). El nuevo spec del host cubre:
  - Tipo no registrado con schema (`ACME_DO`) → renderiza `ih-schema-form`, sin el mensaje.
  - Tipo no registrado sin schema (`fields: []`) → muestra `formNotRegistered`, sin schema-form.
  - `onSchemaValue({...})` → emite `patchTask({ configurationJson: '...' })` (mapeo correcto).
- **Build** `nx build web` OK (bundle generado; un fallo previo de "federation artefacts" fue
  transitorio, verde al reintentar).
- **e2e (chromium, :8080)**: el catálogo de procesos sigue verde (el cambio del host no rompe los
  editores existentes).

## Estado del desbloqueo

- Fase 1 ✅ · Fase 2 ✅ · Fase 3a (renderers custom) ✅ · **Fase 3c (host plugin types)** ✅.
- **Circuito cerrado**: un plugin backend declara `configSchema()` → el endpoint lo expone → el
  host lo renderiza → el operador lo configura **sin remote frontend**.
- Follow-up opcional: fase 3b (migrar `process-notification-task-form` a schema-driven usando un
  renderer de campo `token-text` que preserve el autocompletado — cuando se quiera reducir forms
  built-in sin regresión), y extender el schema a Source/Reader + descriptor remoto de marketplace.
