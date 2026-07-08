# C — fencing distribuido de dos nodos: cobertura de evidencia (v60)

**Fecha:** 2026-07-08
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Alcance:** documentar que los invariantes de "dos nodos" del análisis app_htoh(60) **ya están cubiertos** por tests
deterministas contra Postgres real, y diferir formalmente el harness de dos JVMs.

## Contexto

El análisis pedía una prueba de dos nodos (mismo proceso, mismo fragment_set, PAY normal, timeout → STATUS →
reconcile, **cero reenvío físico**). El doble-check contra el código mostró que **cada invariante ya está probado**:
la carrera cross-node se simula de forma **determinista** manipulando el estado en Postgres real (token/lease/claim),
y como el claim es **SQL atómico** (`INSERT … ON CONFLICT` / `UPDATE … WHERE`), esa simulación prueba lo mismo que
dos hilos concurrentes reales (la BD serializa la carrera). Un harness de dos JVMs añadiría solo realismo de *timing*,
a un costo alto y con flakiness — sin cerrar ningún hueco de correctitud.

## Mapa requisito de C → test que lo cubre (verificado en el cuerpo, no solo el nombre)

| Requisito de "dos nodos" | Test | Qué asegura |
|---|---|---|
| Zombi no clobbera al nuevo dueño tras timeout/takeover | `ProcessExecutionFencingIT` | lease vencido → `NEEDS_RECONCILIATION` + token limpiado; re-claim con **otro** token; `completeProcess`/`failProcess`/`completeTask` del worker viejo → `FencingTokenLostException`; el estado del nuevo dueño **no** se corrompe |
| Claim del inbox cross-node (owner + lease) | `AsyncInboxClaimIT` | re-toma solo por lease vencido o mismo owner; un claim vivo ajeno no se pisa |
| **Cero reenvío físico del PAY** | `Mt101PayNormalDurableTest#ambiguousResultMarksFragmentUncertainAndASecondPayDoesNotResend` | 1er PAY: 3 despachos (uno por ARCHIVED), A2 → UNCERTAIN. **2º PAY: `transport.calls() == 0`** — un UNCERTAIN nunca se reenvía |
| Fragmento en vuelo no re-despachado por otro nodo | `Mt101PayNormalDurableTest#claimArchivedForDispatchIsAtomicAndClaimsEachFragmentOnlyOnce` | 1er claim: C1/C2 → DISPATCHING; **2º claim (otro worker): vacío** — un fragmento ya DISPATCHING no lo reclama otro |
| Terminal tardío no sobrescribe + marca conflicto | `Mt101PayNormalDurableTest#lateTerminalResultDoesNotOverwriteStatusAndFlagsPayConflict` | ACCEPTED tardío sobre un REJECTED de STATUS → GUARDADO (solo desde DISPATCHING/UNCERTAIN) + `pay_conflict` durable |
| STATUS concurrente al mismo terminal es idempotente | `Mt101PayNormalDurableTest#concurrentStatusResolvingToSameTerminalIsIdempotentNotConflict` | dos STATUS al mismo terminal → sin conflicto |
| STATUS concurrente a terminal distinto se marca | `Mt101PayNormalDurableTest#concurrentStatusResolvingToDifferentTerminalIsFlaggedAndEmitsPayConflictAudit` | contradicción terminal → `pay_conflict` + trama `PAY_CONFLICT` |
| STATUS reconcilia UNCERTAIN/DISPATCHING | `Mt101PayUncertainResolutionServiceTest` (item 4) | `UNRESOLVED = {UNCERTAIN, DISPATCHING}` → SENT/REJECTED consultando STATUS, nunca reenvía |
| Recuperación de scatter/page-chain estancado | `AsyncScatterRecoverySchedulerIT`, `AsyncStreamingScatterE2EIT` | el barrido re-despacha lo estancado sin duplicar el efecto |

## Fence estructural en código (invariante, no solo test)

- `Mt101PayTaskProvider.FRAGMENT_READ_STATUSES = ["ARCHIVED"]` → el PAY **solo** lee ARCHIVED; nunca re-lee
  DISPATCHING/SENT/UNCERTAIN → es **imposible** re-despachar un fragmento ya reclamado (independiente del nodo).
- `AsyncNodeIdentity` (owner por nodo) + lease + `finalizeClaimed` con fencing por owner (F2) + `LeaseHeartbeat` (F3):
  un nodo con lease vencido no finaliza una fila re-reclamada por otro; el heartbeat evita el re-dispatch de un claim
  vivo.

## Evidencia ejecutada (fresca, v60)

| Suite | Resultado |
|---|---|
| `ProcessExecutionFencingIT` | **4 / 0 / 0** |
| `AsyncInboxClaimIT` | **10 / 0 / 0** |
| `AsyncScatterRecoverySchedulerIT` | **1 / 0 / 0** |
| `Mt101PayNormalDurableTest` | **6 / 0 / 0** |
| **Total (corrida fresca v60)** | **21 / 0 / 0 — BUILD SUCCESS** |

(`Mt101PayUncertainResolutionServiceTest` 7/7 se corrió en el bloque previo de v60.)

## Decisión

- **C está cubierto** por los tests deterministas anteriores; no se escriben tests redundantes (sin código de más).
- El **harness de dos JVMs** se **difiere** formalmente: añade solo realismo de timing (la correctitud del claim es
  SQL-atómica y ya está probada por simulación secuencial contra Postgres real), a costo alto y con flakiness. Se
  reconsideraría solo si una homologación externa exige evidencia de timing concurrente real entre dos instancias.
