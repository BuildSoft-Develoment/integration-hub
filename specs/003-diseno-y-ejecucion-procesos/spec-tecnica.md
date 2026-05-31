# Spec tecnica - Diseno y ejecucion de procesos

## Componentes relacionados

### Backend (`platform-app`)
- API: `ProcessDefinitionResource` (`/api/process-definitions`), `ProcessExecutionResource` (`/api/process-executions`), `ProcessScheduleResource` (`/api/process-schedules`).
- Servicios: `ProcessCatalogService`, `ProcessExecutionService`, `ProcessSchedulerService`.
- Engine (registries de source/reader/task providers). Task providers reales:
  `DbWriteTaskProvider` (DB_WRITE), `StoredProcedureTaskProvider` (DB_EXECUTE_SP),
  `DatabaseFunctionTaskProvider` (DB_EXECUTE_FN), `RestCallTaskProvider` (REST_CALL),
  `NotificationTaskProvider` (NOTIFICATION) y el fast-path `FileReadTaskFastPath` (FILE_READ).
- Persistencia (Panache repositories): `ProcessDefinitionRepository`, `ProcessTaskDefinitionRepository`,
  `ProcessExecutionRepository`, `ProcessTaskExecutionRepository`.
- Dependencia real: las tareas DB (`DB_WRITE`/`DB_EXECUTE_SP`/`DB_EXECUTE_FN`) referencian una
  conexion del catalogo `connection_definition` (`/api/connection-definitions`); el id de conexion
  y la tabla/rutina destino se guardan dentro de `configuration_json` de la tarea (no hay columna FK).

### Frontend (`frontend/libs/features/processes`, Angular/Nx)
- API: `process-api.service.ts`, `process-flow-api.service.ts`.
- Estado (CQRS): `process-catalog.store.ts`, `process-catalog-query.store.ts`,
  `process-catalog-command.service.ts`, `process-editor.store.ts`, `process-reference.store.ts`.
- Componentes: `process-list`, `process-editor`, disenador visual de flujo
  (`process-flow-palette`/`process-flow-node`/`process-flow-action-panel`) y formularios por tipo
  de tarea (`process-db-write-*`, `process-db-execute-sp`, `process-db-execute-fn`,
  `process-rest-call`, `process-notification`, `process-file-read`, `process-json`), con
  `process-form-factory.service.ts` y `process-task-binding-context.service.ts`.
- Depende de las features `connections` (metadata JDBC para mapear tablas/rutinas) y `schedules`
  (programacion de ejecuciones).

## Modelo de datos

Tablas principales (Flyway `V1__initial_schema.sql` y posteriores):

Tabla `process_definition`:

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigserial | PK |
| `name` | varchar(120) | unico, no nulo |
| `description` | varchar(255) | opcional |
| `active` | boolean | default true |
| `flow_layout_json` | text | layout del disenador visual de flujo (`V8`, nullable) |

Indices: PK en `id`; UNIQUE en `name`.

Tabla `process_task_definition`:

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigserial | PK |
| `process_definition_id` | bigint | FK -> process_definition.id (on delete cascade) |
| `task_order` | integer | orden de ejecucion de la tarea |
| `task_type` | varchar(50) | tipo de tarea: `FILE_READ`, `DB_WRITE`, `DB_EXECUTE_SP`, `DB_EXECUTE_FN`, `REST_CALL`, `NOTIFICATION` (enum `TaskType`) |
| `source_definition_id` | bigint | FK -> source_definition.id (nullable) |
| `reader_definition_id` | bigint | FK -> reader_definition.id (nullable) |
| `active` | boolean | default true (`V4`) |
| `configuration_json` | text | parametros de la tarea; para tareas DB incluye el id de `connection_definition` y la tabla/rutina destino |

Indices: PK en `id`; INDEX en `process_definition_id`.

Tabla `process_execution`:

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigserial | PK |
| `process_definition_id` | bigint | FK -> process_definition.id |
| `status` | varchar(30) | estado de la ejecucion |
| `started_at` | timestamp | inicio |
| `finished_at` | timestamp | fin |
| `details` | text | detalle/resumen |
| `source_execution_id` | bigint | FK -> process_execution.id (linaje de reproceso, `V7`, nullable) |
| `trigger_source` | varchar(40) | origen del disparo (manual/scheduler, `V7`) |
| `request_payload_json` | text | payload de solicitud asincrona (`V11`, nullable) |

Indices: PK en `id`; INDEX `idx_process_execution_source_execution_id` en `source_execution_id` (`V7`).

Tabla `process_task_execution`:

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigserial | PK |
| `process_execution_id` | bigint | FK -> process_execution.id (on delete cascade) |
| `task_definition_id` | bigint | FK -> process_task_definition.id |
| `status` | varchar(30) | estado de la tarea |
| `executed_at` | timestamp | marca de ejecucion |
| `started_at` | timestamp | inicio (`V5`) |
| `finished_at` | timestamp | fin (`V5`) |
| `details` | text | detalle/resumen |

Indices: PK en `id`; INDEX en `process_execution_id`.

Tabla `staging_record`: registros intermedios por ejecucion y tarea (`id` PK, FK -> process_execution.id, FK -> process_task_definition.id, `payload_json`).

Tabla relacionada `connection_definition` (`V3`, catalogo de conexiones JDBC usado por las tareas DB; ver feature de conexiones):

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigserial | PK |
| `name` | varchar(120) | unico, no nulo |
| `active` | boolean | default true |
| `configuration_json` | text | parametros de conexion (driver/url/credenciales via `${secret:...}`) |

Indices: PK en `id`; UNIQUE en `name`.

El linaje de reproceso se complementa con `process_execution` (retry/lineage, `V7`) y `processed_source_file` (`V6`). Las programaciones viven en `process_schedule` (`V2`, feature de schedules).

## Consideraciones tecnicas

- las tareas `DB_WRITE`, `DB_EXECUTE_SP`, `DB_EXECUTE_FN`, `REST_CALL` y `NOTIFICATION` deben publicar salidas consistentes
- el runtime debe mantener `executionVariables` y variables tecnicas
- el scheduler no debe generar duplicados por reinicio o failover no controlado

## Pruebas tecnicas sugeridas

- ejecucion manual end-to-end
- ejecucion programada
- reproceso y linaje de ejecuciones
- cobertura de salidas dinamicas entre tareas
