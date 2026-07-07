# Async F3 — heartbeat / renovación de lease durante ejecuciones largas

**Fecha:** 2026-07-07
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Alcance:** bloque **F3** del análisis app_htoh(58) (cierra F).

## Problema (validado contra código real)

El claim del inbox lleva `owner` + `claimed_until` (lease). La re-toma ocurre cuando `claimed_until < now`
(`TaskInboxRepository.claim`). Si un `execute()` dura **más que el lease**, una **reentrega** durante esa ejecución
(rebalance de Kafka al superar `max.poll.interval.ms`≈5m, o crash/restart) encuentra el lease **vencido** y otro
nodo **re-toma** el claim → **doble efecto externo**. El fencing del finalize (F2) evita el doble *finalize*, pero
no el doble *efecto*.

## Cambio (Opción A, SOLID)

1. **Repo** `renewLease(key, owner, claimedUntil) → int`: `update … set claimed_until=? where idempotency_key=? and
   status='CLAIMED' and inbox_owner=?`. **Owner-scoped**: solo el dueño renueva; 0 filas si ya lo perdió/finalizó.
2. **Puerto** `TaskInboxStore.renewLease(envelope, owner, leaseSeconds) → boolean` + adaptador `@Transactional`.
3. **`LeaseHeartbeat`** (bean nuevo, SRP): `ScheduledExecutorService` daemon compartido. `runWithHeartbeat(envelope,
   owner, Supplier<T> work)` programa una renovación cada `lease/2`, ejecuta el `work` (síncrono) en el hilo actual
   y **cancela** la renovación en `finally` (aun si `work` lanza). Una renovación tardía tras finalizar es no-op
   (fila ya no `CLAIMED`). Si el dueño pierde el claim, se registra y sigue (F2 es la red; no se puede abortar
   `execute()`).
4. **Consumer**: envuelve los 3 efectos con el heartbeat — `provider.execute` (once) y `batchProvider.executeRecords`
   (slice y página).

**Overhead nulo para tareas rápidas**: la 1ª renovación es a `lease/2` (15s con lease=30s), así que un efecto que
termina antes nunca escribe. Config: `tasks.async.consumer.claim-lease-seconds` (30) y `heartbeat-threads` (2).

## Pruebas

- **`LeaseHeartbeatTest`** (unit, mock store): renueva mientras un `work` que dura > `lease/2` corre y **deja de
  renovar** al terminar (future cancelado); un `work` rápido **nunca** renueva; se cancela aun si el `work` lanza.
  3/3.
- **`AsyncInboxClaimIT`** (DB real): `renewLease` es **owner-scoped** (dueño renueva, ajeno → false) y con el lease
  vivo otro nodo **no re-toma** el claim; renovar una fila ya `PROCESSED` es no-op. 9/9.
- **Sin regresión**: once (`AsyncTaskExecutionE2EIT` 5/5), Kafka real (`AsyncTaskKafkaConsumerE2EIT` 1/1), scatter y
  streaming (`AsyncScatterGatherE2EIT`, `AsyncStreamingScatterE2EIT`) — el wrap del heartbeat no altera el flujo.

## Cierre del bloque F (y del análisis app_htoh 58)

- **F1** (orden claim→secretos), **F2** (owner en finalize) y **F3** (heartbeat) → completos. El once y el scatter
  async tienen ahora claim + fencing + heartbeat, cerrando el doble-efecto por reentrega/lease vencido.
- Junto con **A/B/C** (PAY normal simétrico) y **E** (claim slice/página), el análisis app_htoh(58) queda
  implementado end-to-end.
