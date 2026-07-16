# Evidencia de resiliencia distribuida — dos nodos (A) — 2026-07-15

Opción (A): evidencia **reproducible** (IT) de la garantía money-safe del claim distribuido bajo timeout
ambiguo (un nodo "muere" a mitad de un work-item). La opción (B) —dos contenedores reales— queda para la
validación operativa pre-prod.

> **Corrección (2026-07-15):** la cobertura de dos nodos **ya existía** y es más completa que un IT nuevo — incluye
> **contención real de 8 hilos**, no solo lógica secuencial. Un `TwoNodeClaimFencingIT` que se había añadido era
> **duplicado** y se **eliminó** (regla: sin código redundante). Esta evidencia referencia los tests existentes.

## Evidencia existente — `AsyncInboxClaimIT` (11/11)

El claim de `task_inbox` es **exclusivo por lease** y con **fencing por `inbox_claim_token`**, validado contra
Postgres real:

| Test | Garantía dos-nodos |
|---|---|
| `concurrentClaimsOnTheSameKeyGrantExactlyOne` | **8 hilos** compiten el mismo work-item a la vez (CountDownLatch) → **exactamente 1 gana** (contención real, no doble-ejecución) |
| `firstClaimWinsAndAConcurrentSecondDeliveryLoses` | dos entregas (tokens distintos), la 2ª pierde con el lease vivo — aun del mismo owner |
| `expiredLeaseIsTakenOverByAnotherNode` | lease **vencido** (nodo caído) → otro nodo lo re-clama (recovery) |
| `finalizeIsFencedByTokenSoAStaleDeliveryCannotFinalizeAReclaimedRow` | el nodo caído "despierta" y su finalize **rezagado NO pisa** la fila re-tomada (token distinto → 0 filas) → **cero doble-ejecución** |
| `finalizingTransitionsClaimedToTerminalAndDedups` | finalizado → terminal; una clave terminal **no se re-clama** (idempotencia) |
| `renewLeaseIsTokenScopedAndKeepsTheClaimUntakeable` | heartbeat renueva **solo el token dueño**; con lease vivo renovado, otro nodo **no roba** |
| `heartbeatRenewsTheLeaseAgainstTheRealDbFromItsSchedulerThread` | el heartbeat real avanza `claimed_until` desde su hilo de scheduler contra la BD |
| `recoverySweepMarksStaleClaimsDead` | el barrido de recuperación marca `DEAD` los claims estancados (visibles en DLQ) + limpia el token |
| `releasedClaimIsImmediatelyReClaimableByAnotherDelivery`, `sameTokenReClaimsForInAppRetry`, `renewLeaseOnATerminalRowIsANoOp` | release-on-failure, retry in-app por token, heartbeat post-terminal no-op |

## Contraparte PAY money-path — `Mt101CorrectiveLifecycleServiceTest.payLateAcceptanceAfterLeaseExpiry`

Un PAY cuyo lease vence (nodo caído a mitad del envío) → el scheduler lo marca **UNCERTAIN** (money-safe: pudo
llegar al banco) → un ACCEPTED tardío se resuelve UNCERTAIN→SENT **sin reenvío ciego** (`assertEquals(1,
payInvocations)`). `markExpiredPayExecutionsUncertain` es el recovery (UNCERTAIN si despachó / INVALIDATED si no).

## Garantía neta (dos nodos)
Bajo timeout ambiguo (nodo A muere a mitad de un PAY):
- **contención real:** de N entregas concurrentes del mismo work-item, exactamente **una** ejecuta el efecto.
- **recovery:** solo un lease **vencido** lo re-clama otro nodo; un lease vivo (heartbeat) es intocable.
- **fencing:** el nodo caído, al despertar, **no puede finalizar ni pisar** el work-item re-tomado (token).
- **PAY:** queda **UNCERTAIN** (conciliar), nunca re-enviado a ciegas → **cero doble pago físico**.

## Pendiente
- **(B)** confirmación operativa en vivo: 2 réplicas del app en el stack int, matar una a mitad de PAY, observar
  el recovery y el estado UNCERTAIN. Manual, no CI (la garantía ya está probada por (A)).
