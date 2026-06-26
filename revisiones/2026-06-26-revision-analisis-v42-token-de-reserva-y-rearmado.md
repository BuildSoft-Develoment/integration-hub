# Revisión del análisis v42 (app_htoh 41) — propiedad de la reserva + rearmado de INVALIDATED

Fecha: 2026-06-26
Alcance: doble check del v41 (reserva PREPARING_PLAN + modelo versionado). El análisis valida el cierre de la
concurrencia ordinaria y detecta tres puntos. Directiva: sin código fallback / sin caminos legacy; validar lo
implementado.

## Verdictos contra el código real

| Hallazgo | Verdicto contra el código | Acción |
|---|---|---|
| **P0: la reserva no tiene propietario/token.** Tras un takeover de reserva vencida, el maker original (aún vivo) podía escribir specs, concretar la solicitud o liberar la reserva del nuevo dueño, porque `preparePayIntents`/`requestPay`/`releasePayPlanReservation` solo validaban `pay_status='PREPARING_PLAN'`. | **REAL** (de gobernanza; la seguridad de "no doble envío" ya la daba el claim + doble validación de hash en approve). Confirmado: ninguna de esas operaciones validaba el dueño. | **CORREGIDO**: token de propiedad `reservation_id`. |
| **Re-solicitud tras INVALIDATED incompleta.** Un fragmento INVALIDATED no se rearmaba (el upsert lo excluía) → la re-solicitud llegaba a REQUESTED pero la aprobación no encontraba nada PREPARED. | **REAL pero acotado**: `invalidatePayRequest` (drift pre-claim) solo invalida el **run** (fragmentos siguen PREPARED → se rearman bien). Solo los fragmentos invalidados **durante el dispatch pre-envío** (materialize/Vault, spec manipulada, drift) quedaban atascados. Todos son pre-envío. | **CORREGIDO**: rearmado seguro. |
| **Falta test de concurrencia real** (A lento + B takeover + A intentando finalizar/liberar). | **GAP de cobertura REAL**. | **AÑADIDO**. |

## P0 — token de propiedad de la reserva (v42)

La reserva ahora genera un **`reservation_id` (UUID)** inmutable; **toda** escritura, compilación, promoción y
liberación lo exige además de `PREPARING_PLAN`:

```
reservePayForPlanPreparation(runId, reservationId, reservedBy, stale)
    -> PREPARING_PLAN + pay_plan_reservation_id = reservationId + pay_plan_reserved_by
    (un takeover de reserva vencida SOBRESCRIBE el token: el dueño anterior lo pierde)

preparePayIntents(runId, reservationId, ...)        WHERE EXISTS (run PREPARING_PLAN AND reservation_id = ?)
compileDraftPlanRevision(runId, ..., reservationId) verifica ownsReservation(...) o lanza
requestPay(...)                                     WHERE pay_status='PREPARING_PLAN' AND reservation_id = ?
releasePayPlanReservation(runId, reservationId)     WHERE pay_status='PREPARING_PLAN' AND reservation_id = ?
deleteDraftPlanRevision(runId, reservationId)       gated por ownsReservation(...)
```

Efecto: un maker que perdió la reserva (porque otro reclamó la suya vencida) **ya no puede ni escribir specs, ni
compilar/activar el plan, ni concretar la solicitud, ni liberar el trabajo del nuevo dueño**. Se restablece la
garantía de gobernanza: *el maker que concretó la solicitud = dueño exclusivo del conjunto exacto que el checker
aprueba*. Al concretar (`requestPay`) o liberar, el token se limpia (`reservation_id = null`).

## Hallazgo 2 — rearmado de fragmentos INVALIDATED pre-envío

