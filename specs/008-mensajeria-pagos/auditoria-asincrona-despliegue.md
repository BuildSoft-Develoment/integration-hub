# Auditoría asíncrona (MQ) — Despliegue y Operación

> Guía operativa del subsistema de auditoría asíncrona con outbox/spool + MQ +
> consumidor separado + store frío de trazabilidad E2E por registro.
>
> @trace spec 008-mensajeria-pagos · ADR-009

---

## 1. Arquitectura en una vista

```
[platform-app]  (productor: engine / SWIFT-pagos)
   │  AuditService.record() / RecordAuditEmitter.emitRecords()   (fuera de la TX de negocio)
   ▼
 audit_spool  (outbox durable, mini-TX REQUIRES_NEW vía AuditSpoolWriter)
   │  OutboxRelay  (@Scheduled, claimDue con FOR UPDATE SKIP LOCKED + lease)
   ▼
 [ MQ ]  Kafka | JMS | RabbitMQ | Redis     (por config: audit.broker.type)
   ▼
[audit-consumer]  (deployable / contenedor aparte)
   ├─ level=PROCESS → audit_event           (Postgres, read-model de la UI)
   └─ level=RECORD  → ColdStore             (Postgres audit_record_event | ClickHouse)
                          │
                  GET /api/query/record-lineage  ◄── visor Angular /audit/record-lineage
```

**Principios garantizados:**
- La auditoría **no participa en la TX de negocio** y **no añade latencia** al hot-path (la BD la escribe el consumidor; el productor solo hace un insert local sub-ms al spool).
- **Cero pérdida**: at-least-once (spool durable + relay con reintentos + dedup por `event_id` en el consumidor).
- Un fallo de auditoría **no tumba el pago** (`audit.fail-business-on-error=false`).
- **Broker-agnóstico**: cambiar de MQ es configuración, no código.

---

## 2. Topología de despliegue

| Componente | Artefacto | Puerto | Escala |
|---|---|---|---|
| `platform-app` | Quarkus (API + engine + productor + relay) | 8080 | por carga de pagos |
| `audit-consumer` | Quarkus (consumidor MQ → BD) | 8082 | **independiente** (réplicas por lag de auditoría) |
| MQ | Kafka (default) / Artemis / RabbitMQ / Redis | — | según broker |
| Postgres | `integration_hub` (compartido: spool, audit_event, audit_record_event) | 5432 | — |
| ClickHouse (opc.) | store frío RECORD a escala | 8123/9000 | — |

Servicios listos en `docker-compose.yml`: `postgres`, `kafka` (+`kafka-ui`), `audit-consumer`, y opcionales `rabbitmq`, `redis`, `artemis`, `clickhouse`.

**Arranque local:**
```bash
mvn -pl audit-consumer package           # fast-jar para la imagen del consumidor
docker compose up -d postgres kafka audit-consumer
# (opcional) docker compose up -d clickhouse rabbitmq redis artemis
```
> `platform-app` posee el schema (Flyway). `audit-consumer` **no** corre Flyway.
> Si se usa ClickHouse, crear la tabla con
> `audit-consumer/src/main/resources/clickhouse/audit_record_event.sql` antes de apuntarlo.

---

## 3. Configuración

### 3.1 Productor (`platform-app`)

| Propiedad | Default | Descripción |
|---|---|---|
| `audit.topic` | `audit-events` | Topic/cola lógica de auditoría |
| `audit.broker.type` | `KAFKA` | Broker activo: `KAFKA`/`JMS`/`RABBITMQ`/`REDIS` |
| `audit.record-level.enabled` | `true` | Emisión por registro (INGESTED/BUILT/…). Apagar para solo PROCESS |
| `audit.fail-business-on-error` | `false` | Si `true`, un fallo de auditoría propaga al negocio (**no recomendado**) |
| `audit.relay.enabled` | `true` | Habilita el OutboxRelay |
| `audit.relay.every` | `1s` | Periodo del relay |
| `audit.relay.batch-size` | `1000` | Filas por claim |
| `audit.relay.max-batches-per-tick` | `10` | Lotes por tick (drain-until-empty acotado) |
| `audit.relay.max-duration-ms` | `1000` | Presupuesto de tiempo por tick |
| `audit.spool.cleanup.enabled` | `true` | Retención automática de `SENT` |
| `audit.spool.cleanup.every` | `1h` | Periodo de purga |
| `audit.spool.cleanup.retention-days` | `7` | Antigüedad mínima para purgar `SENT` |
| `audit.spool.cleanup.batch` | `10000` | Tope de filas por purga |

