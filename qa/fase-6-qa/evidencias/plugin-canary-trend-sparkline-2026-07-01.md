# Evidencia tendencia temporal del ratio de canary (sparkline) - 2026-07-01

Anade la evolucion temporal del ratio de fallo de cada version de plugin al dashboard
de canary, como una mini-grafica (sparkline) SVG. Se integra en el GET existente
`/api/plugins/canary/metrics` para no anadir round-trips.

## Backend

- **`PluginInvocationMetricRepository.summarizeBetween(id, version, from, to)`**: total y
  fallos en un rango `[from, to)`.
- **`MetricsPluginPromotionGate.trend(...)`**: divide la ventana en 12 buckets de igual
  anchura y calcula el ratio de fallo por bucket (mas antiguo primero). Buckets vacios
  reportan 0.
- **`PluginCanaryStatus`** y **`PluginCanaryMetricsResponse`** ganan `List<Double> trend`;
  `evaluate(...)` la puebla y el resource la mapea.

### Pruebas backend

```bash
mvn -pl platform-app test \
  -Dtest=MetricsPluginPromotionGateTest,PluginDiagnosticsResourceTest \
  -Dsurefire.failIfNoSpecifiedTests=false
```

- Estado: **BUILD SUCCESS**, **21 tests** (Gate 7: +1 `evaluateBuildsTwelveBucketTrendOldestFirst`
  y las 3 de `evaluate` ahora stubean `summarizeBetween`; Resource 14: trend verificado
  en `canaryMetricsEvaluatesEachInstalledVersion`).
- Verificacion en vivo: `GET /api/plugins/canary/metrics` -> **401** sin auth; **0**
  ERROR/Exception en el log durante el e2e (las 12 queries por version no fallan).

## Frontend

- `plugin-diagnostics-page.component.ts`:
  - `BackendCanaryMetric.trend`, metodo puro `sparkline(trend)` que mapea la serie a un
    `polyline` en un viewBox 100x24, dominio fijo [0,1] (0% abajo, 100% arriba), mas
    antiguo a la izquierda.
  - Nueva columna "Tendencia" con `<svg role="img">` accesible (aria-label con el ratio
    actual), color por estado (verde promocionable / rojo bloqueado). Estilo `.canary-spark`.
- i18n en/es: `plugins.col.trend` (paridad respetada).

### Pruebas unitarias frontend

```bash
npx nx test web --skip-nx-cache
```

- Estado: **PASS**. Test files: **80 passed**. Tests: **374 passed** (+1 nuevo
  "maps a trend series to sparkline points in a fixed [0,1] domain"; el test del
  dashboard verifica el render del `svg.canary-spark` con 4 puntos).

### Prueba e2e (Playwright, chromium)

```bash
# tras reload de Quarkus + rebuild de Quinoa y health=200
BASE_URL=http://localhost:8080 npx playwright test \
  --config=apps/web-e2e/playwright.config.ts --project=chromium
```

- Suite completa: **3 passed (1.8m)**.
- "runs backend plugin actions (mocked backend)" mockea `trend` de 6 buckets y verifica
  que el `svg.canary-spark[role="img"]` renderiza un `polyline` con 6 puntos.

## Estado de los pendientes

- Todos los pendientes documentados quedan **cerrados**, incluido el ultimo incremento
  opcional (tendencia temporal). No quedan pendientes en la lista.
