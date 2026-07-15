# Evidencia tanda-6 — #9, #8, D2-R2 y maker-checker opt-in — 2026-07-15

Autorizado tras el análisis v68 + el análisis D2-R2/maker-checker. Cuatro entregables.

## #9 — auditar la reversión DISPATCHING→ARCHIVED omitida (hardening, PAY normal)

La reversión de un `transportFailure` (nada salió al banco) ignoraba el `Set` de refs revertidos. Ahora captura
el retorno y, para los refs que **no** se revirtieron (ya no estaban DISPATCHING: otro flujo los movió a un
terminal), reusa el mecanismo de `pay_conflict` existente: marca el fragmento + emite la trama append-only
`PAY_CONFLICT` para conciliar. NO se re-paga a ciegas (no vuelve a ARCHIVED). Cero anomalías silenciosas.

- Archivo: `Mt101PayTaskProvider.finalizeNormalGuarded`.
- Test: `Mt101PayNormalDurableTest.transportFailureRevertSkippedWhenFragmentRacedToTerminalFlagsPayConflict`
  (STATUS concurrente mueve el fragmento a SENT → reversión omitida → SENT conservado + pay_conflict + trama).

## #8 — UI: label de ARCHIVED por fallo técnico

El `mt101-fragment-lookup` ya mostraba `status` + `errorMessage`. Se añade un chip explícito **"Re-pagable por
fallo técnico pre-despacho"** cuando `status==ARCHIVED && errorMessage`, para distinguirlo de un ARCHIVED recién
archivado nunca intentado. i18n (es/en) + CSS del componente.

## D2-R2 (Opción A) — run mixto sent=0, rejected>0, invalidated>0

Antes caía en el `else → FAILED` (dead-end: request-child exige PARTIALLY_SENT). Ahora una rama nueva
`invalidated>0 → pay_status=PARTIALLY_SENT` habilita AMBAS recuperaciones: request-child (RECHAZADOS) y
re-request (INVALIDADOS). Validaciones clave del diseño:

- **No se lanza excepción** en esta rama: el `catch` re-marcaría FAILED (hasDispatchedPayFragments=false),
  deshaciendo el PARTIALLY_SENT. Se mima la rama `sent>0` (marca + sync, sin throw).
- **Cuarentena coherente:** el sync se ramifica por `deriveLifecycleStatus` (que da PARTIALLY_FAILED para
  REJECTED+ARCHIVED), NO por `pay_status`. Usa `markPartialSelections` **por-fragmento** (REJECTED→REBUILD_REJECTED),
  no el bulk `REBUILD_SENT`. El `pay_status=PARTIALLY_SENT` gobierna la recuperación; el `status` lifecycle
  (PARTIALLY_FAILED) refleja la realidad de los fragmentos. Divergencia intencional y correcta.

- Archivo: `Mt101CorrectiveLifecycleService.approveAndPayCorrective`.
- Test: `Mt101CorrectiveLifecycleServiceTest.mixedRejectedAndInvalidatedNoSentIsPartiallySentNotFailed`
  (pay_status PARTIALLY_SENT, status PARTIALLY_FAILED, request-child selecciona solo el REJECTED).

## Maker-checker OPT-IN para PAY_CONFLICT_RESOLVED

Config-gated (`mt101.pay.conflict.acknowledge.maker-checker.enabled`, default **false**). NO es fallback: es el
modo por ambiente (off dev/UAT, on prod bancaria).

- **false:** acknowledge single-actor (V98) intacto.
- **true:** dos pasos con actores DISTINTOS:
  - `request-acknowledge` (maker): registra la intención PENDING (reason+ticket) SIN apagar el flag. Fail-loud si
    no hay conflicto abierto.
  - `approve-acknowledge` (checker ≠ maker): en una TX limpia el flag + marca APPROVED + emite
    `PAY_CONFLICT_RESOLVED` con ambos actores. Fail-loud sin PENDING o si checker==maker (segregación).
- Con maker-checker ON, el acknowledge single-actor se **rechaza** (fuerza el flujo).

Archivos: `V99__mt101_pay_conflict_ack_maker_checker.sql` (tabla `mt101_pay_conflict_ack_request` + índice único
parcial PENDING), `Mt101FragmentRepository` (hasOpenPayConflict, upsertPendingAckRequest, findPendingAckRequest,
markAckRequestApproved), `Mt101PayConflictAcknowledgeService` (config + requestAcknowledge + approveAcknowledge +
guard), `Mt101FragmentLookupResource` (2 endpoints), `application.properties`.

## Validación (todo verde)

| Clase | Resultado | Cubre |
|---|---|---|
| `Mt101PayNormalDurableTest` | **8/8** (+1) | #9 revert-skipped → pay_conflict |
| `Mt101CorrectiveLifecycleServiceTest` | **63/63** (+1) | D2-R2 mixto → PARTIALLY_SENT + request-child |
| `Mt101PayConflictMakerCheckerIT` | **5/5** (nuevo) | maker-checker: enabled, rechazo single-actor, request+segregación+approve, fail-loud |
| `Mt101PayConflictAcknowledgeAtomicityIT` | **4/4** | Regresión: single-actor intacto (default off) |

Sin regresión. #8 es frontend (chip + i18n + CSS), se valida visualmente en la app.