### 3.2 Consumidor (`audit-consumer`)

| Propiedad | Default | Descripción |
|---|---|---|
| `audit.broker.type` | `KAFKA` | Debe coincidir con el productor |
| `audit.cold-store.type` | `POSTGRES` | Backend RECORD: `POSTGRES` o `CLICKHOUSE` |
| `mp.messaging.incoming.audit-in.batch` | `true` | Consumo en lote (un `writeBatch` por poll) |
| `mp.messaging.incoming.audit-in.max.poll.records` | `500` | Tamaño de lote por poll |
| `clickhouse.url` / `clickhouse.username` / `clickhouse.password` | — | Solo si `cold-store.type=CLICKHOUSE` |

> **Credenciales opcionalmente vacías** (usuario/clave anónimos) se modelan con
> `Optional<String>`, **nunca** `prop=` vacío ni `defaultValue=""`: SmallRye Config
> trata el string vacío como "ausente" y **rompe el arranque**.

---

## 4. Selección y seguridad del broker

Cambiar de broker = fijar `audit.broker.type` (y, en el consumidor, el conector
`mp.messaging.incoming.audit-in.connector`). Kafka es el broker oficial (cubierto por
IT real); JMS/RabbitMQ/Redis son enchufables vía el SPI `MessageBrokerProvider`.

### Perfil seguro (producción) — pendiente de ambiente

Los defaults en `application.properties` son de **desarrollo** (`localhost`, `guest`,
sin TLS). Para producción bancaria, definir un perfil `%prod` con:

```properties
# Kafka SASL_SSL (ejemplo)
%prod.kafka.bootstrap.servers=${secret:audit/kafka/bootstrap}
%prod.kafka.security.protocol=SASL_SSL
%prod.kafka.sasl.mechanism=SCRAM-SHA-512
%prod.kafka.sasl.jaas.config=${secret:audit/kafka/jaas}
%prod.kafka.ssl.truststore.location=/etc/secrets/kafka.truststore.jks
%prod.kafka.ssl.truststore.password=${secret:audit/kafka/truststore-password}

# RabbitMQ / Redis / JMS: TLS + credenciales vía ${secret:...}
%prod.rabbitmq.username=${secret:audit/rabbitmq/user}
%prod.rabbitmq.password=${secret:audit/rabbitmq/password}
%prod.redis.password=${secret:audit/redis/password}
%prod.jms.username=${secret:audit/jms/user}
%prod.jms.password=${secret:audit/jms/password}
```

Los secretos se resuelven con el File Vault ya configurado
(`quarkus.file.vault.provider.*`) / OpenBao; **nunca** credenciales en claro en el repo.

---

## 5. Store frío (nivel registro)

| Backend | Cuándo | Notas |
|---|---|---|
| **Postgres** (`audit_record_event`, default) | volumen moderado, simplicidad | idempotente `ON CONFLICT(event_id)` |
| **ClickHouse** (`audit.cold-store.type=CLICKHOUSE`) | **alto volumen / histórico masivo** | columnar, `ReplacingMergeTree` dedup por `event_id`, particionado por mes |

> Particionar `audit_record_event` en Postgres entra en tensión con la unicidad global
> de `event_id` (idempotencia): el particionado declarativo exige que el unique incluya
> la clave de partición. A escala, **usar ClickHouse** en vez de particionar Postgres.

---

## 6. Ciclo de vida del spool y operación

```
PENDING ──claimDue──▶ IN_FLIGHT ──ack broker──▶ SENT ──(retención)──▶ borrado
   ▲                      │
   └──nack/reintento──────┘ (markRetry: attempts++, next_attempt_at con backoff)
                          │
                          └──maxAttempts──▶ DEAD (dead_reason; requiere acción del operador)
```

- **Multi-réplica seguro**: `claimDue` usa `FOR UPDATE SKIP LOCKED` + `locked_by/locked_at`; réplicas no se pisan ni duplican.
- **IN_FLIGHT vencidos** (proceso muerto a mitad) se reclaman tras el timeout de lease.
- **DEAD** se conserva (no se purga) para inspección/replay.

### Endpoints de operación (rol `platform-admin`/`integration-admin`)

