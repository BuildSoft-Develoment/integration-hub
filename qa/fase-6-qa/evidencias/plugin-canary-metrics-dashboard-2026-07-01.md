# Evidencia dashboard de metricas de canary (full-stack) - 2026-07-01

Desbloquea y entrega el ultimo pendiente: un dashboard de solo lectura de las metricas
de canary de cada version de plugin. Requeria trabajo de backend (no existia un GET de
lectura; solo el POST de registro y el gate que lanzaba excepcion al promover).

## Backend

- **`PluginCanaryStatus`** (nuevo record en `service.plugin`): vista de solo lectura de
  la ventana de canary (muestras, fallos, ratio, umbrales, promotable, motivo de bloqueo).
- **`MetricsPluginPromotionGate.evaluate(pluginId, version)`**: contraparte no-lanzante
  de `assertPromotable`. Reutiliza el mismo repositorio y umbrales; calcula `promotable`
  y `blockReason` (`INSUFFICIENT_SAMPLES` / `FAILURE_RATIO_EXCEEDED`).
- **`PluginCanaryMetricsResponse`** (nuevo DTO en `api.response.plugin`).
- **`GET /api/plugins/canary/metrics`** en `PluginDiagnosticsResource`
  (`@RolesAllowed` PLATFORM_ADMIN / INTEGRATION_ADMIN / AUDITOR): evalua cada version
  instalada y devuelve la lista ordenada por pluginId+version.

### Pruebas backend

```bash
mvn -pl platform-app test \
  -Dtest=MetricsPluginPromotionGateTest,PluginDiagnosticsResourceTest \
  -Dsurefire.failIfNoSpecifiedTests=false
```

- Estado: **BUILD SUCCESS**, **20 tests** (Gate 6: +3 de `evaluate` sano/insuficiente/
  ratio; Resource 14: +1 `canaryMetricsEvaluatesEachInstalledVersion`).
- Verificacion en vivo: `GET /api/plugins/canary/metrics` -> **401** sin auth (endpoint
  registrado y protegido por rol).

## Frontend

- `plugin-diagnostics-page.component.ts`:
  - Interfaz `BackendCanaryMetric`, signals `canaryMetrics`/`canaryLoading`/`canaryError`,
    `loadCanaryMetrics()` (GET con `SKIP_GLOBAL_ERROR_FEEDBACK`) en `ngOnInit`, `refreshCanary()`.
  - Seccion "Metricas de canary" con tabla (id, version, muestras/min, fallos, ratio en %,
    estado Promocionable/Bloqueado, motivo), badge con tokens, estados carga/error/vacio
    (`role="status"`/`role="alert"`).
- i18n en/es: `plugins.canary(.loading/.error/.promotable/.blocked/.reason.*)`,
  `plugins.empty.canary`, `plugins.col.samples/failures/failureRatio` (paridad en/es).

### Pruebas unitarias frontend

```bash
npx nx test web --skip-nx-cache
```

- Estado: **PASS**. Test files: **80 passed**. Tests: **372 passed** (+1 nuevo:
  "renders the read-only canary metrics dashboard": verifica render de 20.0% + estado
  Bloqueado + motivo). El resto de tests drenan el nuevo GET de canary en `ngOnInit`.

### Prueba e2e (Playwright, chromium)

```bash
# tras reload de Quarkus + rebuild de Quinoa y health=200
BASE_URL=http://localhost:8080 npx playwright test \
  --config=apps/web-e2e/playwright.config.ts --project=chromium
```

- Suite completa: **3 passed (1.8m)**.
- "shows the plugin management console" verifica el heading "Metricas de canary".
- "runs backend plugin actions (mocked backend)" mockea `/api/plugins/canary/metrics`
  y verifica que la tabla renderiza `20.0%` y el motivo "Ratio de fallo superado".

## Estado de los pendientes

- Todos los pendientes documentados quedan **cerrados**. El dashboard de canary
  (ultimo, que requeria backend) esta entregado end-to-end.

## Siguientes incrementos (opcionales)

- Grafica temporal de la evolucion del ratio (hoy es un snapshot de la ventana).
- Filtro/orden en el dashboard de canary si crece el numero de versiones.
