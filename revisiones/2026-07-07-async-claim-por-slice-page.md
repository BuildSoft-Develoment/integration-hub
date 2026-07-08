# Async E: claim por slice/página antes del efecto externo (exactly-once en scatter)

**Fecha:** 2026-07-07
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Alcance:** bloque **E** del análisis app_htoh(58).

## Hallazgo (validado contra código real)

`AsyncTaskConsumer.consumeSlice`/`consumePage` ejecutaban `batchProvider.executeRecords(...)` **sin reclamar** el
inbox; el único guard previo era `isScatterTerminal` (cierre global). La agregación N→1 usaba `insertIfAbsent` al
**commit** (`SliceGatherService`), que dedupea el **conteo** pero NO el **efecto**: una reentrega de una slice
volvía a ejecutar el efecto externo (REST_CALL, DB_WRITE, SFTP…) — el tracker contaba una vez, pero el efecto
ocurría dos. El camino `once` sí reclamaba (§5); slice/página no.

## Cambio (SOLID: mismo ciclo de vida del claim que el once)

1. **Consumer**: helper `claimScatterUnit(envelope)` (DRY) — `isProcessed?` → salta; si no, `claim()` atómico
   (owner+lease). Se invoca en `consumeSlice` y `consumePage` **antes** de leer/ejecutar. Una reentrega ya terminal
   o con un claim vivo ajeno NO repite `executeRecords`.
2. **Gather**: `commitCompletedSlice`/`failSlice` ahora **transicionan el claim** `CLAIMED → PROCESSED/DEAD` con
   `finalizeClaimed` y cuentan en esa transición (helper `countScatterUnitOnce`, SRP). Fallback a `insertIfAbsent`
   para una unidad sin claim previo (fallo de resolución del provider antes del claim; compat rolling-deploy).

El claim (dedup de **ejecución**) y el finalize (dedup de **conteo**) son ahora la **misma fila**, con el mismo
lifecycle NEW→CLAIMED→terminal del camino once. Sin fallback silencioso: un crash mid-ejecución re-ejecuta
(at-least-once, como once); lo que se elimina es el doble efecto por reentrega/claim-vivo.

## Pruebas

- **`AsyncTaskConsumerTest`** (fake inbox): `redeliveredProcessedSliceDoesNotReexecuteTheEffect` (slice terminal →
  `executeRecords` NO se llama) y `sliceWithLiveClaimByAnotherNodeDoesNotExecuteTheEffect` (claim ajeno → no
  ejecuta). 23/23.
- **E2E (Testcontainers + broker real)**: `AsyncScatterGatherE2EIT`, `AsyncStreamingScatterE2EIT` (incl. el retry
  in-app de página transitoria), `AsyncScatterRecoverySchedulerIT` → **9 tests** verdes: la agregación y el
  sellado siguen exactos con el conteo basado en `finalizeClaimed`.
- Unit del gather/inbox sin regresión (`SliceGatherServiceTest` 4/4, `JpaTaskInboxStoreTest` 4/4).

## Pendiente

- **F** (fencing del inbox once): orden claim→secretos, `finalizeClaimed … and inbox_owner=?`, y heartbeat/
  `renewLease` para ejecuciones largas.
