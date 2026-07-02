# v37 — cierre de las brechas del plan persistido como fuente directa

Fecha: 2026-06-25
Alcance: el análisis de v37 detectó **tres brechas reales** en la primera entrega del v37 (el plan persistido
como fuente directa). Se corrigen las dos P0 (transporte vivo y hash no verificado) y se endurece la validación
de secretos (P1). Directiva: sin código fallback / sin caminos legacy.

| # | Hallazgo del análisis | Veredicto | Acción |
|---|---|---|---|
| P0.1 | El transporte podía venir de la **config viva**: con la config sin `routeTransports`, `defaultTransport` se resolvía de la config vigente y el flujo correctivo lo usaba en vez de `plan.transport()` (spec SFTP → se enviaba por REST) | **REAL → CORREGIDO** | En el flujo correctivo el transporte sale **siempre** del plan persistido: `transport = resolveTransport(plan.transport())`, nunca `defaultTransport`. El no-correctivo queda igual |
| P0.2 | `dispatch_spec_hash` se persistía pero **no se verificaba**; un `dispatch_spec_json` alterado (method/headers/timeout) que mantuviera transporte/destino/correlación conservaba el `dispatch_plan_hash` y pasaba el claim | **REAL → CORREGIDO** | Antes de materializar se verifica **integridad**: `specHash(json) == dispatch_spec_hash` persistido; si no, INVALIDATED (manipulación) sin llamar al banco. Además el claim **enlaza atómicamente** el `dispatch_spec_hash` (`markPayFragmentDispatching` lo valida en el mismo UPDATE) |
| P1 | Validación de secretos **heurística**: lista de claves exactas; no detectaba `X-API-Key`, `X-Bank-Token`, `Authorization-Internal`, `client_secret`, ni credenciales en URL | **REAL → CORREGIDO** | Detección por **substring del nombre normalizado** (sin separadores) contra tokens (`authorization/password/token/secret/apikey/credential/bearer/knownhosts/privatekey/passphrase`) + rechazo de credenciales embebidas en URL (`user:pass@host`) en cualquier valor de cadena |

## Detalle

### P0.1 — el transporte es exclusivamente el del plan
`Mt101PayTaskProvider.execute()` calcula `defaultTransport` desde la config vigente (cuando no hay
`routeTransports`). El bucle correctivo usaba `defaultTransport == null ? resolveTransport(plan.transport()) :
defaultTransport`, de modo que con una config viva REST sin rutas se enviaba por REST aunque la spec aprobada
fuera SFTP. Ahora el correctivo hace **siempre** `transport = resolveTransport(plan.transport())` (del plan
materializado). El branch no-correctivo conserva su comportamiento.

### P0.2 — integridad + claim atómico de la spec
- **Integridad:** antes de materializar, `Mt101DispatchPlanCompiler.specHash(prepared.specJson())` debe igualar
  el `dispatch_spec_hash` persistido. Un JSON alterado sin recalcular el hash → INVALIDATED, sin envío.
- **Claim atómico:** `markPayFragmentDispatching` recibe el `expectedDispatchSpecHash` y lo valida en el mismo
  UPDATE (`and f.dispatch_spec_hash is not distinct from ?`): la spec del ledger no pudo cambiar entre la
  lectura y el claim. El `dispatch_plan_hash` se mantiene como evidencia legible.

### P1 — secretos más estrictos
`assertNoLiteralSecrets` ya no usa igualdad exacta de clave. Normaliza el nombre (minúsculas, sin separadores)
y rechaza un literal si el nombre **contiene** un token sensible (cubre `X-API-Key`, `X-Bank-Token`,
`Authorization-Internal`, `client_secret`, etc.). Además rechaza credenciales embebidas en URL
(`://user:pass@host`) en cualquier valor.

## Pruebas (todas en verde)

- `Mt101PayFragmentReprocessTest` — **28**:
  - `correctiveDispatchUsesPersistedSftpTransportNotLiveRestConfig` (P0.1: spec SFTP + config viva REST sin
    rutas → SFTP usado, REST 0 llamadas).
  - `correctiveDispatchInvalidatesWhenPersistedSpecTamperedWithoutHash` (P0.2: spec manipulada → INVALIDATED,
    0 llamadas al banco).
  - `dispatchPlanCompilerRejectsNonStandardSecretKeysAndUrlCredentials` (P1: `X-API-Key` literal y credencial
    en URL rechazadas; referencia conservada).
  - más las del v37 base (sin-spec→INVALIDATED, plan persistido vs config viva, drift→INVALIDATED, etc.).
- Dominio swift completo: **235** tests, 0 fallos.
- Integración end-to-end (Flyway real V59): `BankProfileHomologationIT` + `Mt101OutboundEndToEndIT` = **3**, 0
  fallos.

## Pendiente (P1, fase 2 — documentado, no implementado)

El análisis recomienda que el **checker apruebe el conjunto exacto de planes**: mover `preparePayIntents` a
`requestCorrectivePay`, persistir `pay_plan_set_hash`/`pay_plan_count`/`pay_plan_version` en `mt101_rebuild_run`,
registrar `PAY_PLAN_PREPARED` y que la aprobación valide ese hash agregado (orden canónico por
`senders_reference + payload_hash + dispatch_spec_hash`). Es una reorganización del maker-checker (no una brecha
de ejecución: el dispatcher ya ejecuta exclusivamente la spec persistida e íntegra). Queda como fase 2.

## Conclusión

Con P0.1 y P0.2 cerradas, el plan persistido es ahora **la única fuente de transporte y de configuración
ejecutable** del dispatch correctivo: el transporte sale del plan (no de la config viva) y la spec se verifica
por hash (integridad + claim atómico), por lo que una alteración de `method/headers/timeout/retry/mTLS` ya no
puede cambiar el envío sin invalidar el claim. La validación de secretos cubre claves no estándar y credenciales
en URL. Resta, como fase 2, la aprobación del conjunto exacto de planes por el checker.
