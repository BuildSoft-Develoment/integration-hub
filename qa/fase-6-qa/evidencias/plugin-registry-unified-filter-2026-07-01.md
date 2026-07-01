# Evidencia vista unificada filtrable del registro frontend - 2026-07-01

Unifica las tres tablas del registro de plugins frontend (instalados / en cuarentena
/ degradados) en **una sola vista filtrable**, reduciendo ruido visual y permitiendo
al operador ver todo el estado del runtime en un solo lugar con filtro por estado.

## Alcance

- Una tabla unica (Id / Estado / Detalle) que combina instalados, en cuarentena y
  degradados, cada fila con su badge de estado (tokens de color del incremento previo).
- Grupo de chips de filtro: Todos / Instalados / En cuarentena / Degradados, cada uno
  con su contador y `aria-pressed`, accesible via `role="group"`.
- Estado vacio contextual: mensaje distinto si no hay plugins vs. si el filtro no
  matchea (`plugins.empty.filtered`).
- El detalle de instalados conserva nombre, version y origen; cuarentena/degradados
  muestran la razon.

## Cambios verificados

- `plugin-diagnostics-page.component.ts`:
  - Tipos `FrontendPluginStatus`/`FrontendPluginFilter`/`FrontendPluginRow`.
  - `frontendRows` (computed que combina las 3 fuentes en filas homogeneas),
    `frontendFilter` (signal), `filteredFrontendRows` (computed filtrado),
    `frontendFilters` (chips con contador reactivo).
  - Template: reemplaza 3 `<section>` por una seccion unificada con chips + tabla.
  - Estilos `.plugins-filters`/`.plugins-chip`/`--active` con design tokens.
- i18n en/es: `plugins.registry`, `plugins.filter.all`, `plugins.col.detail`,
  `plugins.empty.filtered` (paridad en/es respetada).

## Pruebas unitarias frontend

### Comando

```bash
npx nx test web --skip-nx-cache
```

### Resultado

- Estado: **PASS**. Test files: **80 passed**. Tests: **370 passed** (+1 nuevo:
  "filters the unified registry view by status": valida que `filteredFrontendRows`
  respeta el filtro por estado).

## Prueba e2e (Playwright, chromium, stack real)

### Comando

```bash
# tras rebuild de Quinoa y health=200
BASE_URL=http://localhost:8080 npx playwright test \
  --config=apps/web-e2e/playwright.config.ts --project=chromium
```

### Resultado

- Suite completa: **3 passed (1.8m)**.
- El test "shows the plugin management console" ahora tambien verifica el heading
  "Registro frontend", el `role="group"` de filtros y que al pulsar el chip
  "Instalados/Installed" queda `aria-pressed="true"`.
- Smoke `renders core protected routes` sigue verde.

## Riesgo residual / siguientes incrementos

- Metricas de canary de solo lectura (requiere GET en el backend primero).
- Auditoria a11y completa (contraste medido, foco visible, navegacion por teclado).
