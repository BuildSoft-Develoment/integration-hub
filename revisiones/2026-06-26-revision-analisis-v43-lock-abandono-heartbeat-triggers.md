# Revisión del análisis app_htoh(42) → v43 — lock, abandono transaccional, heartbeat, triggers

Fecha: 2026-06-26
Alcance: validación del v42 (token de propiedad) y cierre de los pendientes que el análisis detecta: carrera de
escritura durante el takeover, limpieza del DRAFT fallido, restauración del estado anterior, heartbeat de
preparación masiva e inmutabilidad de las revisiones. Directiva: sin código fallback / sin caminos legacy.

## Verdictos contra el código real

| Hallazgo del análisis | Verdicto | Acción |
|---|---|---|
| **P0: carrera takeover vs escritura.** `preparePayIntents`/`refresh` validaban el token con un EXISTS pero SIN el `pg_advisory_xact_lock`, así que no estaban serializados contra el takeover. | **REAL** (ventana estrecha bajo READ COMMITTED). | **CORREGIDO**: ambos toman ahora el mismo advisory lock por run y FALLAN explícitamente si pierden el token. |
| **DRAFT no se elimina al fallar la preparación.** El `finally` hacía `release` (limpia el token) y luego `deleteDraftPlanRevision` (exige el token) → no-op → DRAFT huérfano. | **REAL — bug confirmado en v42.** | **CORREGIDO**: `abandonPayPlanPreparation` (transacción única). |
| **No hay heartbeat.** Un maker legítimo y lento (>120 s) podía perder la reserva. | **REAL** (operativo). | **CORREGIDO**: renovación por página + `renewPayPlanReservation`. |
| **Se pierde el estado anterior al liberar** (siempre vuelve a NOT_REQUESTED). | **REAL** (gobierno/auditoría). | **CORREGIDO**: `pay_plan_previous_status` + restauración. |
| **Dispatcher lee el ledger mutable** (no la revisión inmutable). | **Hardening recomendado.** | **MITIGADO con triggers de inmutabilidad** (ver abajo); refactor completo documentado como opcional. |
| Falta prueba concurrente real (CountDownLatch) y prueba de cleanup del DRAFT fallido. | **GAP de cobertura.** | **AÑADIDAS.** |

## Correcciones

### P0 — advisory lock + fallo explícito (sin código fallback)
`preparePayIntents` y `refreshPayFragmentsFromCorrectiveSet` se ejecutan ahora dentro de
`inTransaction { lockRunForActionChain(...); ... }`, el MISMO advisory lock por run que usan reservar/compilar/
activar/claim. Así la escritura queda **serializada** contra el takeover: no basta el EXISTS del snapshot. Si el
maker perdió la reserva, `preparePayIntents` lanza una excepción explícita (no escribe specs tardíos). El lock se
toma **por página** (no se mantiene durante el millón de filas): entre páginas, B puede reclamar; la página
siguiente de A verifica el token bajo el lock y aborta.

### Bug confirmado — abandono transaccional único
`abandonPayPlanPreparation(runId, reservationId, actor, reason)` hace en UNA transacción (bajo el lock, gated por
el token): borra el DRAFT + sus fragmentos, borra los intents PREPARED parciales, **restaura el estado anterior**
(`pay_plan_previous_status`), limpia el token y registra `PAY_PLAN_PREPARATION_ABORTED`. Reemplaza la secuencia
`release + deleteDraft + deleteOrphan` que dejaba el DRAFT huérfano. Si otro maker reclamó la reserva (takeover),
es no-op (no toca el trabajo del nuevo dueño).

### Heartbeat de preparación masiva
Cada página escrita por `preparePayIntents` **renueva** `pay_plan_reserved_at` (bajo el lock, sólo si sigue siendo
el dueño). Además se expone `renewPayPlanReservation(runId, reservationId)`. Un maker legítimo que avanza no pierde
la reserva por vencimiento.

### Restaurar estado anterior (auditoría)
`reserve` conserva el estado anterior en `pay_plan_previous_status` (y lo preserva en un takeover). El abandono lo
restaura: `INVALIDATED → PREPARING_PLAN → (falla) → INVALIDATED` (no se degrada a NOT_REQUESTED).

