# Doble check Etapa 4: enqueue atómico con la suspensión (transactional outbox) — 2026-07-02

## Hallazgo real (corregido)

El motor persiste cada transición como `@Transactional(REQUIRES_NEW)` (commit por paso) y `runTask`
es `NOT_SUPPORTED`. Mi Etapa 3 encolaba el work-item **dentro de `runTask`**, vía el
`@Transactional` propio de `JpaTaskOutboxStore.enqueue` → esa tx **commitea ANTES** de que
`suspendTask` (REQUIRES_NEW, posterior) persista la suspensión.

**Consecuencia** (con un relay+consumer reales): la trama sería visible en el outbox **antes** que su
suspensión. Un consumer rápido haría `completeFromExternalResult` → `findActiveSuspendedByExecutionAndTask`
= `null` → `NOT_FOUND`: el provider ya ejecutó su **efecto huérfano** y la **completación se pierde**
(la suspensión, commiteada después, queda colgada para siempre). Es justo la anomalía que el patrón
*transactional outbox* debe evitar: el enqueue tiene que ser **atómico** con el cambio de estado.

No mordía aún porque el feature está gated/inerte (no hay consumer de broker), pero era un landmine de
correctitud latente para la Etapa 5.

## Corrección: transactional outbox real

- **`AsyncTaskDispatchService`** ya **no encola**: `prepare(...)` solo **construye** el
  `AsyncTaskEnvelope` (planner + payload). Perdió la dependencia del outbox.
- **`TaskRunResult`** lleva el `asyncDispatch` (envelope) y una factory `suspendedAsync(...)`.
- **`ProcessExecutionStateService.suspendTask`** tiene un overload que, si hay `asyncDispatch`,
  **encola en la MISMA tx REQUIRES_NEW** que persiste la suspensión (`enqueue` es
  `@Transactional(REQUIRED)` → se une a esa tx). Suspensión y trama commitean **atómicamente**.
- **`ProcessExecutionService`** pasa `runResult.asyncDispatch()` al suspend.

Así nunca hay una trama consumible sin su suspensión (evita el efecto huérfano + completación perdida),
ni una suspensión sin su trama (proceso colgado). Y `NOT_FOUND` pasa a significar inequívocamente
"ya reanudada" (reentrega), no una carrera.

## Pruebas

- **`AsyncTaskExecutionE2EIT`** **3/3** (Postgres, flag ON): el lazo sigue cerrando end-to-end con el
  enqueue ahora atómico al suspender (la trama aparece en el outbox tras `execute()` y el consumer
  completa el proceso; continuación downstream; reentrega idempotente).
- **Sin regresión del resume**: `ProcessExecutionSuspendResumeIT` **5/5** (el `suspendTask` de 8-arg
  ahora delega al de 9-arg con `null`).
- Unit afectados verdes: `AsyncTaskDispatchServiceTest` 6/6 (ahora valida construcción, no enqueue),
  `ProcessExecutionStateServiceTest` 11/11, `AsyncTaskConsumerTest` 8/8, `FileReadTaskFastPathTest`
  2/2 (constructores actualizados a la nueva firma).

## Estado

Transactional outbox correcto: la publicación async ya no puede divergir del estado del proceso. Sigue
pendiente solo el binding de transporte real (adaptador `@Incoming` `tasks.*` + IT Kafka), decisión de
topología a acordar.
