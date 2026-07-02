# Evidencia: persistencia del catálogo de plugins frontend (full-stack) - 2026-07-01

Completa "instalar plugins de fuera" para plugins de interfaz: el operador puede
**persistir** un manifiesto de plugin frontend en runtime desde `/plugins`, y el shell lo
carga en el arranque junto al catálogo estático. Cierra la simetría con el marketplace
backend.

## Backend

- **Flyway `V75__ui_plugin_catalog_entry.sql`**: tabla `ui_plugin_catalog_entry`
  (`plugin_id` PK, `manifest_json`, `created_at`).
- Entidad `UiPluginCatalogEntry` + repositorio `UiPluginCatalogEntryRepository`.
- **`UiPluginCatalogResource`** (`/api/plugins/ui-catalog`):
  - `GET` → `{ manifests: [...] }` (cualquier usuario autenticado; lo lee el boot loader).
  - `POST` (admin) → upsert por `id` del manifiesto.
  - `DELETE /{id}` (admin) → elimina.

### Pruebas backend

```bash
mvn -pl platform-app test -Dtest=UiPluginCatalogResourceTest -Dsurefire.failIfNoSpecifiedTests=false
```

- Estado: **BUILD SUCCESS**, **4 tests** (list parsea el JSON; upsert persiste por id;
  rechaza manifiesto sin id; delete delega). Migración aplicada en vivo (health 200,
  `GET /api/plugins/ui-catalog` → 401 sin auth, 0 errores en log).

## Frontend

- `AppPluginRuntimeRegistry.loadExternalManifestCatalogs(sources)`: carga y **fusiona**
  varios catálogos en una sola instalación resiliente; cada fuente es opcional y no-fatal.
- `provideExternalAppPluginManifestCatalogs([...])` + `app.config`: el shell ahora carga
  el fichero estático `/plugins/catalog.json` **y** el catálogo backend `/api/plugins/ui-catalog`.
- `plugin-diagnostics-page`: en "Plugins de interfaz", tras un preview **aceptado** aparece
  "Añadir al catálogo" (POST); lista "Catálogo (N)" de entradas persistidas con "Quitar"
  (DELETE). `loadUiCatalog`/`installToCatalog`/`removeFromCatalog` no-fatales.
- i18n en/es: `plugins.ui.install/installed/empty/remove` (paridad respetada).

### Pruebas unitarias frontend

```bash
npx nx test web --skip-nx-cache
```

- Estado: **PASS**. Test files: **80 passed**. Tests: **383 passed** (+3 nuevos: el registry
  fusiona múltiples catálogos y sigue fusionando si una fuente opcional falla; el componente
  lista y elimina entradas persistidas).

### Prueba e2e (Playwright, chromium, stack real)

```bash
BASE_URL=http://localhost:8080 npx playwright test \
  --config=apps/web-e2e/playwright.config.ts --project=chromium
```

- Suite completa: **7 passed (1.8m)**.
- Nuevo test "installs a previewed frontend plugin into the runtime catalog": con mock
  con estado de `/api/plugins/ui-catalog`, previsualiza un manifiesto aceptable, pulsa
  "Añadir al catálogo" (POST) y verifica que la entrada aparece en la lista "Catálogo" con
  acción "Quitar". Los otros 6 tests siguen verdes con el boot loader de doble fuente.

## Estado

- G2 completado end-to-end: preview (turno anterior) + **persistencia y carga runtime**.
  "Instalar plugins de fuera" queda simétrico front/back (marketplace backend + catálogo
  frontend gestionable en runtime), con verificación fail-safe intacta (origen/firma/SRI).
