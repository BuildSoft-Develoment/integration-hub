# TRACEABILITY

## Objetivo

Relacionar casos de uso, componentes principales y persistencia asociada.

## Matriz

| Caso de uso | Frontend | Backend/API | Servicios principales | Persistencia |
| --- | --- | --- | --- | --- |
| UC-01 Configurar fuente | `Process Designer` | `SourceDefinitionResource` | `SourceCatalogService` | `SourceDefinitionRepository`, `PostgreSQL` |
| UC-02 Configurar reader | `Process Designer` | `ReaderDefinitionResource` | `ReaderCatalogService` | `ReaderDefinitionRepository`, `PostgreSQL` |
| UC-03 Disenar proceso | `Process Designer` | `ProcessDefinitionResource` | `ProcessCatalogService` | `ProcessDefinitionRepository`, `ProcessTaskDefinitionRepository`, `PostgreSQL` |
| UC-04 Ejecutar proceso manualmente | `Operations Console` | `ProcessExecutionResource` | `ProcessExecutionService`, `Process Engine`, `ProcessedSourceFileService` | `ProcessExecutionRepository`, `ProcessTaskExecutionRepository`, `AuditEventRepository`, `ProcessedSourceFileRepository`, `PostgreSQL` |
| UC-05 Ejecutar proceso programado | n/a | `ProcessSchedulerService` | `ProcessExecutionService`, `Process Engine`, `AuditService`, `ProcessedSourceFileService` | `ProcessDefinitionRepository`, `ProcessExecutionRepository`, `ProcessTaskExecutionRepository`, `AuditEventRepository`, `ProcessedSourceFileRepository`, `PostgreSQL` |
| UC-06 Consultar ejecuciones | `Operations Console` | `ExecutionQueryResource` | `ExecutionQueryService` | `ProcessExecutionRepository`, `ProcessTaskExecutionRepository`, `ProcessedSourceFileRepository`, `PostgreSQL` |
| UC-07 Consultar auditoria | `Operations Console` | `ExecutionQueryResource` | `ExecutionQueryService`, `AuditService` | `AuditEventRepository`, `ProcessedSourceFileRepository`, `PostgreSQL` |
| UC-09 Administrar acceso | `OIDC Client` | recursos protegidos | `Keycloak` | `Keycloak` |
| UC-10 Operacion on-prem | n/a | n/a | despliegue y operacion | `PostgreSQL`, `Keycloak` |

## Notas

- `FILE_READ` depende de `sourceDefinition` y `readerDefinition`
- `DB_WRITE`, `DB_EXECUTE_SP`, `DB_EXECUTE_FN`, `REST_CALL` y `NOTIFICATION` se resuelven dentro del `Process Engine`
- la capa de aplicacion sigue el flujo `api -> service -> repository -> entity/db`
- la auditoria funcional y tecnica se correlaciona por `processExecutionId`

- la trazabilidad multiarchivo se persiste en `processed_source_file` y se expone en `executions` y `audit` como datos estructurados por archivo
- los readers `TXT` y `CSV` procesan en streaming por linea; `XLSX` usa SAX streaming y `XLS` usa Apache POI EventUserModel para reducir consumo de memoria

- el linaje de reproceso se registra en `process_execution` mediante `source_execution_id` y `trigger_source`, de modo que una nueva corrida puede vincularse con su ejecucion origen

- el frontend puede abrir una ejecucion especifica mediante `GET /api/query/process-executions/{id}` y usarla como destino de navegacion desde `executions` y `audit`

- el frontend consulta `GET /api/query/process-executions/{id}/children` para listar ejecuciones hijas/reintentos nacidos desde una ejecucion original

- `DB_EXECUTE_SP` se implementa como provider independiente y consume parametros desde `executionVariables`, outputs de tareas anteriores, variables tecnicas del runtime y constantes declaradas en la configuracion de la tarea. Sus parametros `OUT/INOUT` se propagan al contexto para tareas posteriores
- los nombres de salida de `DB_EXECUTE_SP` siguen siendo dinamicos y dependen de la configuracion del task; el runtime solo normaliza prefijos tecnicos del motor, por ejemplo `@resultado1` en SQL Server se publica como `resultado1` para no acoplar tareas posteriores al dialecto JDBC
- la compatibilidad de DB_EXECUTE_SP quedo validada con tests de integracion sobre PostgreSQL, MySQL, SQL Server y Oracle
- `DB_EXECUTE_FN` se implementa como provider independiente de `DB_EXECUTE_SP`, con configuracion, runtime y dialectos separados. Resuelve parametros `IN`, ejecuta la funcion y publica la primera fila devuelta como outputs dinamicos para las tareas siguientes
- la compatibilidad de DB_EXECUTE_FN quedo validada con tests de integracion sobre PostgreSQL, MySQL, SQL Server y Oracle

- el endpoint `GET /api/query/overview-summary` consolida metricas de ejecucion, reproceso y salud de archivos para la vista `overview`
