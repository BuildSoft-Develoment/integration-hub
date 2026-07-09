# #4 — `inbox_claim_token`: claim del inbox async concurrency-safe (fencing por token)

**Fecha:** 2026-07-09
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Origen:** análisis app_htoh(62) #4. Autorizado el **rework completo** (no el "token suelto", que no cierra el gap).

## Qué cerró

El claim del inbox re-tomaba un `CLAIMED` vivo si `inbox_owner = excluded.inbox_owner` (para el retry in-app del mismo
nodo). Ese clause era seguro **solo** bajo `@Blocking(ordered=true)` + `max-concurrency=1` (serializado por nodo): con
`ordered=false`, dos entregas del mismo `idempotency_key` en el mismo nodo (mismo owner) re-clamaban **ambas** y
ejecutaban el efecto **dos veces**. El código lo documentaba como invariante P0-1.

**Fix:** un `inbox_claim_token` UUID por **ENTREGA** (no por-consume) reemplaza a `inbox_owner` como clave de fencing en
claim/renew/finalize. El retry in-app de una entrega reusa su token → re-clama; una entrega **concurrente distinta**
trae otro token y, con el lease vivo, **NO** re-clama (skip). La correctitud deja de depender de la config de concurrencia.

## Cambio (rework completo, SOLID, sin legacy)

- **V92**: `inbox_claim_token varchar(40)`.
- **`TaskInboxRepository`**: `claim` re-toma si `inbox_claim_token = excluded.inbox_claim_token OR claimed_until is null
  OR claimed_until < now`; `renewLease`/`finalizeClaimed` fencean por token; nuevo `releaseClaim` (owner queda informativo).
- **`releaseClaim` (release-on-failure)**: tras agotar los retries in-app, el consumer libera el claim para que la
  re-entrega del broker (token nuevo) lo re-clame de inmediato, en vez de esperar a que venza el lease (o que el barrido
  lo marque DEAD). El re-claim vía `claimed_until is null` lo permite.
- **Puerto `TaskInboxStore` + adaptador `JpaTaskInboxStore`**: firmas con `claimToken`; `owner` sigue viajando (dato
  informativo), pero el fencing es por token. `nodeIdentity` retirado del adaptador y del gather (ya no fencean por owner).
- **`LeaseHeartbeat`**: renueva por token.
- **`SliceGatherService`**: `commitCompletedSlice`/`failSlice` finalizan el claim de la slice por token.
- **`AsyncTaskConsumer`**: genera el token por-entrega en `consumeWithRetries` y lo enhebra por los caminos **once**,
  **slice** y **page** (claim/heartbeat/record/commit/fail); libera el claim (`releaseClaim`) en un fallo transitorio
  que propaga (at-least-once).

## Pruebas (evidencia)

| Suite | Resultado | Qué prueba |
|---|---|---|
| `AsyncInboxClaimIT` | **11 / 0 / 0** | **#4**: 2ª entrega (token distinto, lease vivo) pierde **aun con el mismo owner** (antes ganaba → doble efecto); mismo token re-clama (retry in-app); claim liberado se re-clama de inmediato; finalize/renew **fenceados por token**; lease vencido re-tomado; recovery→DEAD |
| `AsyncTaskConsumerTest` | **24 / 0 / 0** | núcleo del consumer (once/slice/page) con token, sin regresión |
| `JpaTaskInboxStoreTest` | **4 / 0 / 0** | adaptador (finaliza por token) |
| `SliceGatherServiceTest` | **4 / 0 / 0** | gather (finaliza slice por token) |
| `AsyncScatterGatherE2EIT` / `AsyncStreamingScatterE2EIT` | **1 / 7** | scatter + page-chain E2E con token, sin regresión |
| `AsyncTaskExecutionE2EIT` / `AsyncSuspendableReSuspendE2EIT` | **5 / 1** | camino once + re-suspensión E2E con token |

## Alcance / notas

- **Valor honesto**: hardening — el async es opt-in (`enabled=false`), `MT101_PAY` no es async (`UNSUPPORTED`) y
  `MT101_STATUS` (async) es idempotente; no había hueco de dinero. Esto **desacopla la correctitud de
  `ordered=true`/`max-concurrency=1`** (homologación: "la correctitud no depende de un valor de config").
- El invariante P0-1 documentado en `AsyncTaskBrokerConsumer` puede relajarse ahora, pero se deja `ordered=true`/
  `max-concurrency=1` como defensa en profundidad (no se cambia el comportamiento por defecto).

## Doble-check (bordes verificados)

- **Race heartbeat↔release:** ambos fencean por token; tras `releaseClaim` (token→null) un tick rezagado del heartbeat
  (`WHERE token=T`) hace 0 filas (no revive el lease). `runWithHeartbeat` cancela el heartbeat en su `finally` antes del
  `catch` que libera. Seguro.
- **Exactly-once tras release:** dos re-entregas concurrentes sobre una fila liberada serializan en el
  `INSERT...ON CONFLICT` → una gana, la otra ve el lease vivo → skip.
- **Supuesto documentado (borde teórico):** `releaseClaim` deja la fila `CLAIMED` con `claimed_until=null`
  (re-clamable), que el barrido de recuperación (`claimed_until < cutoff`) no ve. Si un broker **perdiera** el mensaje
  tras el `nack`, la fila quedaría in-flight invisible. **No aplica a Kafka**: `failure-strategy=fail` → halt+restart →
  redelivery desde el offset no comiteado (redelivery garantizado) → se re-clama y finaliza. El release **depende** de
  esa garantía del broker.

## Regresión async completa

**26 suites, 0 fallos, 0 errores** (inbox/scatter/page/suspend/kafka/retención/recovery/repo).
