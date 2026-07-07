# PAY normal — bloque A: conflicto SENT↔REJECTED del lado STATUS (Modelo B)

**Fecha:** 2026-07-07
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Política elegida:** **Modelo B** (SENT y REJECTED son terminales contradictorios → conciliación manual).

## Hallazgo (validado contra código real)

`Mt101PayUncertainResolutionService` solo **seleccionaba** fragmentos en `UNRESOLVED = [UNCERTAIN, DISPATCHING]`
(`unresolvedPayStatusRecords`). Un fragmento que el worker dejó en `SENT` y que el banco **luego rechaza** vía
STATUS quedaba **fuera de alcance del resolver**: no se seleccionaba, no se transicionaba, no se marcaba conflicto.
`Mt101ReconciliationCloseService` tampoco lo capturaba (solo hace roll-up de terminales). Asimetría real respecto
al lado worker, que sí se protegió en el bloque B+C.

## Cambio (Modelo B)

Segunda pasada en `resolveUncertainNormalPay`: `reconcileSentAgainstStatus`.

1. Nuevo `Mt101FragmentRepository.unconflictedPayStatusRecords(set, ["SENT"], …)`: selecciona los fragmentos ya
   `SENT` que **aún no** están en conflicto (`coalesce(pay_conflict,false)=false` → idempotente).
2. Re-consulta STATUS cada uno (reusa `Mt101StatusQueryExecutor`, nunca reenvía — STATUS solo consulta).
3. Si el banco resuelve **REJECTED** sobre un `SENT` → contradicción terminal: `markPayConflict` (no sobrescribe el
   `SENT` real) + confirmación append-only en `mt101_confirmation` (evidencia conciliable). **No se auto-resuelve**
   (Modelo B). Si el banco confirma `SENT`/`ACCEPTED` o la consulta es pendiente/no concluyente, el fragmento no se
   toca.
4. `NormalPayResolution` gana el campo `conflicts` (expuesto tal cual por el endpoint
   `POST /rebuild-runs/resolve-uncertain-normal-pay`).

Sin migración (reusa `pay_conflict`/`pay_conflict_reason` de V89). Sin fallback: nunca reenvía, nunca sobrescribe
un terminal; un rechazo tardío del banco queda visible y conciliable, no silencioso.

## Pruebas (`Mt101PayUncertainResolutionServiceTest`, Testcontainers + WireMock)

- **`sentFragmentRejectedByBankIsFlaggedAsConflictNotOverwritten`**: K1 `SENT` + banco `REJECTED` → `conflicts=1`,
  K1 sigue `SENT`, `pay_conflict=true`, confirmación append-only persistida; K2 `SENT` + banco `ACCEPTED` → sin
  conflicto.
- **`reconcilingSentIsIdempotentAndDoesNotReflagAnExistingConflict`**: una segunda pasada no re-marca ni duplica la
  confirmación (filtro `pay_conflict=false`).

Money-path completo sin regresión: **160 tests** (PAY + correctivo + STATUS + cuarentena) verdes.

## Estado del bloque P0-1 (A+B+C)

- **A** (este cambio), **B**, **C** → **cerrados**. La resolución terminal del PAY normal es ahora simétrica en
  ambas direcciones (worker↔STATUS), sin falsos positivos y con evidencia append-only del conflicto.
- Pendiente (async): **E** (claim slice/page) y **F** (fencing inbox).