### Inmutabilidad por triggers (homologación fuerte)
Triggers de BD (V65) impiden mutar revisiones aprobadas/históricas:
- `mt101_corrective_pay_plan_fragment`: inmutable (no UPDATE/DELETE) cuando su revisión es ACTIVE o SUPERSEDED.
- `mt101_corrective_pay_plan`: sólo se permite `DRAFT → ACTIVE → SUPERSEDED`; una ACTIVE no puede cambiar
  hash/count/version/revisión; una SUPERSEDED es totalmente inmutable.

Esto convierte la revisión ACTIVE en una fuente **estrictamente inmutable**. Combinado con el claim (que exige
`fragment.plan_revision = run.active_plan_revision` + `dispatch_spec_json` exacto) y con que ya NO existe ninguna
ruta funcional que reescriba specs tras REQUESTED, el dispatcher ejecuta exactamente la spec de la revisión
aprobada. El refactor de que el dispatcher LEA físicamente desde `mt101_corrective_pay_plan_fragment` queda
documentado como hardening opcional (la garantía ya se sostiene por construcción + inmutabilidad declarada en BD).

## Cambios

- **V64**: `mt101_rebuild_run.pay_plan_previous_status`.
- **V65**: triggers de inmutabilidad de `mt101_corrective_pay_plan(_fragment)`.
- **`Mt101RebuildRepository`**: `preparePayIntents`/`refreshPayFragmentsFromCorrectiveSet` bajo advisory lock +
  fallo explícito; `reserve` conserva `pay_plan_previous_status`; `abandonPayPlanPreparation`;
  `renewPayPlanReservation` + heartbeat por página.
- **`Mt101CorrectiveLifecycleService`**: el `finally` usa `abandonPayPlanPreparation` (sustituye release+delete+delete).

## Pruebas (todas en verde)

- `Mt101CorrectiveLifecycleServiceTest` — **50** (+3):
  - `twoConcurrentMakersOnTheSameRunYieldExactlyOneCoherentApprovedPlan` (CountDownLatch, 2 hilos): exactamente uno
    concreta; el otro es rechazado; una sola revisión ACTIVE; plan coherente (sin mezcla).
  - `abandoningPreparationRemovesDraftRestoresPreviousStatusAndRecordsAbortAction`: cero DRAFT, cero plan_fragment,
    cero PREPARED, estado restaurado a INVALIDATED, acción `PAY_PLAN_PREPARATION_ABORTED`.
  - `activePlanRevisionAndItsFragmentsAreImmutableAtTheDatabaseLevel`: UPDATE/DELETE de un plan_fragment ACTIVE,
    cambio de hash de la revisión ACTIVE y reversión ACTIVE→DRAFT son rechazados por los triggers.
  - Reescritos: `preparePayIntentsRequiresOwnershipOfTheReservationOrThrows` (ahora FALLA explícitamente sin token)
    y el takeover (A no puede escribir/refrescar/compilar/liberar). `requestPay...AuditFailure` ajustado: con la
    auditoría caída el request NO concreta (no hay REQUESTED ni plan ACTIVE sin evidencia).
- `Mt101PayFragmentReprocessTest` — **34** · `Mt101StatusTaskProviderTest` — **20**.
- Todos los tests Mt101 (unit): **283**, 0 fallos.
- Integración end-to-end con Flyway real (aplica hasta **V65**, `Successfully applied 65 migrations`): **3**, 0 fallos.

## Conclusión

Cerrado el P0 de propiedad exclusiva: `preparePayIntents`/`refresh` usan el mismo advisory lock y fallan
explícitamente al perder el token, por lo que un takeover no puede mezclar specs. Corregido el bug del DRAFT
huérfano (abandono transaccional con restauración de estado y acción auditada), añadido el heartbeat de
preparación masiva, y reforzada la inmutabilidad de las revisiones con triggers de BD. La preparación del plan es
exclusiva, abortable de forma limpia y auditada, y el plan aprobado es estrictamente inmutable. No quedan caminos
legacy; el único punto abierto es un hardening opcional (que el dispatcher lea físicamente desde la tabla de
revisión inmutable), ya cubierto por construcción + triggers.
