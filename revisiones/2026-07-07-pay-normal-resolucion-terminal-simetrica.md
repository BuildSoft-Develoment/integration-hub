# PAY normal: resolución terminal simétrica (SAME_TERMINAL/CONFLICT) + trama append-only

**Fecha:** 2026-07-07
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Alcance:** bloque **B + C** del análisis app_htoh(58) (validado contra código real).

## Contexto (hallazgos validados)

- **B** — `finalizeNormalGuarded` marcaba `pay_conflict` para **cualquier** ref que no transicionara desde
  `DISPATCHING/UNCERTAIN`, **sin distinguir** si el estado actual ya era el **mismo** terminal (idempotente,
  benigno) o uno **distinto** (contradicción real). Bajo concurrencia (STATUS resolviendo un `DISPATCHING` al
  mismo terminal que el worker va a escribir) esto produce un **falso positivo** de conflicto.
- **C** — el conflicto normal solo dejaba el **booleano** `pay_conflict`; faltaba una **trama append-only
  `PAY_CONFLICT`** (con estado previo / terminal entrante / referencia) para monitoreo bancario, a diferencia del
  correctivo que sí la emite (`recordPayAction(..., "PAY_CONFLICT", ...)`).

## Cambio

Clasificación **simétrica** en `finalizeNormalGuarded`:

1. `resolvePayStatusReturning` transiciona los refs realmente en `DISPATCHING/UNCERTAIN` (APPLIED).
2. Para los **no** transicionados, se lee el estado real con el nuevo `Mt101FragmentRepository.payStatusesFor` y
   se clasifica:
   - `estado actual == terminal entrante` → **SAME_TERMINAL**: idempotente, **no** marca conflicto (arregla B).
   - `estado actual == OTRO terminal` → **CONFLICT**: `markPayConflict` (no sobrescribe) **y** emite la trama
     append-only `PAY_CONFLICT` (`stage=PAY_CONFLICT`, con `previousStatus`/`incomingTerminal`) vía
     `RecordAuditEmitter` — espejo del correctivo (cierra C).
3. Los conflictivos **no** se propagan a `mt101_archive` (coherencia con el `pay_status` real).

Sin migración: reusa `pay_conflict`/`pay_conflict_reason` (V89). Sin fallback: un conflicto real nunca se
silencia; un terminal idéntico nunca se marca en falso.

## Pruebas (`Mt101PayNormalDurableTest`, Testcontainers)

Un transporte `StatusRacingTransport` fija el fragmento a un terminal **durante** el `send` (simula STATUS
concurrente) y luego devuelve `ACCEPTED`, ejercitando el `finalizeNormalGuarded` real vía `provider.execute`:

- **`concurrentStatusResolvingToSameTerminalIsIdempotentNotConflict`** (B): STATUS→SENT, worker→SENT ⇒
  `pay_conflict = false` y **sin** trama `PAY_CONFLICT`.
- **`concurrentStatusResolvingToDifferentTerminalIsFlaggedAndEmitsPayConflictAudit`** (A/C): STATUS→REJECTED,
  worker ACCEPTED tardío ⇒ estado se conserva `REJECTED`, `pay_conflict = true` y **se emite** la trama
  `PAY_CONFLICT`.

Money-path completo sin regresión: **132 tests** PAY + correctivo verdes (correctivo 62/62, reprocess 35/35).

## Pendiente del bloque (fuera de este cambio)

- **A (dirección STATUS-side)**: que el resolver detecte un `SENT` que el banco luego rechaza requiere **decisión
  de política** (Modelo A: coexisten con estado final REJECTED; Modelo B: contradicción → conciliación manual) y
  extender la **selección** del resolver a terminales. Pendiente de definición.
- **E** (claim por slice/page) y **F** (fencing inbox) — siguientes ítems.
