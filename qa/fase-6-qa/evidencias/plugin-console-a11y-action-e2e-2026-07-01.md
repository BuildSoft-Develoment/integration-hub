# Evidencia a11y de estados + e2e de acciones con backend mockeado - 2026-07-01

Anade accesibilidad a los estados de carga/error de la consola de plugins y una
prueba e2e que ejercita el flujo de ACCION (mutacion) end-to-end con el backend
mockeado (`page.route`), sin depender de un catalogo/estado real.

## Alcance

- a11y: `role="status"` + `aria-live="polite"` en carga; `role="alert"` en errores
  (diagnostico backend y preview de marketplace).
- e2e de acciones: activar-version y marketplace-preview verificando la llamada al
  API y el render del resultado, con respuestas mockeadas.

## Cambios verificados

- `plugin-diagnostics-page.component.ts`:
  - Carga backend: `role="status" aria-live="polite"`.
  - Error backend: `role="alert"`.
  - Error de marketplace: `role="alert"`.
- `apps/web-e2e/src/example.spec.ts`: nuevo test
  "runs backend plugin actions end-to-end (mocked backend)":
  - `page.route` mockea `/api/plugins` (con versions), `.../versions/2.0.0/activate`
    y `/marketplace/preview`.
  - Autentica (Keycloak), pulsa "Activar version" -> verifica el POST de activacion.
  - Rellena el form de marketplace, pulsa "Previsualizar" -> verifica el POST y el
    render del descriptor previsualizado (`demo-remote`).

## Pruebas unitarias frontend

### Comando

```bash
npx nx test web --skip-nx-cache
```

### Resultado

- Estado: PASS.
- Test files: 80 passed.
- Tests: 369 passed, 0 failed (a11y no requiere casos nuevos; el render se cubre).

## Pruebas e2e (Playwright, chromium)

### Comando

```bash
# stack levantado (localhost:8080)
BASE_URL=http://localhost:8080 npx playwright test \
  --config=apps/web-e2e/playwright.config.ts --project=chromium -g "plugin"
```

### Resultado

- Estado: **PASS** (2 passed, ~6.2s):
  - "shows the plugin management console with backend controls" (render read-only).
  - "runs backend plugin actions end-to-end (mocked backend)" (mutacion: activar
    version + marketplace preview verificados).
- El e2e de acciones usa backend mockeado (`page.route`), por lo que valida el flujo
  de UI sin mutar el backend real ni depender de un catalogo externo.

## Riesgo residual / siguientes incrementos

- GET de metricas de canary para un dashboard (hoy solo hay POST de registro) —
  trabajo backend primero.
- Estabilizar el smoke e2e preexistente `renders core protected routes` (flaky por
  timing de auth/nav).
- Unificar las 4 tablas de diagnostico en una vista filtrable; badges con design
  tokens; auditoria a11y completa (contraste, foco, navegacion por teclado).
