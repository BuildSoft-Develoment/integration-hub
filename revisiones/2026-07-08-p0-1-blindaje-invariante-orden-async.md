# P0-1 — blindaje de la invariante de orden del consumer async (defensivo)

**Fecha:** 2026-07-08
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Alcance:** P0-1-B (endurecimiento defensivo), validado con doble-check contra código real.

## Contexto (doble-checkeado)

El claim del `task_inbox` ([TaskInboxRepository.claim](../platform-app/src/main/java/com/integrationhub/platform/repository/TaskInboxRepository.java))
re-toma una fila `CLAIMED` del **mismo owner** (necesario para el retry in-app, que es secuencial). El owner es por
nodo compartido (`AsyncNodeIdentity` `@ApplicationScoped`). Si el canal procesara en **paralelo**, dos entregas del
mismo `idempotency_key` en el mismo nodo matcharían same-owner y ejecutarían el efecto externo **dos veces**
(doble-pago en el money-path).

**Alcanzabilidad hoy: NO** — verificado en el doble-check por tres capas independientes:
1. **Stream serial por nodo**: `AsyncTaskBrokerConsumer` es `@Blocking(ordered=true)` (default) y `tasks-in` no tiene
   `partitions`/concurrencia → un solo stream secuencial (el `max-concurrency=8` del pool era **inerte**).
2. **Fencing cross-node**: otro nodo tiene owner distinto; solo re-reclama si el lease venció (`claimed_until < now`).
3. **LeaseHeartbeat (F3)**: renueva el lease mientras el nodo procesa → el scheduler de recuperación no re-despacha un
   claim vivo; el lease solo vence si el heartbeat muere (nodo caído) → ese nodo no está ejecutando.

Además el canal está **deshabilitado por defecto** (`tasks-in.enabled=false`).

## Residual atacado: fragilidad latente (no un bug)

La seguridad dependía de un **default implícito** (`ordered=true`) mientras `max-concurrency=8` estaba **explícito** e
inerte — un foot-gun: un futuro `ordered=false` por throughput reabriría la ventana de doble-efecto **en silencio**.

## Cambio (SOLID — mínimo, defensivo)

1. **Invariante explícita en código**: `@Blocking(value = "async-task-worker-pool", ordered = true)` + comentario que
   documenta el acoplamiento con el claim same-owner (antes dependía del default implícito).
2. **Blindaje por test**: `AsyncTaskBrokerConsumerOrderingTest` afirma por reflexión que `@Blocking.ordered()` es
   `true` y el pool es el dedicado → **falla CI** si alguien lo cambia (cierra la regresión silenciosa).
3. **Foot-gun defusado**: `async-task-worker-pool.max-concurrency` de `8` → `1` (defensa en profundidad; el pool es
   **exclusivo** de este consumer — verificado). Subirlo exige antes volver el claim seguro ante concurrencia
   (fencing token por-entrega o claim-una-vez fuera del retry), documentado en el comentario.

Sin cambio de comportamiento en runtime (el canal está apagado y `ordered=true` ya serializaba); es un blindaje contra
regresión futura.

## Pruebas (evidencia)

| Suite | Resultado | Qué prueba |
|---|---|---|
| `AsyncTaskBrokerConsumerOrderingTest` | **1 / 0 / 0** | la invariante `@Blocking(ordered=true)` + pool dedicado (falla si se cambia) |
| `AsyncTaskConsumerTest` | **24 / 0 / 0** | núcleo del consumer sin regresión |

## Resumen

P0-1 no era alcanzable (tres capas + canal apagado). P0-1-B convierte esa seguridad **implícita** en **explícita y
verificada**: la invariante de orden vive en la anotación, un test la bloquea, y el `max-concurrency` inerte pasa a 1
para que activar concurrencia sea una decisión consciente (que exige endurecer el claim primero). La robustez plena
(fencing token / claim-una-vez) queda documentada como pendiente condicionado a que `ordered=false` sea un requisito
real de throughput.
