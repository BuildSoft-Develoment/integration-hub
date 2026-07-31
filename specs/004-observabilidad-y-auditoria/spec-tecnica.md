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
- Contrato UI de riesgo operacional: las pantallas con mutaciones auditables
  consumen un registro tipado de operaciones (`severity`, `requiredCapability`,
  `evidence`, `labelKey`, `summaryKey`) para separar consulta de operacion
  gobernada. El contrato no sustituye permisos ni validaciones backend; solo
  normaliza la presentacion y reduce ambiguedad UX.
- Workspace audit: las rutas `/audit/*` comparten navegacion interna standalone
  que clasifica cada superficie como `query` u `operation`, sin conocer APIs ni
  permisos. La navegacion es un componente de presentacion reutilizable para
  sostener el mapa mental del operador.

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
| `id` | bigserial | PK |
| `event_id` | varchar(64) | idempotencia |
| `trace_id` | varchar(120) | ejecucion/archivo |
| `record_id` | varchar(64) | registro o mensaje |
| `stage` | varchar(80) | etapa E2E |
| `status` | varchar(30) | estado de etapa |
| `process_execution_id` | bigint | ejecucion que emitio la trama; sin ella los conflictos de pago se emiten sin correlacion |
| `task_definition_id` | bigint | tarea que emitio la trama |
| `message` | text | descripcion legible |
| `payload_json` | text | detalle serializado |
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
| `gateway_reference` | varchar(255) | id banco/gateway. En SFTP es la ruta completa del archivo depositado; por eso V104 la ensancho desde varchar(120) |
| `event_ts` | timestamp | instante de emision |
| `ingested_at` | timestamp | instante de escritura |

Indices: `ux_audit_record_event_event_id` (`event_id`, UNIQUE — es la idempotencia),
`ix_audit_record_event_record` (`record_id`, `event_ts`), `ix_audit_record_event_trace`
(`trace_id`, `event_ts`), y los operacionales de V23 por clave de negocio:
`ix_audit_record_event_file_row` (`source_file_hash`, `record_number`, `event_ts`),
`ix_audit_record_event_payment_ref`, `ix_audit_record_event_tx_ref`,
`ix_audit_record_event_uetr`, `ix_audit_record_event_archive`,
`ix_audit_record_event_business_hash` (todos con `event_ts` como segunda columna), mas el parcial
`ix_audit_record_event_gateway_reference` de V104.

Tabla `audit_dead_letter_event`: conserva mensajes de auditoria no parseables con
broker, topic, payload y error.

Tabla `audit_spool`:

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigserial | PK |
| `event_id` | varchar(64) | id del envelope |
| `trace_id` | varchar(120) | correlacion de ejecucion |
| `topic` | varchar(160) | destino MQ |
| `partition_key` | varchar(120) | clave estable de orden |
| `payload` | text | trama serializada pendiente de publicar |
| `spool_status` | varchar(16) | `PENDING`/`IN_FLIGHT`/`SENT`/`DEAD` |
| `attempts` | integer | reintentos acumulados |
| `last_error` | text | ultimo error recuperable |
| `locked_by` | varchar | relay que tomo lease |
| `locked_at` | timestamp | inicio de lease |
| `next_attempt_at` | timestamp | backoff |
| `created_at` | timestamp | alta en el spool |
| `sent_at` | timestamp | confirmacion de publish |
| `dead_at` | timestamp | entrada a DLQ operacional |
| `dead_reason` | text | error terminal |

Indices: `ux_audit_spool_event_id` (`event_id`, UNIQUE — es la idempotencia del spool),
`ix_audit_spool_pending` (`spool_status`, `id`), y los operativos de V24:
`ix_audit_spool_due` (`spool_status`, `next_attempt_at`, `id`), `ix_audit_spool_locked`
(`spool_status`, `locked_at`) e `ix_audit_spool_dead` (`spool_status`, `dead_at`).

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
- las operaciones sensibles de UI deben declararse mediante contratos puros y
  testeables para respetar SOLID/SPI: el componente presenta, el contrato
  clasifica, y el backend conserva la autoridad de negocio

## Pruebas tecnicas sugeridas

- consulta por filtros
- navegacion a detalle de ejecucion
- consistencia entre auditoria, overview y trazas
- consumer batch/DLQ: mezcla de PROCESS, RECORD y poison en un mismo lote
- spool: retry de `DEAD`, limpieza `SENT`, lease/backoff
- MT101 lookup: fila origen -> fragmento y `:20:` generado
- UI riesgo operacional: registry de operaciones, exposicion en `audit-spool`
  y `mt101-quarantine`, y evidencia visual/a11y para todas las subrutas
  `/audit/*`
- UI workspace audit: componente de navegacion interna con rutas y modo
  consulta/operacion cubierto por prueba unitaria y evidencia visual autenticada
