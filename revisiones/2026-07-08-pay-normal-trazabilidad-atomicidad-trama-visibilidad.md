# PAY normal — bloque de trazabilidad money-path (atomicidad + trama STATUS + visibilidad)

**Fecha:** 2026-07-08
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Alcance:** items 1+2+3 del análisis app_htoh(59), validados contra código real.

## Item 1 — Atomicidad: transición del fragmento + confirmación en UNA transacción

**Hallazgo:** en `Mt101PayUncertainResolutionService`, `resolvePayStatus`/`markPayConflict` y `persistConfirmations`
commiteaban por separado (el servicio/resource no son `@Transactional`, autocommit por conexión). Si la confirmación
fallaba tras el update → fragmento resuelto **sin evidencia** y ya no seleccionable (no vuelve a `UNRESOLVED`).

**Cambio:** variantes por `Connection` de `resolvePayStatus`/`markPayConflict` (las de `DataSource` delegan) +
helper `inTransaction` en el resolver que envuelve, por página, **update-fragmento + insert-confirmación en una sola
conexión** (`autoCommit=false`, commit/rollback). Un fallo de la confirmación **revierte** el cambio de estado. Se
eliminó el `persistConfirmations` autocommit (sin camino legacy). Sirve para el datasource por defecto y para el de
un `connectionRef` (tx a nivel conexión, no JTA).

**Prueba:** `fragmentTransitionAndConfirmationAreAtomic` — con `mt101_confirmation` dropeada, la resolución falla y el
fragmento **conserva** `UNCERTAIN` (rollback, evidencia consistente).

## Item 2 — Trama append-only `PAY_CONFLICT` también desde STATUS/RECONCILE

**Hallazgo:** `reconcileSentAgainstStatus` (SENT→banco-REJECTED) solo marcaba `pay_conflict` + confirmación, **sin**
la trama de auditoría que el lado worker sí emite.

**Cambio:** factory ÚNICA `Mt101PayConflictAudit.envelope(...)` (DRY, SRP) usada por AMBOS lados, con
`source ∈ {WORKER, STATUS}`, `previousStatus`, `incomingTerminal`, `gatewayReference`, `actor`. El worker
(`Mt101PayTaskProvider`) ahora delega en el factory; el resolver inyecta `RecordAuditEmitter` y emite la trama
`PAY_CONFLICT` (source=STATUS, actor=executedBy) tras confirmar el estado.

**Prueba:** el test de conflicto del resolver captura el emisor y verifica la trama `PAY_CONFLICT` con
`source=STATUS`, `previousStatus=SENT`, `incomingTerminal=REJECTED`, `actor`.

## Item 3 — Visibilidad: conflictos en API + UI

**Hallazgo:** ni API ni frontend exponían `pay_conflict`/`PAY_CONFLICT`; solo columna interna.

**Cambio (full-stack):**
- **Backend**: `Mt101FragmentRepository.conflictedFragments`/`payConflictCount`; el resumen
  `GET /api/query/mt101-fragments/summary` gana `conflicts`; nuevo `GET /api/query/mt101-fragments/pay-conflicts`
  (lista con `sendersReference`, `status`, `reason`, `updatedAt`).
- **Frontend**: `Mt101FragmentSetSummary.conflicts` + `Mt101PayConflict`; el componente `mt101-quarantine` muestra
  una **card + alerta** cuando hay conflictos (i18n en/es), color de error.

**Prueba:** `conflictedFragmentsAndCountAreExposedForVisibility` (repo); suite frontend **511 tests** verdes
(paridad i18n + componente quarantine).

## Evidencia global

- Money-path backend: **169 tests** verdes (incluye el nuevo de atomicidad y visibilidad; correctivo 62, reprocess
  35, resolver 7, STATUS 20, etc.), sin regresión.
- Frontend: **511 tests** (103 archivos) verdes; lint `core-i18n` + `feature-audit` OK.
- Sin migración (reusa V89 + spool de auditoría). Sin fallback silencioso: atomicidad elimina el estado
  inconsistente; la trama hace el conflicto conciliable; la UI lo hace visible.
