# Revisión del análisis v40 (re-envío / doble check) — reserva exclusiva del plan

Fecha: 2026-06-25
Alcance: doble check del v40 ya implementado (`cdae44a8`) y cierre de su recomendación de fondo: el v40 detectó
que el plan podía cambiar tras la aprobación y propuso, como **solución correcta**, **reservar el run bajo lock
antes de preparar** (su "paso 1") para que la preparación del plan sea **exclusiva**. Directiva: sin código
fallback / sin caminos legacy.

## Veredicto del doble check sobre el v40 ya implementado (`cdae44a8`)

| Hallazgo v40 | Estado validado |
|---|---|
| Dispatcher ejecuta la spec persistida (no recalcula ruta/transporte/destino) | **Cerrado** (confirmado) |
| Transporte desde el plan, no config viva | **Cerrado** |
| JSON/hash exactos en el claim | **Cerrado** |
| Secretos re-resueltos DESPUÉS del claim, nunca persistidos | **Cerrado** |
| Rutas/destino dinámicos por secret/env/config | **Restringido** (solo credenciales; referencia COMPLETA) |
| P0: el plan puede cambiar tras la aprobación (2ª solicitud reescribe specs con run EXECUTING) | **Cerrado** en `cdae44a8` (chequeo temprano + guarda del upsert) |

El **parche inmediato** del v40 (`cdae44a8`) ya cerraba la SEGURIDAD: la carrera "C reescribe mientras B
EXECUTING" estaba bloqueada (chequeo temprano de `pay_status` + guarda `WHERE EXISTS run elegible` en el upsert),
y cualquier drift posterior lo atrapa el claim (spec_hash + spec_json exacto) y la aprobación (pay_plan_set_hash).
Quedaba el residuo que el propio v40 marcaba como "la solución correcta": **dos makers concurrentes** (ambos en
`NOT_REQUESTED`) podían **mezclar specs** en el ledger compartido — sin pago erróneo (la aprobación invalida ante
drift), pero con posibles invalidaciones espurias. Esta v40-bis lo cierra de raíz.

## v40-bis — RESERVA EXCLUSIVA de la preparación del plan (sin fallback)

`requestCorrectivePay` ahora **reserva el run de forma atómica y exclusiva ANTES de tocar el ledger**:

```
reservePayForPlanPreparation()   NOT_REQUESTED/FAILED/INVALIDATED -> PREPARING_PLAN   (UPDATE atómico, advisory lock)
  └─ si devuelve 0 (run REQUESTED/EXECUTING o YA hay otro maker preparando) -> se rechaza, no se toca el ledger
prepare + refresh + preparePayIntents   (compila/persiste specs EN EXCLUSIVA, bajo la reserva)
computePayPlanSet
requestPayWithPlanSet            PREPARING_PLAN -> REQUESTED + pay_plan_set_hash + PAY_REQUESTED + PAY_PLAN_PREPARED (atómico)
finally (si no concretó):  releasePayPlanReservation (PREPARING_PLAN -> NOT_REQUESTED) + deleteOrphanPreparedIntents
```

Propiedades (todas verificadas por pruebas):

1. **Exclusión mutua de la preparación.** La reserva es un único `UPDATE ... WHERE pay_status in
   (elegibles) OR (pay_status='PREPARING_PLAN' AND reserved_at < now - ventana)`. Dos makers concurrentes: solo
   uno gana el UPDATE; el otro recibe 0 y se rechaza. **Imposible mezclar specs** de dos makers.
2. **El upsert de specs SOLO escribe bajo la reserva.** `preparePayIntents` cambió su guarda a
   `WHERE EXISTS (run.pay_status = 'PREPARING_PLAN')`. Un `preparePayIntents` sobre un run NOT_REQUESTED (sin
   reserva) o EXECUTING (despacho en curso) es **no-op**. Los specs se compilan únicamente mientras el run está
   reservado por ese maker.
3. **La solicitud concreta SOLO desde la reserva.** `requestPay` cambió su `WHERE` a `pay_status='PREPARING_PLAN'`
   (y limpia `pay_plan_reserved_at`). Nadie pudo escribir specs en el intervalo reserva→request.
