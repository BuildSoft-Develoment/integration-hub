# Spec tecnica - Diseno y ejecucion de procesos

## Componentes relacionados

- backend: `ProcessDefinitionResource`, `ProcessExecutionResource`
- servicios: `ProcessCatalogService`, `ProcessExecutionService`, `ProcessSchedulerService`
- engine: registries de source, reader y task providers
- persistencia: `ProcessDefinitionRepository`, `ProcessExecutionRepository`, `ProcessTaskExecutionRepository`

## Modelo de datos

Tablas principales (Flyway `V1__initial_schema.sql` y posteriores):

Tabla `process_definition`:

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigserial | PK |
| `name` | varchar(120) | unico, no nulo |
| `description` | varchar(255) | opcional |
| `active` | boolean | default true |

Indices: PK en `id`; UNIQUE en `name`.

Tabla `process_task_definition`:

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigserial | PK |
| `process_definition_id` | bigint | FK -> process_definition.id (on delete cascade) |
| `task_order` | integer | orden de ejecucion de la tarea |
| `task_type` | varchar(50) | tipo de tarea (FILE_READ, DB_WRITE, STORED_PROCEDURE, REST_CALL) |
| `source_definition_id` | bigint | FK -> source_definition.id (nullable) |
| `reader_definition_id` | bigint | FK -> reader_definition.id (nullable) |
| `configuration_json` | text | parametros de la tarea |

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

El linaje de reproceso se complementa con `process_execution` (retry/lineage, `V7`) y `processed_source_file` (`V6`).

## Consideraciones tecnicas

- las tareas `DB_WRITE`, `DB_EXECUTE_SP`, `DB_EXECUTE_FN`, `REST_CALL` y `NOTIFICATION` deben publicar salidas consistentes
- el runtime debe mantener `executionVariables` y variables tecnicas
- el scheduler no debe generar duplicados por reinicio o failover no controlado

## Pruebas tecnicas sugeridas

- ejecucion manual end-to-end
- ejecucion programada
- reproceso y linaje de ejecuciones
- cobertura de salidas dinamicas entre tareas