| Acción | Endpoint |
|---|---|
| Resumen del spool (pending/in_flight/sent/dead + más antiguo) | `GET /api/query/audit-spool/summary` |
| Listar DEAD | `GET /api/query/audit-spool/dead?limit=100` |
| Reintentar un DEAD | `POST /api/query/audit-spool/{id}/retry` |
| Purga manual de SENT | `DELETE /api/query/audit-spool/sent?retentionDays=7&limit=10000` |

---

## 7. Runbook

| Síntoma | Diagnóstico | Acción |
|---|---|---|
| Backlog creciente (`summary.pending` sube) | broker caído o relay lento | revisar MQ; subir `audit.relay.batch-size`/`max-batches-per-tick`; escalar réplicas del consumidor |
| `oldestPendingCreatedAt` muy viejo | relay no drena | verificar `audit.relay.enabled` + conectividad al broker |
| Crecen filas `DEAD` | payloads imposibles de publicar | `GET .../audit-spool/dead`; corregir causa; `POST .../{id}/retry` |
| `audit_event` vacío pese a pagos | consumidor caído | el spool acumula PENDING (sin pérdida); levantar `audit-consumer` y drena |
| Pagos OK pero sin auditoría | `fail-business-on-error=false` ocultó un fallo | revisar logs `Audit emission failed…`; revisar spool |
| Hot partition en Kafka | clave de partición | RECORD ya usa `recordId`/`:20:`; PROCESS usa `traceId` (orden por ejecución) |

---

## 8. Observabilidad (a instrumentar)

Métricas recomendadas (Micrometer/Prometheus):
`audit_spool_pending`, `audit_spool_in_flight`, `audit_spool_dead`,
`audit_spool_oldest_pending_age_seconds`, `audit_relay_publish_rate`,
`audit_relay_error_rate`, `audit_consumer_lag`. La base ya existe en
`AuditSpoolOperationsService.summary()`.

---

## 9. Trazabilidad E2E por registro (visor)

`GET /api/query/record-lineage` (roles operador/auditor) — línea de tiempo
`INGESTED → BUILT → VALIDATED → ARCHIVED → SENT/REJECTED`:

| Búsqueda | Parámetros |
|---|---|
| Por registro (`:20:` o `archivo:línea`) | `?recordId=LFLS123` |
| Por ejecución | `?traceId=exec-5883` |
| Por clave operacional | `?key=paymentReference&value=...` (`:20:`/`:21:`/UETR/archiveId/gateway/hash) |
| Por fila de archivo | `?sourceFileHash=<sha256>&recordNumber=1002` |

UI: `/audit/record-lineage` (menú "Trazabilidad de registro").
El enlace fila-origen → fragmento `:20:` se resuelve por el rango `recordIndexFrom/To`
que `RECORD_BUILT` guarda en `payload_json`.

---

## 10. Pruebas

| Test | Qué valida |
|---|---|
| `KafkaPublishIT` | productor → Kafka real (Testcontainers): la trama llega con `key=traceId` |
| `AuditRelayKafkaE2EIT` | `emitRecords → spool → OutboxRelay (claimDue real) → Kafka` con `record-level=ON` |
| `audit-consumer` (Testcontainers) | routing PROCESS/RECORD, `writeBatch` idempotente, DLQ de poison |
| `AuditSpoolMaintenanceSchedulerTest` | retención automática on/off |

### Prueba crítica pendiente (CI)
Corrida **1M** con `audit.record-level.enabled=true`, **Kafka real** y **`audit-consumer`
corriendo** (+ cold store Postgres/ClickHouse). Validar: 1M filas procesadas; spool sin
backlog permanente; `audit_record_event` recibe INGESTED + BUILT/VALIDATED/ARCHIVED/SENT;
sin caída de throughput MT101; sin OOM; sin hot partition crítica. Es un **job de CI**
(dos deployables + 1M no cabe en la suite local).

---

## 11. Tuning a alto volumen

- **Relay**: subir `batch-size` (5k–10k) y `max-batches-per-tick`; bajar `every` (250ms) si el backlog crece.
- **Consumidor**: `max.poll.records` mayor + réplicas (group.id permite escalar particiones).
- **Partición**: RECORD por `recordId` distribuye carga; PROCESS por `traceId` conserva orden.
- **Cold store**: ClickHouse para RECORD a escala; `audit_event` (Postgres) solo para PROCESS/UI.
- **Retención**: ajustar `audit.spool.cleanup.retention-days` según política de compliance.
