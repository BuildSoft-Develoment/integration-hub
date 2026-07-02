# Evidencia G4: widget de salud de plugins en Overview - 2026-07-01

Aflora la salud de plugins en el dashboard principal: una tarjeta con activos /
degradados / bloqueados y enlace a `/plugins`, consumiendo endpoints ya existentes
(`GET /api/plugins` y `GET /api/plugins/canary/metrics`). Quick win del análisis.

## Cambios (solo frontend)

- `libs/features/overview/src/lib/api/overview-api.service.ts`: `getPluginDiagnostics()`
  y `getPluginCanaryMetrics()` (con `SKIP_GLOBAL_ERROR_FEEDBACK`).
- `libs/features/overview/src/lib/models/overview-plugin-health.model.ts`: shapes mínimos
  + `PluginHealth { active, degraded, blocked }`.
- `overview.store.ts`: señal `pluginHealth`; `load()` ahora carga resumen y salud en
  **paralelo y no-fatal** (`loadPluginHealth` captura errores → tarjeta oculta si el
  endpoint no está disponible o el rol no es admin, sin romper Overview).
  - `active` = instalados con estado ACTIVE; `degraded` = instalados con estado ≠ ACTIVE;
    `blocked` = métricas de canary con `promotable=false`.
- Componente `overview-plugin-health-card` (ts/html/css): tres conteos con color por
  estado (tokens `--ih-status-*`), semántica `<dl>`, alerta cuando hay degradados
  (error) o bloqueados (warn), y enlace `routerLink="/plugins"`.
- `overview-page` (ts+html): renderiza la tarjeta tras las métricas si hay salud.
- i18n en/es: `overview.plugins.title/active/degraded/blocked`,
  `overview.action.viewPlugins` (paridad respetada).

## Pruebas unitarias frontend

### Comando

```bash
npx nx test web --skip-nx-cache
```

### Resultado

- Estado: **PASS**. Test files: **80 passed**. Tests: **377 passed** (+1 nuevo en
  `OverviewStore`: agrega diagnósticos + canary a `pluginHealth {active:2, degraded:1,
  blocked:1}`).

## Prueba e2e (Playwright, chromium, stack real)

### Comando

```bash
# tras rebuild de Quinoa y health=200
BASE_URL=http://localhost:8080 npx playwright test \
  --config=apps/web-e2e/playwright.config.ts --project=chromium
```

### Resultado

- Suite completa: **5 passed (1.8m)**.
- Nuevo test "shows the plugin health card on the overview dashboard": mockea
  `/api/plugins` (2 ACTIVE + 1 DEGRADED) y `/canary/metrics` (1 no promocionable);
  verifica en `/#/overview` la tarjeta con **activos=2, degradados=1, bloqueados=1** y
  el enlace "Ver plugins".

## Estado de los pendientes (análisis)

- G1 (kit de autor frontend) ✅ · G4 (salud en Overview) ✅.
- Queda **G2**: UI admin para gestionar/previsualizar el catálogo de plugins frontend,
  simétrica al marketplace backend.
