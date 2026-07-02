# Evidencia marketplace de plugins en la UI + e2e - 2026-07-01

Expone en la consola de plugins el flujo de instalacion "desde fuera" via
marketplace firmado, consumiendo el API backend ya existente
(`/api/plugins/marketplace/preview` + `/marketplace/install`).

## Alcance

- Formulario de marketplace: URL de catalogo + id de plugin.
- Preview del plugin (descriptor) antes de instalar.
- Instalacion desde el marketplace + refetch del diagnostico.

## Cambios verificados

- `plugin-diagnostics-page.component.ts`:
  - `previewMarketplace()` -> `POST /api/plugins/marketplace/preview` `{catalogUrl,
    pluginId}` (con `SKIP_GLOBAL_ERROR_FEEDBACK`); muestra el descriptor o error.
  - `installMarketplace()` -> `POST /api/plugins/marketplace/install`
    `{catalogUrl, pluginId, active}` + refetch; limpia el preview.
  - Seccion Marketplace con inputs (aria-label), boton Previsualizar y tabla de
    preview con badge de estado + boton Instalar.
- i18n en/es: `plugins.marketplace(.url|.plugin|.preview|.install|.error)`.

## Pruebas unitarias frontend

### Comando

```bash
npx nx test web --skip-nx-cache
```

### Resultado

- Estado: PASS.
- Test files: 80 passed.
- Tests: 367 passed, 0 failed (2 nuevos: preview y install desde marketplace).

## Prueba e2e (Playwright, contra el stack real)

### Comando

```bash
# stack levantado con start-platform-stack.cmd (localhost:8080)
BASE_URL=http://localhost:8080 npx playwright test \
  --config=apps/web-e2e/playwright.config.ts --project=chromium \
  -g "plugin management console"
```

### Resultado

- Estado: **PASS** (chromium, 1 passed, ~5s).
- Autentica via Keycloak y verifica en `/#/plugins`: heading Plugins, controles
  Refrescar/Recargar y la seccion Marketplace con el boton Previsualizar.
- Nota: la primera navegacion tras cambiar el frontend dispara el rebuild de Quinoa
  (Quarkus dev live-reload); una vez servido el nuevo build, la e2e pasa.

## Riesgo residual / siguientes incrementos

- Dashboard de canary por metricas (`.../versions/{version}/canary/metrics`) y
  activacion por version/rollback en la UI (el API existe).
- e2e del flujo preview->install con backend mockeado (page.route) para cubrir la
  accion end-to-end sin depender de un catalogo real.
- Estabilizar el smoke e2e preexistente; unificar tablas; badges con design tokens.
