# Evidencia: async por-tarea (ADR-015) — Etapa 1: outbox de despacho durable - 2026-07-02

Implementación **por etapas verificables** del async por-tarea con broker (opción 1). Etapa 1 =
el buffer de despacho durable (la pieza más segura: **no toca el motor de ejecución**).

## Qué se hizo

- **Migración `V78__task_dispatch_outbox.sql`**: tabla `task_dispatch_outbox` (espejo de
  `audit_spool`): envelope + status/attempts/next_attempt_at/locked_by + índice único por
  `idempotency_key` (dedupe de despacho) + índice de drenaje.
- **Entidad `TaskDispatchOutbox`** + **`JpaTaskOutboxStore`** (implementa el puerto
  `TaskOutboxStore`, ya existente): `enqueue` idempotente, `claimPending` con
  **`for update skip locked`** (dos réplicas no publican la misma fila) + recuperación de lease
  atascado (IN_FLIGHT antiguo), `markSent/markRetry/markDead`. (De)serializa el `AsyncTaskEnvelope`.
- **`TaskDispatchRelayScheduler`** (`@Scheduled`, `concurrentExecution=SKIP`): drena el outbox vía
  el `TaskOutboxRelay` (ya unit-tested) + `MessageBrokerRegistry::resolve`. **Gated por
  `tasks.dispatch.enabled` (default `false`)** → mientras el loop completo no esté cerrado, no
  drena nada; **cero impacto en la ejecución existente**.
- Config en `application.properties` (`tasks.dispatch.enabled=false`, `tasks.relay.every=5s`,
  `tasks.relay.batch-size=100`).

## Pruebas (con Postgres real)

- **IT `JpaTaskOutboxStoreTest`** (`@QuarkusTest` + `PostgresTestResource`, Testcontainers):
  **Tests run: 3, Failures: 0, BUILD SUCCESS** (30.5s). Cubre:
  - `enqueue` idempotente (misma `idempotencyKey` no duplica) → `claimPending` lo reclama con el
    `taskType`/headers correctos → `markSent` → ya no se reclama.
  - `markDead` → fuera del set reclamable.
  - `markRetry(attempt=2, backoff=0)` → reclamable de nuevo con `attempt` incrementado.
- Flyway validó **78 migraciones** (incluida la V78) al arrancar el IT.
- El `TaskOutboxRelay.drain()` (sent/retry/dead) ya estaba unit-tested contra los puertos.

## Estado (opción 1, por etapas)

- ✅ **Etapa 1 — Dispatch durable**: outbox JPA + relay + scheduler (flag off). *El lado de
  publicación al broker queda completo y probado.*
- ⏳ Etapa 2 — **Consumer** de tareas (broker → ejecuta el provider → publica resultado).
- ⏳ Etapa 3 — **Cablear `runTask()`** (rama async: `enqueue` + suspender la tarea), flag-gated.
- ⏳ Etapa 4 — **Resume** del proceso al llegar el resultado + **e2e** con Kafka (Testcontainers).

Nada se activa hasta que el loop esté cerrado y verificado (regla: no colgar procesos).
