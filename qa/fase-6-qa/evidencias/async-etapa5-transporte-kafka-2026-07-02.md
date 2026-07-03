# Async Etapa 5 — binding de transporte (consumer Kafka in-process) — 2026-07-02

Última pieza del feature async (ADR-015): el adaptador de broker que saca la trama de Kafka y la
entrega al núcleo del consumer. Cierra el lazo **end-to-end sobre Kafka real**.

## Decisión de topología: in-process en platform-app (no worker aparte)

A diferencia de la auditoría (`audit-consumer` es un deployable separado que solo escribe su
read-model), la **completación de una tarea async es lógica de motor**: reanuda la ejecución del
proceso (`ProcessExecutionResumeService` + BD de platform-app) y continúa el pipeline. Un worker
externo no podría reanudar sin llamar de vuelta al motor. Por eso el consumer vive **in-process** en
platform-app, consistente con `AsyncTaskConsumer` + `AsyncTaskCompletion`.

## Piezas

- **`AsyncTaskBrokerConsumer`** (adaptador fino, patrón `AuditEventConsumer`): `@Incoming("tasks-in")`
  `@Blocking` → delega en `AsyncTaskConsumer`. ACK en desenlaces terminales; **nack** solo en fallo
  transitorio de `execute` (no confirma el offset → sin pérdida silenciosa del work-item).
- **Canal `tasks-in`** (application.properties): Kafka, suscripción por **patrón `tasks.*`**,
  `group.id=platform-app-tasks`. **Gated OFF** por defecto
  (`mp.messaging.incoming.tasks-in.enabled=false`) → platform-app **no** abre un consumer de Kafka
  salvo activación explícita del feature. Verificado: con el gate OFF, el arranque loguea
  *"Incoming channel `tasks-in` disabled by configuration"* y no conecta a Kafka.
- Worker pool `async-task-worker-pool` (max-concurrency 8) para el handler bloqueante (ejecuta
  provider + continuación, que hacen I/O).

## Pruebas

- **`AsyncTaskKafkaConsumerE2EIT`** (Kafka real, Testcontainers) **1/1**: tarea `async:true` suspende +
  encola → se publica el envelope al topic `tasks.test_follow_up` de Kafka → el adaptador `@Incoming`
  (grupo `platform-app-tasks`) lo consume → ejecuta el provider → **reanuda el proceso hasta
  COMPLETED**; `task_inbox=PROCESSED`, 1 ejecución del provider. Loop completo productor → outbox →
  broker → consumer → completación sobre broker real.
- **Boot gated verificado**: con el canal OFF, `AsyncTaskExecutionE2EIT` **3/3** arranca limpio (sin
  conexión a Kafka), confirmando cero impacto en producción.

## Estado — feature async completo

| Etapa | Qué | Verificación |
|---|---|---|
| 1 | Outbox durable + relay | IT Postgres |
| 2 | Consumer in-process + inbox idempotente | unit + IT |
| 3 | Productor cableado en runTask (gated) | unit + IT |
| 4 | Continuación complete-from-external-result | **E2E sin broker** |
| — | Doble check: enqueue atómico (transactional outbox) | E2E + resume |
| 5 | Transporte Kafka `@Incoming` (gated) | **E2E Kafka real** |

El lazo async está **completo y verificado end-to-end sobre Kafka**, gated OFF por defecto. Para
activarlo en un entorno: `tasks.async.execution.enabled=true` (motor despacha async),
`tasks.dispatch.enabled=true` (relay publica) y `mp.messaging.incoming.tasks-in.enabled=true` (consumer).
Tuning pendiente (ops): estrategia de fallo del conector (retry/DLQ) para fallos transitorios y ajuste
del refresco de metadata para el descubrimiento de topics por patrón.