4. **Atomicidad de la preparación / sin runs atascados.** Todo el bloque preparar+solicitar está en un
   `try/finally`: si la compilación falla a mitad (o cualquier paso), el `finally` **libera la reserva**
   (PREPARING_PLAN → NOT_REQUESTED, re-solicitable) y **elimina los specs PREPARED parciales** (race-safe). El run
   nunca queda atascado en un estado intermedio ni con planes parciales aprobables.
5. **Reserva caída reclamable.** `pay_plan_reserved_at` (V61) permite que, si un maker reserva y muere, otro
   reclame la reserva pasada la ventana de obsolescencia (`PLAN_RESERVATION_STALE_SECONDS = 120s`). Sin esto, un
   proceso caído dejaría el run bloqueado para siempre.

Con esto, "plan aprobado = plan ejecutado" se sostiene de extremo a extremo **incluso frente a makers
concurrentes**: la preparación del plan es exclusiva, la solicitud concreta sobre lo que el mismo maker preparó,
la aprobación valida el conjunto exacto (pay_plan_set_hash) y el claim enlaza payload/routed_as/plan_hash/
spec_hash/spec_json exacto.

## Cambios

- **Migración V61** `mt101_rebuild_run.pay_plan_reserved_at timestamp` (marca de la reserva, para reclamar caídas).
- **`Mt101RebuildRepository`**:
  - `reservePayForPlanPreparation(ds, runId, staleSeconds)` — reserva atómica bajo advisory lock; reclama caídas.
  - `releasePayPlanReservation(ds, runId)` — libera PREPARING_PLAN → NOT_REQUESTED (idempotente, race-safe).
  - `requestPay` — `WHERE pay_status='PREPARING_PLAN'` + limpia `pay_plan_reserved_at`.
  - `preparePayIntents` — guarda del upsert `WHERE EXISTS (run.pay_status='PREPARING_PLAN')`.
- **`Mt101CorrectiveLifecycleService.requestCorrectivePay`** — reserva exclusiva al inicio; `try/finally` que
  abarca toda la preparación con release + limpieza de huérfanos si no concreta. Constante
  `PLAN_RESERVATION_STALE_SECONDS = 120`.

## Pruebas (todas en verde)

- `Mt101CorrectiveLifecycleServiceTest` — **43** (+1):
  - `planPreparationReservationIsExclusiveAndReclaimsOnlyStaleReservations` (NUEVO): la reserva es exclusiva (2º
    maker recibe 0 con reserva vigente); una reserva caída (back-date > ventana) se reclama; el release vuelve a
    NOT_REQUESTED.
  - `preparePayIntentsWritesOnlyWhileTheRunIsExclusivelyReservedForPlanPreparation` (REESCRITO): el upsert es
    no-op con run EXECUTING y con run NOT_REQUESTED (sin reserva); escribe solo bajo PREPARING_PLAN.
  - `secondRequestWhilePlanExecutingIsRejectedAndDoesNotOverwriteApprovedPlan`: la 2ª solicitud con run EXECUTING
    no reserva → rechazada; el plan aprobado no se reescribe.
- `Mt101PayFragmentReprocessTest` — **33** (dispatcher correctivo real; intacto).
- `Mt101StatusTaskProviderTest` — **20**.
- Todos los tests Mt101 (unit): **275**, 0 fallos.
- Integración end-to-end con Flyway real (aplica hasta **V61**): `BankProfileHomologationIT` +
  `Mt101OutboundEndToEndIT` = **3**, 0 fallos.

## Pendiente documentado (no bloqueante)

El modelo de tablas versionadas (`mt101_corrective_pay_plan` con `plan_revision` DRAFT/ACTIVE/SUPERSEDED) sigue
siendo la evolución de **máxima robustez** (separar físicamente borrador de plan activo y poder conservar el
histórico de revisiones). Con la reserva exclusiva + el upsert atado a la reserva + la solicitud atómica + el
claim de spec exacto, el plan ya es inmutable y la preparación exclusiva en el flujo actual; el modelo versionado
queda documentado como evolución, no como brecha abierta.

## Conclusión

La preparación del plan es ahora **exclusiva** bajo una reserva atómica: dos makers concurrentes no pueden mezclar
specs, una segunda solicitud no reescribe un plan REQUESTED/EXECUTING, y un fallo a mitad libera la reserva y
limpia los parciales sin dejar el run atascado. Se cierra el último residuo del v40 ("la solución correcta") sin
código fallback.
