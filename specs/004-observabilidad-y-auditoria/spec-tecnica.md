# Spec tecnica - Observabilidad y auditoria

## Componentes relacionados

- frontend: `Operations Console`, vista `overview`
- backend: `ExecutionQueryResource`
- servicios: `ExecutionQueryService`, `AuditService`, `ProcessedSourceFileService`
- persistencia: `AuditEventRepository`, `ProcessedSourceFileRepository`

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

## Consideraciones tecnicas

- spans por proceso y por tarea
- linaje de reproceso en `process_execution`
- endpoints para detalle y ejecuciones hijas
- resumen operativo en `GET /api/query/overview-summary`

## Pruebas tecnicas sugeridas

- consulta por filtros
- navegacion a detalle de ejecucion
- consistencia entre auditoria, overview y trazas
