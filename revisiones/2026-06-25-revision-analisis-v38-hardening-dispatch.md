# Revisión del análisis v38 — endurecimientos del dispatch correctivo

Fecha: 2026-06-25
Alcance: el v38 valida los tres cierres del v37 (transporte solo del plan, integridad del spec_hash, conjunto
de planes aprobado por el checker) y plantea **cuatro endurecimientos**. Directiva: sin código fallback / sin
caminos legacy.

| # | Hallazgo v38 | Veredicto | Acción |
|---|---|---|---|
| 1 | Secretos se resuelven ANTES de ganar el claim (un worker que pierde el claim igual consulta Vault; un fallo de Vault deja el fragmento PREPARED bajo run EXECUTING) | **CORREGIDO** | Se RECLAMA primero (con los valores persistidos), y solo tras ganar el claim se resuelven secretos. Si la materialización (Vault/spec) falla tras el claim → `INVALIDATED` (sin banco), nunca UNCERTAIN |
| 2 | El claim enlazaba el `dispatch_spec_hash` pero no el JSON exacto (un JSON cambiado conservando el hash rompía la integridad de evidencia) | **CORREGIDO** | El claim enlaza además el `dispatch_spec_json` EXACTO (`and f.dispatch_spec_json is not distinct from ?`): el ledger representa byte-a-byte lo que se envía |
| 3 | Preparación del conjunto de planes no era atómica con `PAY_REQUESTED` (un fallo a mitad dejaba el run atascado en REQUESTED con hash nulo) | **CORREGIDO** | Se compilan y persisten los planes ANTES de cambiar a REQUESTED; si la compilación falla, el run sigue en su estado previo (re-solicitable), nunca atascado |
| 4 | El output reportaba el transporte de la config viva (REST) aunque el plan persistido ejecutara SFTP | **CORREGIDO** | El output correctivo reporta `transport=PERSISTED_PLAN` y `transportsUsed=[...]` con los transportes realmente usados por fragmento |

## Detalle

### #1 — reclamar antes de resolver secretos
El bucle correctivo ahora: lee la spec → valida integridad (`specHash(json)==hash`) → **materializa SIN resolver
secretos** (solo parseo JSON, sin Vault) para validar estructura y computar el `dispatch_plan_hash` del claim →
**reclama** (`markPayFragmentDispatching` con payload+routed_as+plan_hash+spec_hash+**spec_json**) → y solo
DESPUÉS, con el claim ganado, resuelve secretos (Vault) y envía. Beneficios:
- Un worker que **pierde el claim** (lease vencido / run no EXECUTING) **no consulta Vault**.
- Un fallo de Vault/materialización **tras** el claip → `invalidatePayFragmentMaterializeFailure` → `INVALIDATED`
  (re-solicitable), sin banco, sin marcar UNCERTAIN ni exigir STATUS.

Para que el `dispatch_plan_hash` sea idéntico al persistido sin depender de un plan re-resuelto con Vault, la
PREPARACIÓN también deriva destino + plan_hash de la **materialización sin secretos del propio spec** (misma
cuenta que el dispatch).

### #2 — el claim enlaza el JSON exacto
`markPayFragmentDispatching` añade `and f.dispatch_spec_json is not distinct from ?`. El ledger no puede cambiar
entre la lectura y el claim ni siquiera conservando el mismo hash: lo ejecutado == lo persistido byte-a-byte.

### #3 — preparación antes de REQUESTED
`requestCorrectivePay`: `refresh + preparePayIntents + computePayPlanSet` (sin cambio de estado) → luego
`requestPayWithAction` (REQUESTED + PAY_REQUESTED) → `persistPayPlanSet` + `PAY_PLAN_PREPARED`. Un fallo de
compilación deja el run en su estado previo (re-solicitable), no atascado en REQUESTED con hash nulo.

### #4 — output del transporte real
`transport=PERSISTED_PLAN` + `transportsUsed` (acumulados realmente en el dispatch) para el flujo correctivo.

## Pruebas (todas en verde)

- `Mt101PayFragmentReprocessTest` — **31**:
  - `correctiveDispatchUsesPersistedSftpTransportNotLiveRestConfig` + asserts de output (`transport=PERSISTED_PLAN`,
    `transportsUsed=[SFTP]`) (#4).
  - `correctiveSecretResolutionFailureAfterClaimInvalidatesWithoutBankCall` (#1: Vault falla tras claim →
    INVALIDATED, 0 llamadas).
  - `correctiveDispatchDoesNotResolveSecretsWhenClaimIsLost` (#1: claim perdido → 0 resoluciones de secretos).
  - `claimBindsExactDispatchSpecJsonNotOnlyItsHash` (#2: JSON distinto → no reclama; JSON exacto → reclama).
  - el test de drift de plan sigue válido (el plan_hash se recomputa de la materialización sin secretos).
- `Mt101CorrectiveLifecycleServiceTest` — **38**.
- Dominio swift completo: **240** tests, 0 fallos.
- Integración end-to-end (Flyway real V59+V60): `BankProfileHomologationIT` + `Mt101OutboundEndToEndIT` = **3**,
  0 fallos.

## Conclusión

Los cuatro endurecimientos del v38 quedan cerrados: se reclama antes de resolver secretos (sin Vault si se
pierde el claim; INVALIDATED seguro si Vault falla), el claim enlaza el JSON exacto de la spec, la preparación
del conjunto precede al cambio a REQUESTED, y el output reporta el transporte real del plan persistido. El
dispatcher correctivo ejecuta exclusivamente el plan persistido aprobado, con integridad byte-a-byte y sin
caminos legacy.
