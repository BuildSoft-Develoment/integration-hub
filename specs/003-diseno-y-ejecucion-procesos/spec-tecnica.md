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

## Contrato `configuration_json` por tipo de tarea

El `configuration_json` de cada `process_task_definition` es un JSON dinamico cuya forma depende
del `task_type`. El contrato lo definen los providers del frontend
(`frontend/libs/core/providers/.../tasks/*.provider.ts`): `toTaskPatch(draft)` arma el JSON y los
campos de columna (`sourceDefinitionId`/`readerDefinitionId`); `hydrateDraft(task)` hace el inverso.
Las tareas DB referencian una conexion del catalogo via `connectionRef` dentro del JSON (no hay FK).
Credenciales/token en `REST_CALL` admiten referencia `${secret:...}` (nunca valor en claro).
`REST_CALL` y el canal `webhook` de `NOTIFICATION` comparten el mismo bloque de peticion HTTP
(`method`, `baseUrl`/`pathTemplate`/`url`, `queryParameters`, `headers`/`headerMappings`,
`authType`+credenciales, `bodyTemplate`) — front `process-http-request` + back `HttpRequestSupport`
(ADR-005). **Sin fallback**: el webhook ya no usa `headersJson` crudo; los headers van como mapa
estructurado `headers`.
`authType` admite `none`/`basic`/`bearer`/`login-request`. **`login-request`** es autenticacion en
dos pasos: antes de invocar `url` se hace una llamada al endpoint de token (`loginUrl`,
`loginMethod`, `loginHeaders`, `loginBodyTemplate`) —p.ej. AWS STS, Google OAuth, Azure AD—, se
extrae el token de la respuesta con `tokenPath` (JSON-path simple, p.ej. `$.access_token` o
`$.data.token`) y se inyecta como `Authorization: Bearer` en la peticion al servicio. Si el endpoint
de token espera `application/x-www-form-urlencoded`, se declara ese `Content-Type` en `loginHeaders`
y el cuerpo en `loginBodyTemplate`. El token se **cachea por TTL** (clave = hash de la config de
login): TTL = `tokenTtlSeconds` (config) › `expires_in` de la respuesta › 300s por defecto, con
margen de refresco; `tokenTtlSeconds: 0` desactiva la cache (token por ejecucion).

```jsonc
// FILE_READ  (sourceDefinitionId/readerDefinitionId van como columnas de la tarea)
{ "sourceVariables": { "fecha": "${today}" }, "batchSize": 500,
  "parallel": true, "parallelMode": "file", "maxConcurrency": 4 }

// DB_WRITE
{ "connectionRef": "12", "mode": "insert", "targetTable": "ventas.hechos", "jdbcBatchSize": 1000,
  "mappings": [ { "targetColumn": "monto", "sourceKind": "field", "sourceKey": "total", "key": false } ] }

// DB_EXECUTE_SP
{ "connectionRef": "12", "procedureName": "ventas.sp_cierre", "timeoutSeconds": 30,
  "parameters": [ { "name": "p_fecha", "jdbcType": "DATE", "direction": "IN" } ] }

// DB_EXECUTE_FN
{ "connectionRef": "12", "functionName": "ventas.fn_total", "resultAlias": "total", "timeoutSeconds": 30,
  "parameters": [ { "name": "p_id", "jdbcType": "BIGINT", "direction": "IN" } ] }

// REST_CALL  (authType: '' | basic | bearer | login-request; token/password via ${secret:...})
{ "mode": "per-record", "method": "POST", "baseUrl": "https://api.demo", "pathTemplate": "/v1/items",
  "timeoutSeconds": 20, "authType": "bearer", "token": "${secret:rest}", "headers": { "X-Env": "prod" },
  "bodyTemplate": "{\"id\":\"${id}\"}" }

// REST_CALL / webhook con login-request (token de dos pasos: AWS STS / OAuth / Azure AD)
{ "method": "POST", "url": "https://api.demo/v1/items", "authType": "login-request",
  "loginUrl": "https://auth.demo/oauth/token", "loginMethod": "POST",
  "loginHeaders": { "Content-Type": "application/x-www-form-urlencoded" },
  "loginBodyTemplate": "grant_type=client_credentials&client_id=${secret:cid}&client_secret=${secret:csecret}",
  "tokenPath": "$.access_token", "bodyTemplate": "{\"id\":\"${id}\"}" }

// NOTIFICATION channel log:  { "channel": "log", "message": "Proceso ${processExecutionId} ok" }
// NOTIFICATION channel email: { "channel": "email", "to": "ops@demo", "subject": "...", "body": "..." }
// NOTIFICATION channel webhook (mismo bloque HTTP que REST_CALL; sin headersJson crudo)
{ "channel": "webhook", "method": "POST", "baseUrl": "https://hooks.demo", "pathTemplate": "/x",
  "url": "https://hooks.demo/x", "message": "ok", "authType": "bearer", "token": "${secret:webhook}",
  "headers": { "X-Env": "prod" }, "bodyTemplate": "{\"message\":\"${message}\"}", "timeoutSeconds": 15 }
```

