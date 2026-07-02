# Decisión: "dispatcher lee la revisión inmutable" — se mantiene v43-ter (no se refactoriza)

Fecha: 2026-06-26
Alcance: evaluación a nivel de código del único punto restante del análisis app_htoh(43): que
`readPreparedDispatchSpec` lea el contrato ejecutable DIRECTAMENTE desde la revisión ACTIVE inmutable
(`mt101_corrective_pay_plan_fragment`) en vez del ledger operativo. Decisión del usuario: **mantener v43-ter**.

## Hallazgo a nivel de código (por qué NO añade seguridad)

Flujo real del dispatcher correctivo (`Mt101PayTaskProvider`, líneas 254-297):

```
prepared = readPreparedSpec(...)            // hoy lee del ledger
if (prepared == null/blank) -> invalidateMissingSpec; continue
if (specHash(specJson) != specHash) -> invalidateTamperedSpec; continue   // integridad
structuralPlan = materialize(specJson, null)
planHash = dispatchPlanHash(structuralPlan, payloadHash(message), approvedRoutedAs, message)
if (!markDispatching(... payloadHash, approvedRoutedAs, planHash, specHash, specJson)) continue   // CLAIM
plan = materialize(specJson, secretResolver)  // re-resuelve secretos tras ganar el claim
transport = resolveTransport(plan.transport())
dispatch(transport, plan.configuration(), message)
```

El `markDispatching` (claim) ya incluye, desde v43-ter, el cross-check que exige que el ledger coincida con la
revisión ACTIVE inmutable (`pf`) en **todo el contrato** (payload_hash, idempotency_key, approved_routed_as,
dispatch_destination, dispatch_plan_hash, dispatch_spec_version, dispatch_spec_hash, dispatch_spec_json; transport
y endpoint_ref van dentro del spec_json comparado exacto). Por tanto:

- **Si el ledger difiere de `pf` en cualquier campo, el claim FALLA y no se despacha.** El dispatcher nunca puede
  enviar bytes que difieran de la revisión inmutable.
- En consecuencia, **v43-ter ya garantiza "bytes enviados = revisión inmutable"** (= "plan aprobado = plan
  ejecutado"). Leer desde `pf` produce exactamente el mismo resultado de seguridad.

## Por qué leer desde `pf` sería peor (costo sin beneficio de seguridad)

1. **Vuelve redundante / muerta la verificación de integridad del dispatcher**: `pf` es inmutable por trigger
   (V65/V66), así que `specHash(pf.specJson) == pf.specHash` SIEMPRE es verdadero → la rama
   `invalidateTamperedSpec` por integridad nunca se ejecutaría.
2. **Cambia la semántica del outcome ante tamper del ledger**: hoy una spec del ledger alterada sin recalcular su
   hash → `INVALIDATED` (estado terminal claro, re-solicitable). Leyendo desde `pf`, el dispatcher leería `pf`
   (consistente) y el claim fallaría por divergencia ledger↔pf → el fragmento quedaría **PREPARED** (estado
   ambiguo, no terminal). Es seguro (no se despacha), pero operativamente peor.
3. **Reescribe pruebas de integridad en la ruta de dinero** (p.ej.
   `correctiveDispatchInvalidatesWhenPersistedSpecTamperedWithoutHash`) por un cambio que no mejora la seguridad.
4. **Se pierde la defensa en capas**: hoy hay DOS defensas independientes (integridad del dispatcher sobre el
   ledger + cross-check del claim contra `pf`). El refactor colapsaría ambas en una sola.

## Decisión

Se **mantiene v43-ter**. La garantía "plan aprobado = plan ejecutado / payload aprobado = payload enviado" ya está
cerrada: el claim bloquea cualquier divergencia entre el ledger y la revisión ACTIVE inmutable, los triggers
(V65/V66) impiden mutar esa revisión por UPDATE/DELETE/INSERT, y se conserva la defensa en capas con el outcome
`INVALIDATED` claro. La lectura directa desde `pf` queda documentada como evolución arquitectónica **opcional**
(un solo origen de verdad), sin valor de seguridad adicional, a evaluar solo si se prioriza la limpieza
arquitectónica sobre la estabilidad de la ruta de dinero.

## Estado

Sin cambios de código en este turno (solo análisis). La app corre v43-ter (`7933359e`); Mt101 unit 286 + IT 3
(Flyway V66) en verde; login alcanzable.