Todos los fragmentos en estado INVALIDATED son **pre-envío** (nunca llamaron al banco):
`invalidatePayFragmentMaterializeFailure` ("materializacion falla ANTES del envio"), `...TamperedSpec` (no se
envía), `...OnPlanDrift` (no se envía). Por tanto, bajo la **reserva exclusiva** es seguro rearmarlos (recompilar
specs frescas). Se quitó `'INVALIDATED'` de la exclusión del `DO UPDATE` de `preparePayIntents` (que **solo** corre
bajo la reserva exclusiva). Se mantienen protegidos los estados activos/enviados:
`DISPATCHING/SENT/REJECTED/UNCERTAIN`. Así una re-solicitud rearma el fragmento invalidado por un fallo transitorio
(p.ej. Vault) y lo incluye en la nueva revisión, sin exigir un run correctivo nuevo.

## Cambios

- **Migración V63**: `mt101_rebuild_run.pay_plan_reservation_id`, `pay_plan_reserved_by`.
- **`Mt101RebuildRepository`**: `reservePayForPlanPreparation(+reservationId,+reservedBy)`;
  `preparePayIntents(+reservationId)` con `WHERE EXISTS reservation_id` y exclusión sin INVALIDATED;
  `compileDraftPlanRevision(+reservationId)` con `ownsReservation`; `requestPay`/`requestPayWithPlanSet(+reservationId)`
  con `reservation_id` en el WHERE y limpieza al concretar; `releasePayPlanReservation(+reservationId)`;
  `deleteDraftPlanRevision(+reservationId)` gated; helper `ownsReservation`.
- **`Mt101CorrectiveLifecycleService.requestCorrectivePay`**: genera `reservationId = UUID` y lo propaga a reserva,
  preparación, compilación, solicitud, liberación y limpieza.

## Pruebas (todas en verde)

- `Mt101CorrectiveLifecycleServiceTest` — **47** (+2):
  - `aStaleReservationTakeoverFullyDispossessesThePreviousMaker` (P0): A reserva (tokA) y escribe; su reserva vence;
    B la reclama (tokB); A **ya no** puede escribir specs, ni compilar el DRAFT (lanza), ni liberar; el run sigue
    reservado por B.
  - `reRequestRearmsPreSendInvalidatedFragmentsIntoTheNewRevision` (hallazgo 2): un fragmento INVALIDATED pre-envío
    se rearma a PREPARED en la re-solicitud; la nueva revisión ACTIVE cuenta ambos fragmentos.
  - Reforzados: `planPreparationReservationIsExclusiveAndReclaimsOnlyStaleReservations` (un dueño anterior NO
    libera; el token pasa al nuevo dueño en el takeover) y
    `preparePayIntentsWritesOnlyWhileTheRunIsExclusivelyReservedForPlanPreparation` (token ajeno = no-op).
- `Mt101PayFragmentReprocessTest` — **34** · `Mt101StatusTaskProviderTest` — **20**.
- Todos los tests Mt101 (unit): **280**, 0 fallos.
- Integración end-to-end con Flyway real (aplica hasta **V63**, `Successfully applied 63 migrations`):
  `BankProfileHomologationIT` + `Mt101OutboundEndToEndIT` = **3**, 0 fallos.

## Nota sobre el modelo estructural

El análisis propone, como máxima robustez, un *draft table* con `reservation_id` y promoción a `active_plan_revision`.
Eso ya existe desde v41 (`mt101_corrective_pay_plan` DRAFT/ACTIVE/SUPERSEDED + `active_plan_revision`); v42 le añade
la **propiedad por token** (`reservation_id` exigido en cada escritura/compilación/promoción/liberación), que era la
pieza que faltaba para cerrar el takeover. El dispatcher sigue leyendo solo la revisión ACTIVE.

## Conclusión

Cerrado el último P0 del análisis: la preparación del plan es **exclusiva y con propiedad por token**, de modo que
un takeover de una reserva vencida **desposee por completo** al maker anterior (no puede escribir, compilar,
concretar ni liberar). Además, un fragmento invalidado pre-envío se **rearma** limpiamente en la re-solicitud. "plan
aprobado = plan ejecutado" se sostiene incluso ante reservas vencidas y reintentos, sin código fallback.
