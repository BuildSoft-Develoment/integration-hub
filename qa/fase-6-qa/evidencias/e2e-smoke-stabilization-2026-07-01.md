# Evidencia estabilizacion del smoke e2e - 2026-07-01

Estabiliza la prueba e2e preexistente `renders core protected routes`, que resultaba
flaky (timeout/ERR de navegacion) contra el stack en vivo desde que el frontend usa
el builder de Native Federation (arranque/paginas mas lentos, rebuilds de Quinoa que
dejan el server momentaneamente sin responder).

## Causa raiz

- Un unico test recorria 6 rutas con presupuesto total de 90 s -> tiempo acumulado
  al limite.
- `gotoAuthenticated` solo absorbia `ERR_ABORTED`; un `ERR_EMPTY_RESPONSE` /
  `ERR_CONNECTION_REFUSED` durante un rebuild transitorio hacia fallar la navegacion.

## Cambios verificados (solo test, sin tocar el app)

- `apps/web-e2e/src/example.spec.ts`:
  - Timeout del smoke: 90 s -> 180 s; assert de `h1` por ruta: 15 s -> 20 s.
  - `gotoAuthenticated` con reintento de navegacion que absorbe caidas transitorias
    del server (`ERR_EMPTY_RESPONSE`/`ERR_CONNECTION_REFUSED`/`RESET`/`Timeout`),
    manteniendo `ERR_ABORTED` como esperado (hash routing aborta la carga top-level).
  - Espera del shell (`h1` visible) tras autenticar, para estabilizar las asserts.

## Prueba e2e (Playwright, chromium, stack real)

### Comando

```bash
# stack levantado (localhost:8080)
BASE_URL=http://localhost:8080 npx playwright test \
  --config=apps/web-e2e/playwright.config.ts --project=chromium
```

### Resultado

- **2 corridas consecutivas en verde**:
  - Corrida 1: **3 passed (2.5m)** — absorbio un `health 000` transitorio al inicio
    (el reintento de navegacion lo cubrio: la estabilizacion funcionando).
  - Corrida 2: **3 passed (1.7m)**.
- Los 3 tests: `renders core protected routes` (antes flaky, ahora estable),
  `shows the plugin management console with backend controls`,
  `runs backend plugin actions end-to-end (mocked backend)`.

## Estado de la suite e2e

- Suite completa (chromium) verde y repetible. firefox/webkit no estan instalados en
  el entorno; se ejecuta chromium.

## Riesgo residual / siguientes incrementos

- Metricas de canary de solo lectura (requiere un GET en el backend primero).
- Polish de UI: unificar las 4 tablas de diagnostico en una vista filtrable; badges
  con design tokens; auditoria a11y completa (contraste/foco/teclado).
