# Revisión del análisis app_htoh(48) → v48-fix — maker-checker criptográficamente completo

Fecha: 2026-06-26
Alcance: el análisis recomienda que el **hash agregado del conjunto de planes** (`pay_plan_set_hash`, el artefacto que
el maker prepara y el checker aprueba) cubra el **contrato completo** por fragmento, no solo
`reference | payload_hash | dispatch_spec_hash`. Directiva: sin código fallback.

## Verdicto contra el código real

| Hallazgo | Verdicto | Acción |
|---|---|---|
| **El hash del conjunto (`pay_plan_set_hash`) era parcial**: concatenaba solo `corrective_senders_reference \| payload_hash \| dispatch_spec_hash`. Un cambio en otro campo ejecutable del contrato (`approved_routed_as`, `idempotency_key`, `transport`, `endpoint_ref`, `dispatch_destination`, `dispatch_plan_hash`, `dispatch_spec_version`) NO alteraba el hash aprobado. La aprobación seguía siendo segura porque el **claim** (`markPayFragmentDispatching`) ya contrasta el contrato COMPLETO contra la revisión inmutable `pf`, así que nunca hubo envío indebido; pero el propio artefacto maker-checker no era criptográficamente completo. | **REAL** (completitud criptográfica del maker-checker, NO brecha de envío) | **CORREGIDO** |

Importante: esto **no era** una brecha de "envío indebido". El principio "plan aprobado = plan ejecutado" ya estaba
protegido en el envío por el cross-check completo del claim contra la revisión ACTIVE inmutable. Lo que faltaba era que
el **hash que firma el checker** cubriera por sí mismo todo el contrato, cerrando la defensa en profundidad a nivel del
propio artefacto de aprobación.

## Corrección (sin código fallback)

`Mt101RebuildRepository`:

- `PAY_PLAN_SET_VERSION` → `"MT101_PAY_PLAN_SET_V2"` (versión del algoritmo del hash).
- Nuevo `PAY_PLAN_SET_COLUMNS` = contrato completo en orden estable:
  `corrective_senders_reference, payload_hash, idempotency_key, transport, endpoint_ref, approved_routed_as,
  dispatch_destination, dispatch_plan_hash, dispatch_spec_version, dispatch_spec_hash`.
- Nuevo helper `appendPayPlanSetRow(canonical, rs)` que anexa las 10 columnas (`getString|`) — UNA sola definición del
  canónico, usada por ambos cómputos para que sean idénticos por construcción.
- `computePayPlanSet` (lee del ledger `mt101_corrective_pay_fragment`) y
  `computePayPlanSetFromPlanRevision` (lee de la revisión inmutable `mt101_corrective_pay_plan_fragment`) usan AHORA
  ambos `PAY_PLAN_SET_COLUMNS` + `appendPayPlanSetRow`. Antes `computePayPlanSetFromPlanRevision` aún usaba la fórmula
  vieja de 3 campos; igualar ambos es lo que garantiza que el hash compilado de `pf` (al solicitar) y el hash vivo del
  ledger (al aprobar) coincidan en el flujo normal.

Las tres comparaciones de la aprobación (`Mt101CorrectiveLifecycleService` ~L300) siguen iguales y ahora son
criptográficamente completas:

```
approvedPlanSetHash (run.pay_plan_set_hash)  ==  activeRevisionHash (plan ACTIVE.plan_set_hash)  ==  computePayPlanSet(ledger)
```

Cualquier divergencia en CUALQUIER campo del contrato → el hash difiere → INVALIDA (sin enviar), re-solicitar.

## Pruebas (todas en verde)

- `Mt101CorrectiveLifecycleServiceTest` — **60** (+1):
  `approvalInvalidatesWhenAContractFieldBeyondPayloadAndSpecHashChanges`: tras solicitar, se altera SOLO
  `approved_routed_as` en el ledger (payload_hash y dispatch_spec_hash intactos). Con el hash V1 ese cambio NO movía el
  hash del conjunto (solo lo atrapaba el claim); con V2 el propio hash del conjunto difiere → la aprobación INVALIDA y
  `payInvocations == 0` (no se llama al banco).
- `Mt101PayFragmentReprocessTest` — **35** (dispatcher real lee el contrato de `pf`).
- `Mt101AllTasksProcessE2EIT` — aserto del resumen de `MT101_PAY` actualizado al formato real
  (`dispatch=3 sent=3 accepted=3 rejected=0 uncertain=0 retried=0`): el segmento `uncertain=0` lo emite el provider
  desde la contabilidad de inciertos ([Mt101PayTaskProvider:202]); era un drift de aserto preexistente, ajeno a v48
  (este E2E recorre el flujo outbound normal, NO el correctivo con `pay_plan_set_hash`, y despachó correctamente).
- **Suite Mt101 completa: 279 tests, 0 fallos** (BUILD SUCCESS), incluyendo los E2E con Flyway real
  (`Mt101AllTasksProcessE2EIT` 2 + `Mt101MillionFileProcessE2EIT` 3 + `Mt101OutboundEndToEndIT` 2 +
  `Mt101MassivePipelinePerfIT` 1 + `Mt101SplitRepairIT` 5).

## Compatibilidad

No hay datos persistidos que migrar: `pay_plan_set_hash`/`plan_set_hash` se (re)calculan en cada solicitud
(`requestCorrectivePay` compila la revisión y fija ambos hashes). El bump de versión a `MT101_PAY_PLAN_SET_V2` solo
etiqueta el algoritmo; cualquier run en vuelo se vuelve a solicitar antes de aprobar (es el flujo normal). No se dejó
ninguna ruta legacy que compute el hash viejo.

## Conclusión

El artefacto maker-checker es ahora **criptográficamente completo**: el hash que el checker aprueba cubre el contrato
ejecutable íntegro (idempotencia, transporte, endpoint, ruta, destino, plan_hash, versión y hash de spec, payload).
Combinado con read-from-pf (el dispatcher lee el contrato de la revisión ACTIVE inmutable), los triggers de
inmutabilidad, las FKs verificadas y el cross-check del claim, "plan aprobado = plan ejecutado" queda protegido en
todas las capas — y ahora también en la firma del propio plan aprobado. No quedan brechas P0 ni de disponibilidad.
