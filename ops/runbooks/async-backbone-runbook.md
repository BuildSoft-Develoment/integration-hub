---
kind: transversal
---

# Runbook — Puesta en marcha del backbone async (ADR-015)

> Runbook operativo **transversal** del backbone de ejecución asíncrona de tareas (ADR-015).
> Cobertura: `RF-019` (mensajería/pagos async), ejecución offloadada a broker. El feature está
> **apagado por defecto**; este runbook describe cómo encenderlo, apagarlo y operarlo sin pérdida.

## Alcance
El lazo async completo: el motor offloada una tarea (en vez de correrla in-process), la persiste en un
**outbox transaccional**, un **relay** la publica al broker (Kafka, topics `tasks.*`), un **consumer
`@Incoming`** la ejecuta y **reanuda el proceso** (SUSPENDED → COMPLETED). Herramientas de operación:
consola **DLQ** (`/executions/async-dlq`), **tile de salud** del overview y **progreso en vivo** del
detalle de ejecución.

## Arquitectura del lazo y flags
```
motor(offload) → task_dispatch_outbox → relay → Kafka(tasks.*) → consumer @Incoming → completación → resume
     ▲ tasks.async.execution.enabled     ▲ tasks.dispatch.enabled   ▲ mp.messaging.incoming.tasks-in.enabled
```

| Flag | Prende | Default |
|---|---|---|
| `tasks.async.execution.enabled` | Productor (offload en el motor; escribe al **outbox durable**) | `false` |
| `tasks.dispatch.enabled` | **Relay** del outbox → broker (el que publica a Kafka) | `false` |
| `mp.messaging.incoming.tasks-in.enabled` | Consumer `@Incoming` (Kafka `tasks.*`) | `false` |
| `tasks.async.recovery.enabled` | Scheduler de recuperación de page-chains estancadas | `false` |

## Procedimiento normal

### Activación (orden que evita pérdida)
El **productor solo escribe al outbox transaccional** (DB, durable) — se puede encender en cualquier
momento sin riesgo. El que pone mensajes en Kafka es el **relay**. Por eso el orden crítico es
**consumer antes que relay**:

1. **Kafka disponible** (`kafka.bootstrap.servers` real y alcanzable).
2. **`mp.messaging.incoming.tasks-in.auto.offset.reset=earliest`** (recomendado). Sin esto, Kafka usa
   `latest` y en la **primera** activación el grupo `platform-app-tasks` (sin offset commiteado)
   **descarta los mensajes publicados antes de suscribirse** → procesos colgados en SUSPENDED. Con
   `earliest` el consumer los recupera aunque el orden se invierta.
3. **Consumer ON** (`mp.messaging.incoming.tasks-in.enabled=true`) — se suscribe al topic.
4. **Relay ON** (`tasks.dispatch.enabled=true`) — recién ahora salen mensajes al broker; el consumer ya
   está escuchando.
5. **Productor ON** (`tasks.async.execution.enabled=true`) — puede ir en cualquier momento (el outbox es
   durable); sin él, toda tarea corre síncrona como hoy.
6. Opcional: **recovery** (`tasks.async.recovery.enabled=true`) para re-inyectar page-chains estancadas.

### Verificación post-activación
- **Outbox drenando**: gauges `tasks_outbox_*` bajando; sin backlog creciente.
- **Inbox sano**: `tasks_inbox_*` con estados `PROCESSED`; **sin `DEAD`/`POISON`**.
- **Consola DLQ** (`/executions/async-dlq`) y **tile del overview**: en verde (0 muertas, 0 estancados).
- **Progreso** (detalle de ejecución): las tareas offloadadas avanzan y los procesos pasan a COMPLETED.

## Procedimiento de fallo

### Rollback seguro (orden inverso)
1. **Productor OFF** (`tasks.async.execution.enabled=false`) — corta nuevos offloads; las tareas vuelven
   a correr síncronas.
2. **Dejar drenar**: mantener relay + consumer encendidos hasta vaciar outbox e inbox (los in-flight
   deben completarse; no apagar antes o quedan procesos SUSPENDED).
3. **Relay OFF**, luego **Consumer OFF**.

### Incidentes
- **Filas DEAD en el DLQ**: inspeccionar en la consola DLQ (F1) y **redrive** del outbox (reintenta
  publicar). Endpoint: `POST /api/query/tasks-dlq/outbox/redrive`.
- **Scatters streaming estancados**: **requeue** desde la consola (reanuda la page-chain re-inyectando la
  última página). El scheduler de recovery lo hace automático si está encendido.
- **Canal detenido** (`failure-strategy=fail`: un `nack` **detiene el canal entero**): el consumer hace
  retry in-app (`tasks.async.consumer.max-attempts=3`, `backoff-ms=200`) antes de nack; si aun así se
  detiene, revisar el error del work-item, corregir la causa y **redrive**. No hay pérdida silenciosa.
- **Procesos colgados en SUSPENDED**: verificar que el consumer esté consumiendo (offset/lag) y que el
  `auto.offset.reset` no haya saltado el arranque inicial (ver Activación); requeue manual o recovery.

## SLO / SLI
> Objetivos baseline propuestos — pendientes de validar con operaciones bajo carga real.

- **Disponibilidad** del lazo async (envelope encolado → proceso reanudado): **>= 99.5%** mensual.
- **Latencia** de completación async (offload → resume), régimen normal: **p95 <= 5000ms**.
- **Throughput** sostenido del relay: **>= 200 tps** (ajustable, ver Tuning).
- **Tasa de error** (work-items que terminan en DEAD/POISON): **<= 1%** de los despachados.
- **Backlog** del outbox en régimen: **p95 <= 1000** filas pendientes.

## Monitoreo
- **Métricas Micrometer/Prometheus** en `/q/metrics`: gauges `tasks_outbox_*` / `tasks_inbox_*`
  (refresco `tasks.metrics.refresh.every=30s`).
- **UI**: consola DLQ (F1), tile de salud async del overview (F3), progreso en vivo del detalle (F2).
- **Alertar** si: `DEAD > 0`, backlog del outbox creciente sostenido, o estancados `> 0`.

## Tuning de escala (1M+)
| Parámetro | Default | Escala |
|---|---|---|
| `tasks.relay.every` / `batch-size` / `max-batches-per-tick` | `5s` / `1000` / `50` | subir batch y batches-per-tick para más throughput del relay |
| `smallrye.messaging.worker.async-task-worker-pool.max-concurrency` | `8` | subir para más paralelismo del consumer |
| `tasks.async.consumer.max-attempts` / `backoff-ms` | `3` / `200` | ride-out de blips antes de nack |
| `tasks.async.recovery.stall-threshold` / `every` / `max-per-sweep` | `5m` / `120s` / `50` | detección/re-inyección de page-chains |
| `tasks.retention.cleanup.*` | `7d` / dead `30d` | retención de outbox/inbox |
| conector Kafka `failure-strategy` | `fail` | **decisión ops pendiente**: retry/DLQ del conector para transitorios |

## Contactos / escalamiento
- **Nivel 1**: equipo de plataforma de integración.
- **Nivel 2**: TBD (definir con el equipo de operaciones).
- Referencias: `ADR-015-backend-task-async-broker-execution`, evidencias en `qa/fase-6-qa/evidencias/async-*`.
