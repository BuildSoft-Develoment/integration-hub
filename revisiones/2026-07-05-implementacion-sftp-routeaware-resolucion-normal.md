# Implementación — SFTP / route-aware en `resolve-uncertain-normal-pay` (v55-fix, opción A parcial)

Fecha: 2026-07-05
Alcance: implementa el diseño del [análisis](2026-07-05-analisis-sftp-routeaware-resolucion-normal.md) (con la
corrección del doble-check sobre los campos disponibles). El resolver del UNCERTAIN normal (v52) pasa de **REST-only**
a **REST + SFTP + route-aware**, reusando la lógica del STATUS vía un **ejecutor de consulta compartido**. Sin
reenvío, sin rutas legacy.

## Cambios

### Ejecutor de consulta compartido (opción A)
Nuevo `Mt101StatusQueryExecutor`: encapsula `resolveStatusQuery` (route-aware) + la ejecución por transporte
(REST vía `Mt101StatusGateway`, SFTP vía `Mt101StatusSftpGateway` leyendo el ACK/NACK del banco) + la resolución de la
plantilla, **por registro** (sin muestra acotada). Devuelve `StatusQueryResult(confirmedStatus, gatewayReference,
rawBody, pending, error)` — NO clasifica ni persiste (eso lo hace cada caller). Es un port **verbatim** de la lógica
que hoy vive inline en `Mt101StatusTaskProvider` (misma semántica, sin fallback: una ruta sin endpoint = error).

### Resolver del UNCERTAIN normal
`Mt101PayUncertainResolutionService` deja de consultar solo REST: construye `QueryPlanConfig` (routeAware si hay
`routeQuery`; URL compartida opcional en ese modo) y delega cada registro en `statusQueryExecutor.query(record, config)`:
- `error` → cuenta error, mantiene sin resolver;
- `pending` (SFTP sin ACK aún) → mantiene sin resolver (reintentar);
- si no → clasifica `confirmedStatus` con `acceptedStatuses`/`rejectedStatuses` → `SENT`/`REJECTED` → transición
  durable. **Nunca reenvía.**

### Restricción documentada (del doble-check)
El registro normal (`unresolvedPayStatusRecords`) solo lleva `sendersReference` (:20:) y `route` — `build_fragment`
no persiste `gateway_reference`/`idempotency_key`. Por tanto las plantillas de STATUS del path normal deben
referenciar `${sendersReference}`/`${route}`. Es lo esperado para resolver un incierto (el banco consulta por :20:).

## Alcance del provider (decisión money-path)

El `Mt101StatusTaskProvider` **no se refactoriza en este cambio**: su ruta correctiva conserva la lógica inline (que el
ejecutor porta). Se evita cirugía apurada en el path de confirmación bancaria. El ejecutor es ya el **componente
compartido canónico**; migrar la ruta correctiva del provider a él (dedup puro, elimina la copia inline) queda como
**follow-up validado aparte** (cubierto por `Mt101StatusTaskProviderTest`, 20, incl. SFTP con contenedor). Es una
duplicación temporal contenida con camino de migración claro, preferible a arriesgar el money-path.

## Pruebas (evidenciadas)

- `Mt101PayUncertainResolutionServiceTest` (+1 = 3, Testcontainers + WireMock):
  `resolvesRouteAwareViaPerRouteEndpoint` (routeQuery → endpoint por `routed_as`, statusField propio → SENT), más los
  de v52 (REST ACCEPTED→SENT, REJECTED→REJECTED, PENDING/503 se mantienen).
- `Mt101StatusTaskProviderTest` (20): el provider **sin cambios** sigue verde (incl. SFTP con contenedor).
- **Suite Mt101 completa: 298 tests, 0 fallos** (BUILD SUCCESS), incluyendo los E2E con Flyway real
  (`Mt101AllTasksProcessE2EIT`, `Mt101MillionFileProcessE2EIT`, `Mt101OutboundEndToEndIT`).

## Conclusión

El resolver del UNCERTAIN normal soporta ahora **REST + SFTP + route-aware** vía el ejecutor compartido, con la
restricción de campos documentada. Bancos que despachan MT101 por SFTP o con enrutamiento por ruta pueden resolver un
incierto normal. Nunca reenvía. La dedup de la ruta correctiva del provider hacia el ejecutor queda como follow-up.
