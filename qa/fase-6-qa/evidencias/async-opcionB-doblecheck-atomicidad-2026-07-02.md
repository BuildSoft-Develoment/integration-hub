# Doble check Opción B (B1–B3): atomicidad del scatter-gather — 2026-07-02

Revisión de correctitud del scatter-gather. Dos defectos reales de atomicidad, corregidos y probados,
más una limitación documentada.

## F-B1 (severo, corregido) — dispatch no atómico

`AsyncSliceDispatchService.dispatchSlices` hacía `tracker.open(N)` y los N `enqueue` cada uno en su
propia transacción. Un crash a mitad dejaría el tracker con `total=N` pero **menos de N work-items** →
el scatter **nunca podría cerrar** (colgado para siempre).

**Fix**: `dispatchSlices` es ahora `@Transactional` → `open(N)` + los N `enqueue` commitean **juntos o
nada**. El caller (motor, B2b) lo invoca dentro de la tx de la suspensión, así el tracker+work-items
quedan atómicos también con la suspensión (mismo transactional-outbox que el per-task).

## F-B2 (severo, corregido) — dedup-sin-contar si el tracker aún no existe

`SliceGatherService.commitCompletedSlice` insertaba el dedup del inbox y luego incrementaba el tracker
en la misma tx. Pero si el tracker **aún no existía** (carrera: slice visible antes que el `open`),
`recordSliceCompleted` afectaba 0 filas y devolvía vacío mientras el `insertIfAbsent` **ya había
commiteado** → la slice quedaba **dedupada pero no contada** → una reentrega la salta → el scatter
**nunca llega a `total`** (colgado).

**Fix**: si el incremento no ocurre, se distingue el caso:
- tracker **existe** pero ya cerró (COMPLETED/FAILED) → skip legítimo (vacío);
- tracker **ausente** → se **lanza** `IllegalStateException` → rollback (deshace el dedup del inbox) →
  nack → reintenta. Convierte una pérdida silenciosa de conteo en un reintento seguro (fail-safe).

Con F-B1 + la atomicidad de B2b el tracker siempre existe antes de que una slice sea visible, así que
el throw es una red que en la práctica no dispara; pero elimina la ventana de corrupción.

## F-B3 (limitación documentada) — `sourcePayload` no disponible por-slice

`consumeSlice` llama `executeRecords(context, config, records, null)`: la info del archivo/stream
(`SourcePayload`) no viaja por-slice. Los `BatchTaskProvider` que dependan de `sourcePayload` (más allá
de los records) no son offloadables por-slice tal cual. Igual que el límite de contexto del per-task;
se documenta. (DB_WRITE/REST típicos trabajan sobre los records, no sobre el payload de origen.)

## Pruebas

- **`SliceGatherServiceTest`** (nuevo) **4/4**: cuenta con tracker activo; duplicado no incrementa;
  **tracker ausente lanza** (reintento); scatter ya cerrado es skip legítimo (no lanza).
- **`AsyncSliceDispatchServiceTest`** 3/3 y **`AsyncTaskConsumerTest`** 11/11 sin regresión tras los
  fixes.

## Estado

Atomicidad del scatter-gather endurecida (dispatch all-or-nothing + gather sin ventana de pérdida de
conteo). La lógica B1–B3 queda correcta bajo concurrencia y fallos; sigue pendiente el cableado al
motor (B2b), la política de requeue por-slice (B4) y el front (B5).
