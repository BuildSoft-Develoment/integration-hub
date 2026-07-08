# Async F: fencing del inbox once (orden claim→secretos + owner en finalize)

**Fecha:** 2026-07-07
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Alcance:** bloque **F** del análisis app_htoh(58) — subpuntos **F1** y **F2** (F3 heartbeat pendiente).

## Hallazgos (validados contra código real)

- **F1 — orden de secretos**: en el camino once, `resolveSecrets(configuration)` se ejecutaba **antes** de
  `claim()`. Un consumer que pierde el claim (otro nodo lo tiene vivo) ya había consultado Vault/OpenBao.
- **F2 — owner en el finalize**: `finalizeClaimed(… where status='CLAIMED')` **no validaba `inbox_owner`**. Un nodo
  con el lease vencido, cuya fila re-reclamó otro, podía finalizar la fila **ajena** (el `claim` sí fencea; el
  `finalize` no).

## Cambio

**F1**: en `AsyncTaskConsumer.consume` los `${secret:}` se resuelven **después** de ganar el claim. Solo el ganador
materializa secretos; un consumer que pierde el claim corta antes de tocar Vault.

**F2 (fencing por owner)**:
- Nueva fuente ÚNICA de identidad de nodo: `AsyncNodeIdentity` (`@ApplicationScoped`, SRP). El consumer reclama con
  `nodeIdentity.id()` y el store/gather **finalizan** con la misma identidad (misma JVM = mismo singleton).
- `TaskInboxRepository.finalizeClaimed(… , owner)` añade `and inbox_owner = ?owner`: solo el dueño actual del claim
  lo finaliza. Un finalize rezagado de un nodo desalojado → 0 filas → cae a `insertIfAbsent` (que tampoco pisa la
  fila viva del nuevo dueño). Aplica a `JpaTaskInboxStore` (once) y a `SliceGatherService` (slice/página).

DIP/SOLID: consumer, store y gather dependen de la misma `AsyncNodeIdentity` inyectada; el owner deja de ser un
literal disperso.

## Pruebas

- **F1** (`AsyncTaskConsumerTest`): `losingTheClaimDoesNotResolveSecrets` — con el claim perdido, se verifica que
  `resolveSecretsIn` **nunca** se invoca. 24/24.
- **F2** (`AsyncInboxClaimIT`, DB real): `finalizeIsFencedByOwnerSoAStaleNodeCannotFinalizeAReclaimedRow` — A
  reclama, su lease vence, B re-toma; el finalize de A devuelve 0 y no pisa a B; el de B sí finaliza. Se ajustó
  `finalizingTransitionsClaimedToTerminalAndDedups` para reclamar con la identidad del store (refleja el consumer
  real). 7/7.
- Sin regresión: scatter E2E (`AsyncScatterGatherE2EIT`, `AsyncStreamingScatterE2EIT`,
  `AsyncScatterRecoverySchedulerIT`) **9/9** — el conteo por `finalizeClaimed` fenceado por owner sigue exacto
  (consumer y gather comparten el singleton de identidad). Gather/store unit sin regresión.

## Pendiente: F3 (heartbeat / renew-lease)

Falta renovar el lease **durante** una ejecución larga (`renewLease`): hoy, si el efecto tarda más que el lease,
otro nodo puede re-reclamar y ambos ejecutar. El **fencing de F2 evita el doble finalize/overwrite**, pero no el
doble efecto por lease vencido a mitad de ejecución. F3 requiere un mecanismo de renovación en background (hilo/
timer que extienda `claimed_until` mientras corre `execute`) — cambio separado, de mayor alcance. Mitigación
actual: `tasks.async.consumer.claim-lease-seconds` (default 30) dimensionado > duración esperada del efecto.