> Fuente del contrato: los 6 `*TaskProvider` (`tasks/*.provider.ts`) + sus `*TaskDraft`. El backend
> lo consume en los task providers/fast-path de `platform-app`. Mantener contrato y codigo en
> sintonia al cambiar campos.

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

## Evolucion: motor dinamico de inputs/outputs de tareas (ADR-004, WIP)

> Evoluciona la ejecucion para que cada tarea consuma outputs tipados de cualquier tarea
> anterior, declare su `executionMode` y publique outputs reutilizables. Cubre RF-006..RF-013.
> Decision en [ADR-004](../../docs/fase-3-arquitectura/adr/ADR-004-motor-input-output-tareas.md).
> En curso (WIP): backend `TaskInputResolver`/`TaskOutputRegistry` y frontend
> `process-task-runtime-panel`. Mientras no exista tabla dedicada, el contrato vive en
> `configuration_json` de cada tarea.

### Contrato canonico

```json
{
  "taskRef": "task-3-sp1",
  "taskType": "DB_EXECUTE_SP",
  "dependsOn": ["task-2-db-write"],
  "executionMode": "batch",
  "input": {
    "source": "task-output",
    "sourceTaskRef": "task-2-db-write",
    "sourceOutput": "table",
    "readMode": "records",
    "batchSize": 5000,
    "cursor": { "type": "keyset", "orderBy": "id" }
  },
  "parameters": [
    { "name": "p_execution_id", "sourceKind": "metadata", "sourceKey": "_processExecutionId", "jdbcType": "BIGINT" },
    { "name": "p_batch_number", "sourceKind": "metadata", "sourceKey": "_batchNumber", "jdbcType": "INTEGER" },
    { "name": "p_cliente_id", "sourceKind": "field", "sourceKey": "cliente_id", "jdbcType": "BIGINT" }
  ],
  "outputs": [
    { "name": "summary", "type": "summary" },
    { "name": "table", "type": "table", "table": "resultado_sp1" },
    { "name": "errors", "type": "errors" }
  ],
  "retryPolicy": { "maxRetries": 3, "backoffSeconds": 10 }
}
```

Para fan-in se usa `inputs` (lista de fuentes):

```json
{
  "taskRef": "notification-final",
  "taskType": "NOTIFICATION",
  "executionMode": "once",
  "inputs": [
    { "source": "task-output", "sourceTaskRef": "task-2-db-write", "sourceOutput": "summary" },
    { "source": "task-output", "sourceTaskRef": "task-4-sp1", "sourceOutput": "summary" },
    { "source": "task-output", "sourceTaskRef": "task-6-rest1", "sourceOutput": "errors" }
  ],
  "message": "Ejecucion {_processExecutionId}: insertados {task-2-db-write.writtenCount}, errores REST {task-6-rest1.errorCount}"
}
```

### Tipos de input

| Tipo | Descripcion | Uso principal |
| --- | --- | --- |
| `metadata` | contexto transversal, no output de tarea | bindings tecnicos y parametros comunes |
| `summary` | agregados de una tarea previa | notificaciones, cierres, SP/FN once |
| `records` | registros parseados o producidos por tarea previa | DB_WRITE, REST, SP/FN por registro/lote |
| `table` | output materializado consultable por cursor | alto volumen y tareas DB |
| `errors` | registros fallidos, rechazados o pendientes | reintentos, REST2, notificaciones |

