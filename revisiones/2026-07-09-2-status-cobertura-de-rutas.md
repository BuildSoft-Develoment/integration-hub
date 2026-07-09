# #2 — STATUS route-aware cubre las rutas declaradas (cobertura de rutas)

**Fecha:** 2026-07-09
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Origen:** app_htoh #2 (versión completa con rutas). Implementado por decisión explícita del usuario.

## Qué se validó contra el código

- `MT101_ROUTE` declara sus rutas de forma **estática**: `configuration.rules[].routeTo` (+ `defaultRoute`), enumerable
  en definición ([Mt101RouteTaskProvider.parseRules](../platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101RouteTaskProvider.java)).
- `MT101_STATUS` **route-aware** consulta cada fragmento contra el endpoint de SU ruta vía `routeQuery` (map ruta→query),
  solo en el camino correctivo ([Mt101StatusTaskProvider.executeCorrectiveQuery](../platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101StatusTaskProvider.java)).
  En modo route-aware, una ruta **sin** entrada en `routeQuery` es un **fallo ruidoso en runtime** (no se consulta
  contra otro endpoint).

**El gap:** ese fallo se descubría recién al ejecutar. Como las rutas son estáticas, se puede exigir la cobertura en
**definición** y fallar claro (400) al publicar.

## Cambio (nuevo validador SRP, sin tocar G2)

- **`Mt101StatusRouteCoverageValidator`**: si un proceso tiene un `MT101_ROUTE` y, POSTERIOR, un `MT101_STATUS`
  route-aware (`routeQuery` no vacío), `routeQuery` **debe** cubrir todas las rutas declaradas (`rules[].routeTo`) por
  ese `MT101_ROUTE` upstream. Falta alguna → `IllegalArgumentException` (lista las rutas faltantes) → **400**.
- Cableado en `ProcessCatalogService.validateMoneyPath` (junto a G2/#1), en `create`/`update`/`setActive`, solo si el
  proceso es RUNNABLE (active). Reusa `Mt101PayResolutionValidator.TaskView`.

**Sano, sin falsos positivos:** solo dispara con AMBOS presentes y STATUS route-aware; sin `MT101_ROUTE` upstream o sin
`routeQuery`, no exige nada (no inventa rutas de runtime). El `defaultRoute` (bucket "no matcheó ninguna regla") se
**excluye** de la exigencia: no es un destino de gateway nombrado por el diseñador.

## Pruebas (evidencia)

| Suite | Resultado | Qué prueba |
|---|---|---|
| `Mt101StatusRouteCoverageValidatorTest` (unit) | **7/7** | ruta declarada sin cubrir → lanza; todas cubiertas → ok; STATUS no route-aware → ok; sin ROUTE upstream → ok; defaultRoute no exigido; ROUTE posterior no cuenta |
| `Mt101StatusRouteCoverageValidatorIT` (@QuarkusTest) | **3/3** | publicar ROUTE+STATUS route-aware sin cubrir → 400; cubriendo todo → 200; STATUS con `query.url` único → 200 |
| `Mt101AllTasksProcessE2EIT` (E2E pipeline completo) | **2/2** | sin regresión: proceso real con ROUTE+STATUS (no route-aware) sigue publicando/ejecutando |
| `ProcessCatalogServiceTest` (unit) | **10/10** | cableado intacto |
