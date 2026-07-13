# A + B — limpieza de token en DEAD + lineage por línea física acotado por ejecución

**Fecha:** 2026-07-09
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Origen:** análisis app_htoh(63), hallazgos concretos validados contra código.

## A — `markExpiredClaimsDead` limpia también `inbox_claim_token`

**Hallazgo (validado):** el barrido de recuperación ponía `inbox_owner=null, claimed_until=null` al marcar `DEAD`,
pero **no** `inbox_claim_token`, dejando un token huérfano en la fila DEAD — inconsistente con `finalizeClaimed` y
`releaseClaim` (que sí lo limpian). Introducido en #4. No es P0 (una fila `DEAD` no es re-clamable → no abre doble
ejecución), pero es higiene del DLQ.

**Cambio:** `markExpiredClaimsDead` ahora hace `... inbox_owner=null, inbox_claim_token=null, claimed_until=null ...`.

**Prueba:** `AsyncInboxClaimIT.recoverySweepMarksStaleClaimsDead` +assert `claimToken("idem-stale") == null` tras el
barrido.

## B — lineage por línea física acotado por `processExecutionId` (desambigua reprocesos)

**Hallazgo (validado, y corregido: es FE+BE, no solo FE):** el deep-link de línea física → lineage pasaba
`sourceFileHash + recordNumber` sin ejecución; y `AuditRecordEventRepository.timelineBySourceRow` filtraba solo por
`(sourceFileHash, recordNumber)` — **no** por ejecución (aunque `AuditRecordEvent.processExecutionId` existe). Con
reprocesos (mismo archivo+fila en varias ejecuciones), el lineage mezclaba eventos de todas.

**Cambio (FE + BE):**
- **BE** `timelineBySourceRow(sourceFileHash, recordNumber, processExecutionId, limit)`: si `processExecutionId` no es
  null, añade `and processExecutionId = ?`; si es null, comportamiento previo (todos). `RecordLineageResource` acepta el
  query param `processExecutionId` y lo pasa.
- **FE**: `AuditApiService.recordLineage` acepta `processExecutionId`; `RecordLineageComponent` lo lee del query param
  (modo `sourceRow`) y lo envía; el deep-link de G-A (`mt101-fragment-lookup`) pasa `processExecutionId: m.processExecutionId`.

Así, desde una línea física con reprocesos, el clic "Lineage ↗" abre la traza **de esa ejecución concreta**.

## Pruebas (evidencia)

| Suite | Resultado | Qué prueba |
|---|---|---|
| `AsyncInboxClaimIT` | **11 / 0 / 0** | A: el `inbox_claim_token` se limpia al marcar `DEAD` |
| `RecordLineageBySourceRowExecutionIT` | **2 / 0 / 0** | B (E2E REST): sin `processExecutionId` → 2 reprocesos; con él → solo esa ejecución |
| Frontend `web` (vitest) | **520 / 0 (104 archivos)** | B: `recordLineage` acepta y envía `processExecutionId`; paridad i18n; deep-link |

## Descartado (política, no correctitud)

- **`resolveNormalPay` obligatorio por ambiente** y **"STATUS cubre misma ruta/set"**: son decisiones de política ya
  acotadas (G2 acotado es el scope correcto; la topología dominante resuelve en ejecución separada). No se reabren.
- **G-B (by-sheet-row Excel)** y **validación temprana de reader CSV sin `fields`**: follow-ups opcionales, no incluidos.
