# Revisión del análisis app_htoh(43) → v43-ter — contrato inmutable completo

Fecha: 2026-06-26
Alcance: cierre de los pendientes que el análisis detecta sobre v43/v43-bis: el claim cruza solo la spec (no todo
el contrato) contra la revisión inmutable; el trigger de inmutabilidad no cubre INSERT; heartbeat incompleto en
fases largas; metadata `pay_plan_previous_status` no se limpia al concretar. Directiva: sin código fallback.

## Verdictos contra el código real

| Hallazgo | Verdicto | Acción |
|---|---|---|
| **P0: el cross-check solo ata `dispatch_spec_hash/json`**, no `payload_hash`/`dispatch_plan_hash`/`idempotency_key`/`approved_routed_as`/`dispatch_destination`/`dispatch_spec_version`. Un tamper consistente del payload pasaría el claim ("payload aprobado ≠ payload enviado"). | **REAL** | **CORREGIDO**: el cross-check ata TODO el contrato del fragmento contra la revisión inmutable. |
| **P0: el trigger V65 (`before update or delete`) permite INSERT en una revisión ACTIVE/SUPERSEDED** (agregar al conjunto aprobado también es mutarlo). | **REAL** | **CORREGIDO** (V66): el trigger cubre también INSERT; la cabecera solo se inserta como DRAFT. |
| Heartbeat no se renueva en `refresh`/`compile` (fases largas con 1M de fragmentos podrían perder la reserva). | **REAL** (operativo) | **CORREGIDO**: `renewReservation` al final de ambas. |
| `requestPay` no limpia `pay_plan_previous_status` al concretar. | **REAL** (metadata) | **CORREGIDO**: se limpia en la promoción a REQUESTED. |
| Pruebas de integridad (payload tamper, INSERT en ACTIVE). | **GAP** | **AÑADIDAS**. |

## Correcciones

### P0 #1 — el claim cruza TODO el contrato contra la revisión inmutable
`markPayFragmentDispatching` ahora exige que la fila de la revisión ACTIVE inmutable
(`mt101_corrective_pay_plan_fragment`) coincida con el ledger en **todo el contrato**, no solo la spec:

```
pf.payload_hash         = f.payload_hash
pf.idempotency_key      = f.idempotency_key
pf.approved_routed_as   = f.approved_routed_as
pf.dispatch_destination = f.dispatch_destination
pf.dispatch_plan_hash   = f.dispatch_plan_hash
pf.dispatch_spec_version= f.dispatch_spec_version
pf.dispatch_spec_hash   = f.dispatch_spec_hash
pf.dispatch_spec_json   = f.dispatch_spec_json
```

(transport y endpoint_ref van DENTRO de `dispatch_spec_json`, comparado exacto.) Con esto, una manipulación
directa del ledger del payload — aunque cambie también el payload origen y recompute `dispatch_plan_hash`
consistente — es atrapada contra la revisión inmutable: **payload aprobado = payload enviado**. Si no existe la
fila de la revisión activa, no se reclama (el ledger no es la fuente final del plan).

### P0 #2 — inmutabilidad también en INSERT (V66)
El trigger de `mt101_corrective_pay_plan_fragment` pasa a `before insert or update or delete`: rechaza insertar en
una revisión cuya cabecera ya sea ACTIVE/SUPERSEDED. La compilación normal sigue funcionando porque inserta los
`plan_fragment` ANTES de crear la cabecera DRAFT (en ese momento no hay cabecera para la revisión). Además, la
cabecera del plan solo puede insertarse como DRAFT (promoción a ACTIVE/SUPERSEDED solo vía UPDATE, ya restringido
en V65).

### Heartbeat en fases largas
`refreshPayFragmentsFromCorrectiveSet` y `compileDraftPlanRevision` renuevan la reserva (`renewReservation`) antes
de soltar el advisory lock, de modo que una fase larga (1M de fragmentos) no pierda la reserva por vencimiento
entre fases (evita trabajo desperdiciado en un takeover innecesario).

### Limpieza de metadata
`requestPay` (PREPARING_PLAN → REQUESTED) limpia `pay_plan_previous_status` (ya limpiaba reservation_id/by/at): un
run REQUESTED/EXECUTING/SENT no arrastra metadata de preparación.

## Pruebas (todas en verde)

- `Mt101CorrectiveLifecycleServiceTest` — **53** (+2):
  - `claimRejectsALedgerWhosePayloadOrPlanHashDivergesFromTheImmutableRevision`: control (RTEST2 legítimo reclama)
    + tamper de `payload_hash`+`dispatch_plan_hash` (spec intacta) → claim 0.
  - `insertingAFragmentIntoAnActivePlanRevisionIsRejectedByTrigger`: INSERT directo en revisión ACTIVE → rechazado;
    la revisión conserva exactamente sus 2 fragmentos.
- `Mt101PayFragmentReprocessTest` — **34** (harness: `plan_fragment` con todo el contrato; `seedActivePlanRevision`
  COPIA del ledger).
- `Mt101StatusTaskProviderTest` — **20**.
- Todos los tests Mt101 (unit): **286**, 0 fallos.
- Integración end-to-end con Flyway real (V66, `Successfully applied 66 migrations`): **3**, 0 fallos — el dispatch
  correctivo REAL reclama y envía CON el cross-check completo (la activación copia ledger→plan_fragment para todos
  los campos, así que los claims legítimos pasan; solo una divergencia se bloquea).

## Pendiente documentado (evolución, no brecha)

El análisis recomienda como solución superior que `readPreparedDispatchSpec` lea el contrato DIRECTAMENTE desde
`mt101_corrective_pay_plan_fragment` (revisión activa) en vez del ledger, dejando el ledger solo para estado
operativo. Con el cross-check completo + los triggers de inmutabilidad (incl. INSERT), el ledger ya no puede
desviarse del plan inmutable sin ser bloqueado en el claim, de modo que la garantía "plan aprobado = plan
ejecutado" se sostiene; la lectura directa desde `pf` es una evolución arquitectónica (elimina el ledger como
intermediario) que queda documentada.

## Conclusión

Se cierra la integridad TOTAL del contrato inmutable frente al ledger mutable: el claim ata todo el contrato
(payload, ruta, destino, idempotencia, plan_hash y spec) contra la revisión ACTIVE inmutable, y los triggers
impiden mutar esa revisión por UPDATE, DELETE **o INSERT**. Más heartbeat en fases largas y limpieza de metadata.
"plan aprobado = plan ejecutado" se sostiene también frente a manipulación directa del ledger operativo.
