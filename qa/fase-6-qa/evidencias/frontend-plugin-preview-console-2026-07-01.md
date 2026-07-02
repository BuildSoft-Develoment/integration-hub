# Evidencia G2: previsualizador de manifiestos de plugin frontend - 2026-07-01

Añade a `/plugins` una sección "Plugins de interfaz" que **previsualiza** si un
manifiesto de plugin frontend externo se aceptaría o se pondría en cuarentena, validándolo
contra el **mismo gate real** del host (origen/firma/rutas/namespaces/compatibilidad).
Es la pieza simétrica al *preview* del marketplace backend.

## Alcance y decisión de arquitectura

- Se entrega el **preview** (dry-run no-mutante), no la persistencia del catálogo. La
  carga del catálogo (`/plugins/catalog.json`) ocurre en el arranque desde un fichero
  estático; reescribir ese path crítico para persistir entradas es alto riesgo y bajo
  valor incremental. La persistencia del catálogo (endpoint backend + escritura) queda
  como follow-up documentado. El preview cierra el gap de "no había superficie admin para
  validar un plugin frontend antes de publicarlo".

## Cambios (solo frontend)

- `AppPluginRuntimeRegistry.previewExternalManifest(candidate)`: valida un candidato
  contra todos los gates **sin instalar ni mutar** el registry; devuelve `{accepted, reason}`.
- `plugin-diagnostics-page.component.ts`: sección "Plugins de interfaz" con textarea
  (manifiesto JSON), botón "Previsualizar" y resultado accesible (badge Aceptado
  `role=status` / En cuarentena `role=alert`, o "JSON inválido"). `previewUiManifest()`
  parsea el JSON y delega en el registry.
- i18n en/es: `plugins.ui.title/hint/manifest/preview/invalidJson/accepted(Badge)/rejected(Badge)`.

## Pruebas unitarias frontend

### Comando

```bash
npx nx test web --skip-nx-cache
```

### Resultado

- Estado: **PASS**. Test files: **80 passed**. Tests: **380 passed** (+3 nuevos:
  registry `previewExternalManifest` acepta un metadata-only y reporta la cuarentena de un
  remote no confiable **sin mutar** el registry; el componente cubre aceptado / rechazado /
  JSON inválido).

## Prueba e2e (Playwright, chromium, stack real)

### Comando

```bash
# tras rebuild de Quinoa y health=200
BASE_URL=http://localhost:8080 npx playwright test \
  --config=apps/web-e2e/playwright.config.ts --project=chromium
```

### Resultado

- Suite completa: **6 passed (1.8m)**.
- Nuevo test "previews a frontend plugin manifest in the console": en `/plugins`, pega un
  manifiesto metadata-only → "Se aceptaría"; pega un remote no confiable → mensaje
  "not in the allowed plugin origins". Valida el gate real client-side, contra el app.

## Estado del roadmap del análisis

- G1 (kit de autor) ✅ · G4 (salud en Overview) ✅ · **G2 (preview de catálogo frontend) ✅**.
- Follow-up opcional: persistencia del catálogo frontend (endpoint backend + escritura)
  para instalar/allowlistar en caliente, completando la simetría con el marketplace backend.
