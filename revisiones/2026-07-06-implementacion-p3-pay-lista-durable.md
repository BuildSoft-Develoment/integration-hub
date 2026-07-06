# Implementación — P3: PAY por lista en memoria con durabilidad (re-request-safety)

Fecha: 2026-07-06
Alcance: cierra el gap del [análisis P3](2026-07-06-analisis-p3-pay-lista-no-persistida.md) (confirmado real en su
doble-check). **Opción (C)**: claim de intención por-mensaje, sin cambiar la topología. Autorizado por el usuario. Sin
fallback.

## Problema

`MT101_PAY` tiene dos ramas: la **persistida** (`fragmentSetId` de `BUILD_FROM_TABLE`) reclama `ARCHIVED→DISPATCHING`
antes de enviar (durable, re-request-safe); la de **lista en memoria** (`MT101_BUILD`/`SPLIT` → PAY) hacía
`transport.send()` **sin claim** → un re-request del mismo pago **re-despachaba** (doble envío), porque no había fila
persistida que quedara `UNCERTAIN`. Solo dependía de que el banco honrara el idempotency key (contractual, P11).

## Solución (opción C, sin fallback)

Un **ledger de intención de dispatch** (`mt101_pay_dispatch_intent`) que le da al camino de lista la misma
re-request-safety que el persistido, **sin cambiar la topología** (no obliga a migrar `BUILD → PAY` a `BUILD_FROM_TABLE`):

- **Migración V87**: tabla `mt101_pay_dispatch_intent` con `unique(dispatch_key)` (hace el claim atómico via
  `INSERT ... ON CONFLICT`). Vive en la DB de la plataforma (dedup platform-side, no dato de banco).
- **`Mt101PayDispatchIntentStore`** (NUEVO): `claimForDispatch(dispatchKey, peId, ref)` → `ClaimResult`
  (`CLAIMED`/`ALREADY_SENT`/`ALREADY_UNCERTAIN`/`IN_FLIGHT`) + `recordResult(...)`. El `DISPATCHING` se **commitea antes**
  del `send()` (durable): un crash entre claim y resultado deja la intención en `DISPATCHING` → un re-request no reenvía.
  Semántica: `SENT`/`UNCERTAIN`/`DISPATCHING` bloquean; `REJECTED` (rechazo pre-dispatch, probado sin llegar al banco) se
  re-reclama (permite reintento) — simétrico con la clasificación segura v26/v27.
- **`dispatch_key` = `transport | connectionRef | correlationKey`**: el destino real + la **idempotency key del banco**
  (`Mt101PaymentCorrelation.correlationKey`, determinista por-pago y estable entre re-requests). Dedup platform-side =
  dedup del banco.
- **Wiring en `Mt101PayTaskProvider`**: la rama de lista llama `dispatch(..., context, durableIntent=true)` →
  `dispatchWithDurableIntent` reclama antes de enviar y registra el resultado; el camino **persistido** pasa
  `durableIntent=false` (ya tiene su claim de fragmento — sin doble-claim). Un claim bloqueado NO reenvía y se reporta como
  aceptado (ya enviado) o incierto (conciliar).

## Pruebas (evidenciadas, contra Postgres real)

- **`Mt101PayDispatchIntentStoreIT` (NUEVO, 5)**: contra el `ON CONFLICT` real — primer claim `CLAIMED` + `DISPATCHING`
  durable; **re-request de un SENT → `ALREADY_SENT`** (no reenvía); **re-request de un UNCERTAIN → `ALREADY_UNCERTAIN`**
  (el corazón del gap: nunca reenvío ciego); en-vuelo `DISPATCHING → IN_FLIGHT`; **REJECTED seguro → re-claim `CLAIMED`**
  (reintento permitido).
- **Regresión (sin romper nada)**: `Mt101AllTasksProcessE2EIT` (2) y `Mt101OutboundEndToEndIT` (2) — la rama directa con
  el intent-claim completa un envío normal (CLAIMED → send → SENT); `Mt101PayFragmentReprocessTest` (35) — el path
  persistido (`durableIntent=false`) intacto, sin doble-claim.

## Alcance / honestidad

- Cubre `BUILD → PAY` **y** `SPLIT → PAY` (ambos usan la misma rama de lista → `durableIntent=true`).
- **Sin fallback**: todo envío por la rama de lista pasa por el claim; no hay camino sin durabilidad ni escape hatch.
- No cambia la topología (no obliga `BUILD_FROM_TABLE`); el money-path masivo/correctivo (rama persistida) no se toca.
- Complementa P11 (idempotency contractual por banco): ahora hay dedup **platform-side** además del del banco.

## Estado

**P3 cerrado.** Pendiente abierto del análisis (no autorizado): **P9** (backend fail-closed si async no READY). P5/P6
quedó como guardrail (degradado en su doble-check).
