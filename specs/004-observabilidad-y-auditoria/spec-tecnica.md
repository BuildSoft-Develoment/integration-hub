# Spec tecnica - Observabilidad y auditoria

## Componentes relacionados

### Backend (`platform-app`)
- API: `ExecutionQueryResource` (`/api/query/*`: overview-summary, process-executions, `/{id}`, `/children`, `/tasks`, audit-events).
- Servicios: `ExecutionQueryService`, `AuditService`, `AuditSpoolWriter`,
  `AuditSpoolOperationsService`, `AuditSpoolRelayStore`,
  `ProcessedSourceFileService`, `ProcessExecutionService`.
- Persistencia (Panache): `AuditEventRepository`, `AuditRecordEventRepository`,
  `AuditSpoolRepository`, `ProcessedSourceFileRepository`,
  `ProcessExecutionRepository`, `ProcessTaskExecutionRepository`.
- Mensajeria: `MessageBrokerProvider` en `platform-contract`, providers
  productores `KAFKA`, `JMS`, `RABBITMQ`, `REDIS`, `OutboxRelay` fail-fast si
  el broker configurado no existe.
- API operativa: `AuditSpoolResource` (`/api/query/audit-spool/*`) y
  `Mt101FragmentLookupResource` (`/api/query/mt101-fragments/source-row`).

### Consumer (`audit-consumer`)
- Deployable Quarkus independiente.
- Adapter Kafka via Reactive Messaging y adapters opcionales JMS/RabbitMQ/Redis.
- `AuditEventHandler` enruta por lotes `PROCESS` a `audit_event`, `RECORD` a
  `audit_record_event`/ClickHouse y poison messages a `audit_dead_letter_event`.
- Kafka usa `@Blocking("audit-worker-pool")`; JMS/RabbitMQ/Redis acumulan hasta
  `audit.consumer.batch-size` antes de confirmar/avanzar el cursor.
- Idempotencia por `event_id`.

### Frontend (`frontend/libs/features/executions` + `frontend/libs/features/audit`, Angular/Nx)
- API: `execution-api.service.ts`, `audit-api.service.ts`.
- Estado (CQRS): `execution-catalog.store.ts`, `execution-catalog-query.store.ts`,
  `execution-detail.store.ts`, `execution-files-panel.store.ts`, `audit.store.ts`.
- Componentes: `execution-list`, `execution-editor` (summary/header/files-tab), `execution-task-list`,
  `execution-files-panel`, `execution-lineage` (linaje/reproceso), `execution-toolbar`;
  `audit-list`, `audit-editor`, `audit-toolbar`, `record-lineage`,
  `audit-spool`, `mt101-fragment-lookup`. Correlacion por `processExecutionId`.

## Modelo de datos

Tablas de evidencia (Flyway `V1__initial_schema.sql` y `V6__processed_source_file.sql`):

Tabla `audit_event`:

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigserial | PK |
| `process_execution_id` | bigint | FK -> process_execution.id (on delete set null, nullable) |
| `task_definition_id` | bigint | FK -> process_task_definition.id (on delete set null, nullable) |
| `event_type` | varchar(80) | tipo de evento de auditoria |
| `status` | varchar(30) | estado asociado al evento |
| `message` | text | mensaje legible |
| `payload_json` | text | payload del evento |
| `created_at` | timestamp | default current_timestamp |

Indices: PK en `id`; INDEX en `process_execution_id` para correlacion operativa.

Tabla `processed_source_file`: `id` (PK), `process_execution_id` (FK -> process_execution.id), `task_definition_id` (FK -> process_task_definition.id), `file_name`, `file_path`, `media_type`, `file_size`, `last_modified`, `status`, `record_count`, `skipped_count`, `written_count`, `error_message`, `created_at`.

La consulta operativa se apoya ademas en `process_execution` y `process_task_execution`, correlacionadas por `process_execution_id`.

Tabla `audit_record_event`:

| Columna | Tipo | Notas |
|---|---|---|
| `event_id` | varchar(64) | idempotencia |
| `trace_id` | varchar(120) | ejecucion/archivo |
| `record_id` | varchar(64) | registro o mensaje |
| `stage` | varchar(80) | etapa E2E |
| `status` | varchar(30) | estado de etapa |
| `standard` | varchar(20) | SWIFT/ISO20022/etc. |
| `message_type` | varchar(30) | MT101/pain.001/etc. |
| `source_file_name` | varchar(255) | archivo origen |
| `source_file_hash` | char(64) | SHA-256 origen |
| `record_number` | bigint | fila/linea origen |
| `business_key_hash` | char(64) | DNI/cuenta/clave sensible hasheada |
| `payment_reference` | varchar(40) | MT101 `:20:` |
| `transaction_reference` | varchar(40) | MT101 `:21:` |
| `uetr` | varchar(36) | UETR |
| `archive_id` | bigint | id interno de archivo de pago |
| `gateway_reference` | varchar(120) | id banco/gateway |

Tabla `audit_dead_letter_event`: conserva mensajes de auditoria no parseables con
broker, topic, payload y error.

Tabla `audit_spool`:

| Columna | Tipo | Notas |
|---|---|---|
| `event_id` | varchar | id del envelope |
| `trace_id` | varchar | correlacion de ejecucion |
| `topic` | varchar | destino MQ |
| `partition_key` | varchar | clave estable de orden |
| `spool_status` | varchar | `PENDING`/`IN_FLIGHT`/`SENT`/`DEAD` |
| `attempts` | integer | reintentos acumulados |
| `last_error` | text | ultimo error recuperable |
| `locked_by` | varchar | relay que tomo lease |
| `locked_at` | timestamp | inicio de lease |
| `next_attempt_at` | timestamp | backoff |
| `sent_at` | timestamp | confirmacion de publish |
| `dead_at` | timestamp | entrada a DLQ operacional |
| `dead_reason` | text | error terminal |

Indices operativos: `ix_audit_spool_due` (`spool_status`, `next_attempt_at`,
`id`), `ix_audit_spool_locked`, `ix_audit_spool_dead`.

## Consideraciones tecnicas

- spans por proceso y por tarea
- auditoria asincrona obligatoria: sin fallback silencioso a DB directa
- escritura de spool en transaccion independiente (`REQUIRES_NEW`) mediante
  `AuditSpoolWriter`
- relay con claim por lease, multiples batches por tick, backoff exponencial y
  estado `DEAD` para filas que superan `audit.relay.max-attempts`
- linaje de reproceso en `process_execution`
- endpoints para detalle y ejecuciones hijas
- endpoint `GET /api/query/record-lineage` por `recordId`, `traceId`,
  `sourceFileHash+recordNumber` o `key+value`
- endpoints `GET /api/query/audit-spool/summary`, `GET /api/query/audit-spool/dead`,
  `POST /api/query/audit-spool/{id}/retry`, `DELETE /api/query/audit-spool/sent`
- endpoint `GET /api/query/mt101-fragments/source-row` por `recordNumber`,
  `sourceTable`, `processExecutionId`, `fragmentSetId` y `connectionRef`
- resumen operativo en `GET /api/query/overview-summary`

## Pruebas tecnicas sugeridas

- consulta por filtros
- navegacion a detalle de ejecucion
- consistencia entre auditoria, overview y trazas
- consumer batch/DLQ: mezcla de PROCESS, RECORD y poison en un mismo lote
- spool: retry de `DEAD`, limpieza `SENT`, lease/backoff
- MT101 lookup: fila origen -> fragmento y `:20:` generado
