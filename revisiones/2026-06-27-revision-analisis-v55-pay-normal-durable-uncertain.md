# Revisión del análisis app_htoh(55) → v51-fix — PAY normal con estado durable UNCERTAIN + claim atómico

Fecha: 2026-06-27
Alcance: revalidación integral de la plataforma. El análisis plantea 8 "P0" de gran alcance; se validaron contra el
código real y se implementó, bajo autorización explícita, el único gap money-path **vigente hoy**: el PAY normal
(no correctivo) sin estado durable ante I/O ambiguo. Directiva: sin código fallback.

## Corrección del análisis contra el código real

El análisis se escribió sin poder ejecutar el código (Java 21 vs 25, sin Maven) y de un paquete posiblemente
desactualizado. Verdictos código-real:

| "P0" del análisis | Verdicto código-real | Acción |
|---|---|---|
| **#7 PAY normal sin durable UNCERTAIN/claim** → doble envío ante resultado ambiguo | **REAL y vigente**: `claimDispatch` devolvía `true` sin claim en el flujo normal (`correctivePayRunId == null`) y un uncertain dejaba el fragmento sin marca terminal → seguía `ARCHIVED` → re-seleccionable. | **IMPLEMENTADO** (este cambio) |
| #8 claim distribuido de `process_execution` | **REAL pero solo clúster**: `markProcessRunningIfPending` hace read-then-write, no `UPDATE...WHERE status='PENDING'`; en single-node lo protege `synchronized(dispatchMonitor)`. No es bug del despliegue actual. | Fuera de alcance de este turno (cluster-readiness) |
| #9 claim async antes de ejecutar para PAY | **SOBREVALORADO / ya mitigado**: `TaskProvider.asyncOffloadSupport()` es `UNSUPPORTED` por defecto y `Mt101PayTaskProvider` no lo sobrescribe → `guardAsyncOffloadable` impide offloadar PAY. El dedup at-least-once solo aplica a providers idempotentes que opt-in. | Sin acción (ya implementado) |
| PAY correctivo maker-checker | **Muy fuerte** (v41–v50): intacto. | Sin cambios |
| Fronteras Nx, streaming de plugins remotos, estado de disponibilidad async en UI | Reales pero madurez de plataforma, no money-path. | Fuera de alcance |

## Corrección implementada (#7, sin rutas legacy)

El PAY normal usa `mt101_build_fragment.status` como estado durable; PAY solo lee `ARCHIVED`
(`FRAGMENT_READ_STATUSES`). Se cierran las dos ventanas de reenvío:

### 1. Claim ATÓMICO pre-envío `(estados legibles) → DISPATCHING`
`Mt101FragmentRepository.claimForDispatch` reclama la página en un solo `UPDATE ... WHERE status IN (fromStatuses)
AND senders_reference IN (...) RETURNING senders_reference` (una vuelta a BD, preserva el rendimiento del flujo de 1M).
`fromStatuses` son EXACTAMENTE los estados que PAY tiene permitido leer (por defecto `ARCHIVED`; o el override
`fragmentSource.statuses`, p.ej. `REJECTED` en un reproceso explícito) — el mismo filtro que la lectura.
El provider (flujo normal) solo despacha las referencias efectivamente reclamadas. Un fragmento que otro worker ya
reclamó, o que ya es terminal, **no se reclama** → no se reenvía. Si el worker cae tras enviar y antes de marcar
terminal, el fragmento queda `DISPATCHING`, **excluido** de una nueva selección de PAY (que solo lee `ARCHIVED`):
exige conciliación, nunca reenvío automático.

### 2. Estado durable `UNCERTAIN` ante I/O ambiguo
Antes, un resultado uncertain (timeout, reset, respuesta perdida, 5xx post-aceptación) dejaba el fragmento sin marca
terminal → seguía `ARCHIVED` → una nueva ejecución lo re-seleccionaba y podía reenviarlo. Ahora, en el flujo normal,
esos fragmentos se marcan `UNCERTAIN` de forma durable → **excluidos** de una nueva selección de PAY. La resolución es
por STATUS/RECONCILE (flujo explícito), nunca reenvío automático.

El flujo **correctivo** no se toca: su claim por-fragmento contra la revisión ACTIVE inmutable y su ledger
(`mt101_corrective_pay_fragment` con `pay_status`) ya gobiernan el uncertain de forma durable. Se eliminó el método
muerto `claimDispatch` (ya no tenía llamadores tras el refactor).

## Pruebas (evidenciadas)

- `Mt101PayNormalDurableTest` (NUEVO, Testcontainers Postgres):
  - `ambiguousResultMarksFragmentUncertainAndASecondPayDoesNotResend`: A2 devuelve INCIERTO → queda `UNCERTAIN`
    (no `ARCHIVED`); A1/A3 `SENT`. Un **segundo PAY** no llama al transporte (0 envíos) porque nada está `ARCHIVED`
    → **no hay reenvío automático**.
  - `claimArchivedForDispatchIsAtomicAndClaimsEachFragmentOnlyOnce`: el claim reclama solo los `ARCHIVED` y un segundo
    claim (otro worker) devuelve vacío → sin doble envío concurrente.
- **Suite Mt101 completa: 289 tests, 0 fallos** (BUILD SUCCESS), incluyendo los E2E con Flyway real
  (`Mt101AllTasksProcessE2EIT` 2, `Mt101MillionFileProcessE2EIT` 3, `Mt101OutboundEndToEndIT` 2): el flujo normal
  despacha `ARCHIVED → DISPATCHING → SENT`, estado final `SENT` intacto y sin regresión de rendimiento en 1M.
- **Regresión detectada y corregida en el doble-check**: el claim inicial fijaba `WHERE status='ARCHIVED'`, lo que
  rompía el reproceso explícito de `REJECTED` (`fragmentSource.statuses` override). Se generalizó a
  `claimForDispatch(fromStatuses)`, que aplica el MISMO override que la lectura de PAY; el test
  `explicitRejectedStatusReprocessesOnlyFailedFragments` volvió a verde. Así el claim transiciona desde exactamente
  los estados que PAY tiene permitido leer, nunca desde otros.

## Pendientes documentados (no money-path vigente)

- #8 claim distribuido de `process_execution` (cluster-readiness): requiere `execution_owner/token/lease/heartbeat` +
  claim SQL atómico, con recuperación que NO reanude un proceso que ya inició PAY (queda `NEEDS_RECONCILIATION`).
- Flujo de **resolución** de un `UNCERTAIN` normal por STATUS/RECONCILE (hoy el operador lo resuelve explícitamente; el
  cambio garantiza que jamás se reenvía solo).
- Streaming real de readers/sources remotos; fronteras Nx; estado de disponibilidad async en UI.

## Conclusión

Cerrado el único gap money-path vigente del PAY normal: ante un resultado ambiguo o una caída post-envío, el fragmento
queda en un estado durable (`UNCERTAIN`/`DISPATCHING`) **excluido** de una nueva selección de PAY, y el despacho reclama
atómicamente antes de enviar. "Plan aprobado = plan ejecutado" se extiende del PAY correctivo al PAY inicial: **nunca
reenvío automático ante incertidumbre**. Los demás puntos del análisis quedan validados y priorizados como
cluster-readiness / madurez de plataforma.
