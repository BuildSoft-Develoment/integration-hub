# Cierre — correctivo MT101 / PAY gobernado (rondas v15 → v22)

Fecha: 2026-06-22
Directiva del usuario: revisar cada análisis contra el **código real**, sin código fallback ni
caminos legacy, validar lo ya implementado, e implementar lo viable **con documentación y pruebas
evidenciadas**; al final correr la app en `localhost:8080` y entrar a login.

Este documento cierra la serie. Detalle por hallazgo en
[`2026-06-20-revision-analisis-v22-vs-codigo-real.md`](2026-06-20-revision-analisis-v22-vs-codigo-real.md)
y los docs por ronda `2026-06-*-revision-analisis-v15..v21-*`.

## Invariantes garantizados (verificados con prueba)

| Invariante de seguridad de dinero | Mecanismo | Prueba |
|---|---|---|
| Ningún envío al banco sin intención durable **aprobada y única** por fragmento | Transición estricta `PREPARED → DISPATCHING` (`where pay_status='PREPARED'`); el provider no llama al transporte si no reclamó | `correctivePayNeverCallsTransportWithoutPreparedIntent` |
| Un fragmento ya despachado **no se reenvía** (se resuelve por STATUS) | `markDispatching` no re-reclama `DISPATCHING`; resolución vía MT101_STATUS | `correctivePayDoesNotResendAlreadyDispatchedFragment` |
| Fallo post-dispatch (timeout/IO) → **UNCERTAIN**, nunca FAILED reusable | `hasDispatchedPayFragments` → `markPayUncertain` + lease | `payFailureAfterDispatchBecomesUncertainNotReusableFailed` |
| Ledger durable por fragmento (no la muestra capada) | `updatePayFragmentResults` por referencia | `correctivePayPersistsEveryFragmentResultNotJustTheOutputSample` |
| Config + payload aprobados **congelados** y validados atómicamente al claim | `claimPayForExecution` exige `pay_requested_payload_hash` **y** `pay_requested_config_hash` recomputados | `payClaimPreventsDoubleSendWhenAnotherCheckerWonTheClaim` |
| Resolver PAY incierto **no reenvía** y deja evidencia (quién/cuándo/por qué) | `resolveUncertainPay` consulta STATUS; V49 `pay_resolved_by/at/reason` | `resolveUncertainPayRunsStatusWithoutSecondPayInvocation` |
| Fallo de STATUS/RECONCILE **no revierte** PAY=SENT (visibilidad separada) | `status_sync_status` / `reconciliation_status` | `postPayStatusFailureDoesNotRevertSentAndIsVisibleSeparately` |
| Fragmento sin ruta usable (UNROUTED) **no se archiva ni se paga** | UNROUTED = error de ruta + `REJECTED` en ROUTE | `unroutedFragmentIsRejectedAtRouteSoArchiveAndPayExcludeIt` |
| Solicitud de PAY del maker deja **motivo/ticket** de negocio | V50 `pay_request_reason/ticket`; cadena resource→service→repo | `payRequestPersistsBusinessReasonAndTicketAsDurableEvidence` |
| STATUS consulta cada fragmento contra el endpoint de **su ruta**; ruta sin endpoint = error ruidoso (sin fallback) | `routed_as` por registro + `routeQuery` por ruta en `executeCorrectiveQuery` | `correctiveStatusQueriesEachFragmentAgainstItsRouteEndpointAndFailsLoudWhenRouteHasNoEndpoint` |

## Cambios de esta ronda de cierre

**Auditoría de la solicitud de PAY (motivo/ticket del maker):**
- **V50** `mt101_corrective_pay_request_reason.sql`: `pay_request_reason text`, `pay_request_ticket varchar(120)`.
- `Mt101RebuildRepository.requestPay(...)`: persiste motivo/ticket (`blankToNull`) y limpia rastro de
  resolución previo al re-solicitar.
- `Mt101CorrectiveLifecycleService.requestCorrectivePay(...)`: overload con `requestReason`/`requestTicket`
  (el de 3 args delega, sin romper callers).
- `Mt101QuarantineResource`: `@QueryParam("reason")` / `@QueryParam("ticketRef")` en `request-pay`.

**STATUS por perfil/ruta (REST vs SFTP), sin fallback:**
- `Mt101RebuildRepository.correctivePayStatusRecords(...)`: expone `routed_as` por fragmento (`route`).
- `Mt101StatusTaskProvider.executeCorrectiveQuery(...)`: config `routeQuery` (endpoint por ruta);
  `resolveStatusQuery` elige el endpoint de la ruta del fragmento; una ruta sin entrada —o un fragmento
  sin ruta— es **error ruidoso** (no se consulta contra el endpoint de otra ruta). Sin `routeQuery`,
  todas comparten `query.url` (caso aceptado por el v22, sin cambios de comportamiento).

## Evidencia de pruebas (run de cierre, offline)

- `Mt101CorrectiveLifecycleServiceTest` — **15** tests, 0 fallos.
- `Mt101PayFragmentReprocessTest` — **7** tests, 0 fallos.
- `Mt101StatusTaskProviderTest` — **17** tests, 0 fallos (incluye STATUS por ruta).
- `Mt101RoutePersistedFragmentTest` — **2** tests, 0 fallos.
- Dominio swift completo (provider + service + repository), reactor: **188** tests, 0 fallos, `BUILD SUCCESS`.

## P2 abiertos

Ninguno. Los dos P2 documentados del v22 (motivo/ticket de PAY y STATUS por ruta) quedaron cerrados en
esta ronda, ambos sin fallback y con prueba evidenciada.

## App / login

Stack completo levantado con `start-platform-stack.cmd` (postgres, keycloak, kafka, clickhouse,
audit-consumer). App dev en `http://localhost:8080/` (health 200), Flyway al día, Keycloak realm
`integration-hub` con login alcanzable (well-known 200).