### Metadata transversal

- Global: `_processExecutionId`, `_processDefinitionId`, `_processName`, `_triggerSource`,
  `_environment`, `_startedAt`.
- De tarea: `_taskRef`, `_taskDefinitionId`, `_taskType`.
- De lote: `_batchNumber`, `_batchSize`, `_batchFrom`, `_batchTo`, `_recordCount`.
- De fuente/archivo (cuando aplique): `_sourceFileName`, `_sourceFilePath`,
  `_sourceMediaType`, `_sourceFileSize`, `_sourceLastModified`.

La metadata no es output de tarea: es contexto accesible por cualquier tarea via bindings
`metadata`.

### Modos de ejecucion

| Modo | Entrada valida | Regla |
| --- | --- | --- |
| `once` | metadata, `summary`, agregados de `table`/`errors` | ejecuta una sola vez |
| `per-record` | `records`, `table`, `errors` | ejecuta por registro; solo si el destino no soporta lotes |
| `batch` | `records`, `table`, `errors` | ejecuta por bloque; requiere `batchSize` |

Para mas de `1,000,000` registros, `batch` es el default recomendado; `per-record` exige
justificacion de destino (REST o funciones no set-based).

### Outputs por tipo de tarea

| Tarea | Consume | Produce |
| --- | --- | --- |
| `FILE_READ` | metadata transversal para variables de fuente | `records`, `summary`, `errors` |
| `DB_WRITE` | metadata, `summary`, `records`, `table`, `errors` | `table`/`targetTable`, `summary`, `errors` |
| `DB_EXECUTE_SP` | metadata, `summary`, `records`, `table`, `errors` | `summary`, `table`/`records` opcional, `errors` |
| `DB_EXECUTE_FN` | metadata, `summary`, `records`, `table`, `errors` | `summary`, `records`/`table`/`resultAlias`, `errors` |
| `REST_CALL` | metadata, `summary`, `records`, `table`, `errors` | `summary`, `responses` como `records`/`table`, `errors` |
| `NOTIFICATION` | metadata, `summary`, `records`, `table`, `errors` | `summary`, estado de notificacion, `errors` |

### Alto volumen

- no pasar listas completas de registros entre tareas.
- materializar outputs masivos o exponerlos por cursor/paginacion.
- registrar checkpoint por lote; retry por lote e idempotencia.
- filtrar outputs materializados por `_processExecutionId` y `taskRef` o equivalente.
- en REST: throttle, timeout, retry e idempotency key.
- en SP/FN: preferir ejecucion set-based por lote (`processExecutionId`, `batchNumber`,
  `fromId`, `toId`) antes que una llamada por registro.

### Componentes esperados

- Backend: `TaskInputResolver` (resuelve `input`/`inputs`), `TaskOutputRegistry` (registra
  outputs publicados), `TaskBatchCursor` (lee outputs masivos por lote),
  `TaskBatchCheckpointService` (estado/retry por lote) y validadores de grafo (ciclos, tareas
  futuras, outputs inexistentes, compatibilidad de modo).
- Frontend: selector de origen de datos por tarea, selector `executionMode`, editor de
  `batchSize`/retry/checkpoint (`process-task-runtime-panel`), mapping board comun y
  visualizacion de `taskRef`/dependencias.

### Migracion obligatoria

Procesos sin `taskRef`, `executionMode` ni `input` explicito para tareas `batch`/`per-record`
deben migrarse. El motor no resuelve datos desde el reader original como fallback implicito
para tareas posteriores.

## Consideraciones tecnicas

- las tareas `DB_WRITE`, `DB_EXECUTE_SP`, `DB_EXECUTE_FN`, `REST_CALL` y `NOTIFICATION` deben publicar salidas consistentes
- el runtime debe mantener `executionVariables` y variables tecnicas
- el scheduler no debe generar duplicados por reinicio o failover no controlado

## Pruebas tecnicas sugeridas

- ejecucion manual end-to-end
- ejecucion programada
- reproceso y linaje de ejecuciones
- cobertura de salidas dinamicas entre tareas
