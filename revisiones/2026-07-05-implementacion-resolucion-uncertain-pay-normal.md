# Implementación — resolución del `UNCERTAIN`/`DISPATCHING` del PAY normal por STATUS (pendiente #1, v52-fix)

Fecha: 2026-07-05
Alcance: implementa el flujo de resolución del estado durable del PAY normal analizado en
[el análisis previo](2026-07-05-analisis-resolucion-uncertain-pay-normal.md). Cierra el ciclo de vida abierto por v51:
v51 impide el reenvío (incierto → `UNCERTAIN`/`DISPATCHING`, excluido de re-selección); v52 **resuelve** ese estado
consultando el gateway (MT101_STATUS), sin reenviar. Directiva: sin código fallback. Opción B autorizada (config desde
la definición de proceso).

## Cambios

### Fuente durable (repositorio)
`Mt101FragmentRepository.unresolvedPayStatusRecords(set, statuses, afterIndex, pageSize)`: lee de `mt101_build_fragment`
los fragmentos en `UNCERTAIN`/`DISPATCHING` (paginado por `fragment_index`), con la forma de registro que consume la
consulta al gateway (`sendersReference` :20: + `route`). Es el análogo NORMAL de `correctivePayStatusRecords` (que lee
el ledger correctivo) — resuelve el gap: da una **fuente durable** de qué consultar, en vez del hand-off in-memory del
pipeline (que solo lleva SENT).

### Transición condicional (repositorio)
`Mt101FragmentRepository.resolvePayStatus(set, refs, fromStatuses, toStatus, error)`: transiciona CONDICIONALMENTE los
fragmentos de `UNCERTAIN`/`DISPATCHING` → `SENT`/`REJECTED` en un solo UPDATE por lote. Solo cambia lo que sigue no
resuelto: nunca pisa un terminal ni reenvía.

### Servicio de resolución
`Mt101PayUncertainResolutionService.resolveUncertainNormalPay(connectionRef, fragmentSetId, executedBy, reason)`:
1. resuelve el `taskDefinitionId` del set (`findSetMetadata`) y carga la config de `MT101_STATUS` de la definición de
   proceso (`taskConfigSource.taskConfig`) — **opción B**;
2. pagina TODOS los fragmentos no resueltos (sin muestra acotada), y por cada uno consulta el gateway REST
   (`Mt101StatusGateway.query`) con la URL-plantilla por `${sendersReference}`;
3. clasifica el `confirmedStatus` con los tokens `acceptedStatuses`/`rejectedStatuses` de la config → `SENT`/`REJECTED`
   / pendiente;
4. transiciona `build_fragment` por página (IN acotado); **nunca** invoca PAY/transporte;
5. devuelve `NormalPayResolution(resolvedSent, resolvedRejected, stillPending, gatewayErrors)`.

Idempotente: re-correr resuelve solo lo que sigue `UNCERTAIN`/`DISPATCHING` (lo ya `SENT`/`REJECTED` no se re-consulta).
Un gateway pendiente o con error deja el fragmento como está (reintentar luego). Nunca fuerza a terminal ni reenvía.

### Endpoint
`POST /api/query/mt101-quarantine/rebuild-runs/resolve-uncertain-normal-pay?connectionRef&fragmentSetId&reason`
(roles `PLATFORM_ADMIN/INTEGRATION_ADMIN/OPERATOR/PAYMENTS_OPERATOR`), análogo a `/resolve-uncertain-pay`.

## Pruebas (evidenciadas)

- `Mt101PayUncertainResolutionServiceTest` (NUEVO, Testcontainers + WireMock):
  - `resolvesUncertainToSentOrRejectedByGatewayAndNeverResends`: U1(UNCERTAIN)→gateway ACCEPTED→`SENT`;
    U2(DISPATCHING)→REJECTED→`REJECTED`; U3(UNCERTAIN)→PENDING→**sigue `UNCERTAIN`** (nunca se fuerza ni reenvía).
  - `gatewayErrorLeavesFragmentUncertainForRetry`: gateway 503 → `gatewayErrors=1`, el fragmento se mantiene.
- **Suite Mt101 completa: 291 tests, 0 fallos** (BUILD SUCCESS), incluyendo los E2E con Flyway real
  (`Mt101AllTasksProcessE2EIT` 2, `Mt101MillionFileProcessE2EIT` 3, `Mt101OutboundEndToEndIT` 2), que también validan
  el arranque CDI del nuevo servicio + el constructor del recurso.

## Caveats / follow-ups documentados (sin código fallback)

- **REST-only**: la resolución solo soporta consulta REST (`query.url`). Una config SFTP/route-aware se **rechaza con
  error claro** (no se consulta a ciegas); soportarlas es un follow-up.
- **Sin persistencia de confirmación de auditoría** durante la resolución: a diferencia del correctivo (que escribe
  `mt101_confirmation`), aquí el motivo del rechazo queda en `build_fragment.error_message` y los conteos en la
  respuesta, pero falta el rastro por-fragmento de la consulta. Follow-up.
- **`DISPATCHING` nunca-enviado** (crash pre-envío): el gateway no lo confirmará → se mantiene `DISPATCHING` (seguro,
  no se reenvía). Re-armarlo a un estado re-enviable es una **acción deliberada de operador** aparte (inherente al
  modelo de seguridad; el correctivo tiene la misma limitación).

## Conclusión

Cerrado el ciclo de vida del PAY normal incierto: v51 impide el reenvío; v52 **resuelve** consultando el gateway y
transiciona a `SENT`/`REJECTED` de forma durable e idempotente, sin reenviar nunca. Un `REJECTED` resultante ya es
reprocesable por la transición existente `REJECTED→BUILT`. Espeja `resolveUncertainPay` del correctivo sobre
`build_fragment`. Los follow-ups (SFTP/route-aware, auditoría de confirmación, re-arm de DISPATCHING) quedan
documentados.
