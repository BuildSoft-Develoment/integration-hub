# Evidencia confirmacion de desactivacion + e2e de la consola de plugins - 2026-07-01

Continua la consola de gestion de plugins: anade confirmacion de dos pasos para la
accion destructiva de desactivar, y una prueba e2e Playwright de la consola contra
el stack real.

## Alcance

- Confirmacion de dos pasos (inline, sin dialogo nativo) para `deactivate`.
- Prueba e2e de la vista `/plugins` (render + controles de gestion) autenticada.

## Cambios verificados

- `plugin-diagnostics-page.component.ts`:
  - `requestDeactivate(id)` -> marca el plugin en confirmacion (`confirmingDeactivate`).
  - `confirmDeactivate(id)` -> limpia y ejecuta la desactivacion real.
  - `cancelDeactivate()` -> cancela sin llamar al API.
  - Boton `Confirmar?` con estilo *danger* + `Cancelar` cuando hay confirmacion pendiente.
- i18n en/es: `plugins.confirm`, `plugins.cancel`.
- `apps/web-e2e/src/example.spec.ts`: nuevo test
  "shows the plugin management console with backend controls" que autentica
  (Keycloak, admin/admin123) y verifica en `/#/plugins` el heading `Plugins` y los
  controles de gestion (Refrescar/Recargar).

## Pruebas unitarias frontend

### Comando

```bash
npx nx test web --skip-nx-cache
```

### Resultado

- Estado: PASS.
- Test files: 80 passed.
- Tests: 365 passed, 0 failed (2 casos nuevos: confirmacion en dos pasos y cancelacion).

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
- Autentica via Keycloak y verifica el render de la consola y sus controles de
  gestion sobre el API backend (`/api/plugins`, hoy 401 sin sesion -> protegido).
- Solo se ejecuta chromium: firefox/webkit no estan instalados en el entorno.

## Nota honesta

- El test preexistente `renders core protected routes` resulto **flaky** contra el
  stack en vivo (timeout/ERR de navegacion en distintos puntos), independiente de
  este cambio (se reprodujo tras revertir la ruta anadida). No se toco: es
  inestabilidad de timing de auth/navegacion preexistente, no del incremento.

## Riesgo residual / siguientes incrementos

- Exponer marketplace (preview + install) y dashboard de canary por metricas en la UI.
- Estabilizar el smoke e2e preexistente (subir timeout / esperar readiness del shell).
- Unificar las 4 tablas de diagnostico; badges con design tokens; auditoria a11y.
