# Evidencia de resiliencia distribuida — dos nodos (A: IT automatizado) — 2026-07-15

Opción (A) autorizada: IT reproducible que asevera la garantía money-safe del claim distribuido bajo timeout
ambiguo (un nodo "muere" a mitad de un work-item). La opción (B) —dos contenedores reales en el stack int— queda
para después como confirmación operativa.

## Qué valida (`TwoNodeClaimFencingIT`, 2/2)

El claim de `task_inbox` es **exclusivo por lease** y con **fencing por `inbox_claim_token`**. Cada acción de nodo
corre en su **propia transacción** (commit entre pasos) = dos nodos reales actuando en momentos distintos.

**Test 1 — `liveLeaseBlocksOthersButAnExpiredLeaseIsStolenAndTheDeadNodeIsFenced`:**
1. node-A clama el work-item (CLAIMED, token-A, lease vivo).
2. node-B intenta robar el lease **VIVO** → **0 filas** (exclusividad; no doble-claim).
3. el lease de node-A **VENCE** (node-A cayó) → node-B re-clama con **token-B** (recovery). ✓
4. node-A "despierta" e intenta **finalizar** su claim (token-A) → **0 filas, FENCED** (token mismatch) →
   **cero doble-ejecución / cero reenvío físico**. El work-item sigue CLAIMED por node-B. ✓
5. node-B (dueño real) finaliza → PROCESSED. ✓
6. un re-claim posterior de cualquier nodo sobre el terminal → **0 filas** (idempotencia, no re-ejecución). ✓

**Test 2 — `heartbeatRenewalKeepsTheLeaseAndBlocksTheft`:**
- node-A renueva su lease (heartbeat, token-A) antes de vencer → node-B no puede robar aunque haya pasado el lease
  original. ✓
- un nodo que no es el dueño (token-B) **no puede renovar** el lease (fencing del heartbeat). ✓

## Contraparte PAY (ya cubierta)

La parte money-path específica —un PAY cuyo lease vence → **UNCERTAIN** (money-safe, pudo llegar), **sin reenvío
ciego**— la cubre `Mt101CorrectiveLifecycleServiceTest.payLateAcceptanceAfterLeaseExpiry` con
`assertEquals(1, payInvocations)` (un solo envío) + resolución UNCERTAIN→SENT. `markExpiredPayExecutionsUncertain`
es el recovery.

## Garantía neta (dos nodos)
Bajo un timeout ambiguo (nodo A muere a mitad de un PAY):
- node-B **no re-ejecuta** el claim de A mientras el lease esté vivo; **lo re-clama** solo si venció (recovery).
- node-A, al despertar, **no puede finalizar ni pisar** el work-item re-tomado (fencing por token).
- el PAY queda **UNCERTAIN** (conciliar), nunca re-enviado a ciegas → **cero doble pago físico**.

## Pendiente
- **(B)** confirmación operativa: 2 réplicas del app en el stack int, matar una a mitad de PAY, observar el
  recovery y el estado UNCERTAIN. Manual, no CI.
