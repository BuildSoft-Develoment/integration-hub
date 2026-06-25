# Revisión del análisis v40 — inmutabilidad del plan tras la aprobación

Fecha: 2026-06-25
Alcance: el v40 valida que el dispatcher correctivo ejecuta el plan persistido (transporte/JSON/hash/secretos),
y detecta **un P0 crítico nuevo**: el plan puede cambiar DESPUÉS de la aprobación porque la preparación
reescribe specs sin restringir al estado elegible del run. Directiva: sin código fallback / sin caminos legacy.

| Hallazgo v40 | Veredicto | Acción |
|---|---|---|
| **P0: el plan puede cambiar tras la aprobación** (una 2ª solicitud reescribe specs mientras el run ya está EXECUTING; o resetea un fragmento DISPATCHING/SENT a PREPARED) | **REAL → CORREGIDO** | `preparePayIntents` ahora SOLO escribe si el run está ELIGIBLE (`INSERT ... SELECT ... WHERE EXISTS (run.pay_status in NOT_REQUESTED/FAILED/INVALIDATED)`), y su `DO UPDATE` excluye fragmentos activos/terminales. Además, `requestCorrectivePay` rechaza ANTES de tocar el ledger si el PAY no está elegible (chequeo temprano) |
| P1: validación de secretos admite literales mezclados (`contains "${"`) | **REAL → CORREGIDO** | Un campo de credencial debe ser una referencia COMPLETA (`^${secret\|vault\|env\|config:...}$`); se rechaza `Bearer ${secret:x}`, `clave-real-${uetr}`, etc. |
| Atomicidad / huérfanos / secretos en ruta | **VALIDADO (v39)** | Confirmado |
| Pruebas del dispatcher correctivo real | **VALIDADO** | Ya existían; el v40 las confirma |

## Detalle

### P0 — inmutabilidad del plan aprobado
La carrera del v40: el maker A solicita (P1, REQUESTED), el checker B aprueba (EXECUTING, despachando P1), y el
maker C vuelve a llamar `requestCorrectivePay()`. La validación inicial sólo miraba `status='ARCHIVED'`
(lifecycle), no el `pay_status`, así que C pasaba y `preparePayIntents` reescribía los specs (P2) que B podía
leer y enviar.

**Fix (dos capas, sin fallback):**
1. **Chequeo temprano** en `requestCorrectivePay`: si `pay_status` no está en
   `{NOT_REQUESTED, FAILED, INVALIDATED}` se rechaza ANTES de preparar (una solicitud/despacho en curso →
   el plan aprobado es inmutable).
2. **Guarda en el upsert** de `preparePayIntents` (defensa TOCTOU, por si B gana entre el chequeo y la
   preparación): `INSERT ... SELECT ... WHERE EXISTS (run elegible)` → no-op si el run ya no es elegible; y el
   `DO UPDATE` mantiene la exclusión de fragmentos activos/terminales (`not in DISPATCHING/SENT/REJECTED/
   UNCERTAIN/INVALIDATED`). Así una 2ª solicitud NUNCA reescribe el plan de un run REQUESTED/EXECUTING ni
   resetea un fragmento DISPATCHING/SENT.

(El `refreshPayFragmentsFromCorrectiveSet` NO se guarda por estado de run: se usa también en `persistPayDetail`
tras el dispatch — run EXECUTING — para sincronizar el resultado; su propio `DO UPDATE` ya excluye estados
activos/terminales. El vector real de reescritura de specs es `preparePayIntents`, que sí queda guardado.)

### P1 — referencia de secreto completa
`assertSpecSafety`: un campo de credencial debe coincidir EXACTAMENTE con `${(secret|vault|env|config):nombre}`
(no basta con que "contenga ${"). Rechaza mezclas literal+plantilla. Para esquemas tipo Bearer se recomienda
estructura explícita `{authScheme, token}`.

## Pruebas (todas en verde)

- `Mt101CorrectiveLifecycleServiceTest` — **42**:
  - `secondRequestWhilePlanExecutingIsRejectedAndDoesNotOverwriteApprovedPlan` (P0: 2ª solicitud con run
    EXECUTING → rechazada; el `dispatch_spec_hash` de P1 no cambia).
  - `preparePayIntentsWritesOnlyWhenRunIsEligibleNeverOverwritingAnApprovedPlan` (P0/TOCTOU: upsert no-op con
    run EXECUTING; escribe con run NOT_REQUESTED).
- `Mt101PayFragmentReprocessTest` — **33**:
  - `dispatchPlanCompilerRequiresCompleteSecretReferenceNotMixedLiteral` (P1: `Bearer ${secret:x}` y
    `clave-real-${uetr}` rechazados; `${secret:bank-token}` permitido).
- Dominio swift completo: **246** tests, 0 fallos.
- Integración end-to-end (Flyway real V59+V60): `BankProfileHomologationIT` + `Mt101OutboundEndToEndIT` = **3**,
  0 fallos.

## Pendiente documentado (no bloqueante)

El v40 recomienda, como solución de máxima robustez, un **modelo versionado** (`mt101_corrective_pay_plan` /
`plan_revision` DRAFT/ACTIVE/SUPERSEDED) para separar borrador de plan activo. Con la guarda de elegibilidad +
el chequeo temprano + el claim que enlaza payload/routed_as/plan_hash/spec_hash/spec_json exacto, el plan
aprobado ya es inmutable de extremo a extremo en el flujo actual; el modelo versionado queda documentado como
evolución (no es una brecha abierta).

## Conclusión

El plan aprobado es ahora **inmutable** desde la aprobación hasta el envío: ninguna solicitud concurrente puede
reescribir los specs de un run REQUESTED/EXECUTING ni resetear fragmentos activos/terminales, y los campos de
credencial exigen una referencia completa. Con esto, "plan aprobado = plan ejecutado" se sostiene también
frente a solicitudes concurrentes.
