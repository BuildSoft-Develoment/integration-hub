# ADR-015 Ejecucion de tareas asincrona por broker (Kafka por defecto)

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

## Estado

Propuesto; base implementada (contrato + planner de despacho + idempotencia).

Habilita el transporte que tambien usaran los plugins out-of-process de
[ADR-014](ADR-014-backend-modular-extensible-plugins.md): el mismo envelope que
cruza el broker hacia un consumer interno puede cruzar hacia un sidecar.

## Contexto

Hoy `ProcessTaskRuntimeService` ejecuta cada tarea **sincrona, in-process**. Se
quiere poder configurar **por tarea** que corra de forma **asincrona, desacoplada
por un broker** (Kafka por defecto, otros configurables): el motor publica el
trabajo a un topic, un consumidor lo ejecuta y el proceso continua al completar.

Doble-check del estado real (lo que ya existe, pero hoy scopeado a AUDITORIA):

- `MessageBrokerProvider` (SPI en `platform-contract`) con 4 impls reales:
  `KafkaMessageBrokerProvider`, `JmsMessageBrokerProvider`,
  `RabbitMqMessageBrokerProvider`, `RedisMessageBrokerProvider`;
  `MessageBrokerRegistry.resolve(type)` (mismo patron que `TaskProviderRegistry`).
- `MessagePublisher.publish/publishBatch` (Kafka batchea -> throughput a escala 1M).
- Outbox durable + relay: `audit_spool` + `OutboxRelay`/`AuditSpoolRelayStore`.
- DLQ: `AuditDeadLetterWriter` (en `audit-consumer`).
- Suspend/resume: `SuspendableTaskProvider`, `ProcessExecutionResumeService`,
  `ResumeCallbackSignatureVerifier`.

Es decir, el patron (broker pluggable + Kafka default + outbox + DLQ + resume) esta
**probado en produccion para auditoria**; reutilizarlo para despacho de tareas es el
trabajo nuevo.

## Decision

Introducir un **modo de ejecucion por tarea**: `async: true` + `transport`
(KAFKA por defecto, override por tarea). El motor decide sync vs async y, en async,
publica un envelope al broker; un consumer ejecuta la tarea y reanuda el proceso.

- `AsyncTaskEnvelope` (en `platform-contract`): work-item serializado que cruza el
  broker (traceId, ids, taskType, transport, idempotencyKey, attempt, payload).
  Mismo artefacto compartido que reutilizaran los plugins out-of-process (ADR-014).
- `TaskDispatchPlanner`: lee la config de la tarea y devuelve `SYNC` o
  `ASYNC(transport)`. Kafka por defecto.
- Despacho fiable: outbox transaccional de tareas (analogo a `audit_spool`) +
  relay que publica via `MessageBrokerProvider`. Sin perdida ni duplicado de
  despacho.
- Continuacion: una tarea async **suspende** el proceso; al llegar el resultado, se
  **reanuda** en la siguiente tarea (reusa `SuspendableTaskProvider`/resume).
- Idempotencia: `TaskIdempotency` deriva una clave determinista por unidad de
  trabajo; el consumer descarta duplicados (Kafka es at-least-once).

## Reglas

- Default global `KAFKA`; override por tarea via `transport` (resuelto por
  `MessageBrokerRegistry`).
- Granularidad async = **batch/slice**, no por registro (1M mensajes seria
  inviable; el chunk es la unidad de mensaje, aprovechando `publishBatch`).
- Toda tarea async debe ser **idempotente** (at-least-once): `DB_WRITE`,
  `REST_CALL` y pagos SWIFT no pueden duplicar efecto. Un `MT101_PAY` async respeta
  los estados terminales no reprocesables (ADR del motor de pagos).
- Reintentos con backoff + DLQ por tarea (reusa el patron del spool de auditoria).
- `traceId`/`recordId` viajan en headers del mensaje; el audit trail ya indexa por
  ellos.

## Consecuencias

- Las tareas I/O-bound o de confirmacion asincrona (rest, swift pay/status, notif)
  se desacoplan y escalan por consumer groups; las baratas (sp/fn) pueden seguir
  sync.
- Backpressure y paralelismo naturales por consumer group (complementan el
  `Semaphore` del streaming actual).
- Coste: gestion de idempotencia, outbox de tareas y observabilidad del consumer.
- El mismo envelope habilita ADR-014: un plugin out-of-process es un consumer del
  mismo contrato al otro lado del broker (o de gRPC).

## Alcance implementado (base)

- `AsyncTaskEnvelope` (platform-contract): contrato del work-item.
- `TaskDispatchPlanner` + `TaskDispatch`: decision sync/async + transport (Kafka
  default), unit-tested.
- `TaskIdempotency`: clave determinista por unidad de trabajo, unit-tested.

## Alcance pendiente

- Outbox de despacho de tareas (tabla + relay) reusando el patron `audit_spool`.
- Consumer de tareas + reanudacion del proceso (`SuspendableTaskProvider`/resume).
- Deduplicacion por `idempotencyKey` en el consumer + DLQ por tarea.
- Cableado de `TaskDispatchPlanner` en `ProcessTaskRuntimeService` (rama async).
- Pruebas de integracion con Kafka (devservices/testcontainers).
