# Trazabilidad arquitectonica

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Fase 3 - Arquitectura](../README.md)
- Siguiente: [Indice docs](../../README.md)
<!-- nav-guided:end -->

## Objetivo

Relacionar casos de uso principales con frontend, backend, servicios y persistencia asociados.

## Matriz

| Caso de uso | Frontend | Backend/API | Servicios principales | Persistencia |
| --- | --- | --- | --- | --- |
| UC-01 Configurar fuente | `sources` | `SourceDefinitionResource` | `SourceCatalogService` | `SourceDefinitionRepository`, `PostgreSQL` |
| UC-02 Configurar reader | `readers` | `ReaderDefinitionResource` | `ReaderCatalogService` | `ReaderDefinitionRepository`, `PostgreSQL` |
| UC-09 Configurar conexion | `connections` | `ConnectionDefinitionResource` | `ConnectionCatalogService`, `ConnectionMetadataService` | `ConnectionDefinitionRepository`, `PostgreSQL` |
| UC-03 Disenar proceso | `processes` | `ProcessDefinitionResource` | `ProcessCatalogService` | `ProcessDefinitionRepository`, `ProcessTaskDefinitionRepository`, `PostgreSQL` |
| UC-04 Ejecutar proceso manualmente | `executions` | `ProcessExecutionResource` | `ProcessExecutionService`, `Process Engine`, `ProcessedSourceFileService` | `ProcessExecutionRepository`, `ProcessTaskExecutionRepository`, `AuditEventRepository`, `ProcessedSourceFileRepository` |
| UC-05 Ejecutar proceso programado | `schedules` | `ProcessSchedulerService` | `ProcessExecutionService`, `Process Engine`, `AuditService`, `ProcessedSourceFileService` | `ProcessDefinitionRepository`, `ProcessExecutionRepository`, `ProcessTaskExecutionRepository`, `AuditEventRepository`, `ProcessedSourceFileRepository` |
| UC-06 Consultar ejecuciones | `executions` | `ExecutionQueryResource` | `ExecutionQueryService` | `ProcessExecutionRepository`, `ProcessTaskExecutionRepository`, `ProcessedSourceFileRepository` |
| UC-07 Consultar auditoria | `audit` | `ExecutionQueryResource` | `ExecutionQueryService`, `AuditService` | `AuditEventRepository`, `ProcessedSourceFileRepository` |
| UC-08 Administrar acceso | `frontend` protegido | recursos protegidos | `Keycloak` | `Keycloak` |
| UC-09 Operacion por ambiente | `overview`, `executions`, `audit` | health, metrics y runtime | despliegue y operacion | `PostgreSQL`, `Keycloak`, observabilidad |

## Notas de trazabilidad

- `FILE_READ` depende de `sourceDefinition` y `readerDefinition`
- `DB_WRITE`, `DB_EXECUTE_SP`, `DB_EXECUTE_FN`, `REST_CALL` y `NOTIFICATION` se resuelven dentro del `Process Engine`
- las tareas DB (`DB_WRITE`/`DB_EXECUTE_SP`/`DB_EXECUTE_FN`) requieren una `connectionDefinition` activa; su metadata JDBC se introspecciona con `ConnectionMetadataService`
- la programacion (`scheduled`/`schedule_every`/`next_run_at`/`last_run_at`) es atributo de `process_definition`; `ProcessSchedulerService` dispara con `trigger_source = scheduler`
- la capa de aplicacion sigue el flujo `api -> service -> repository -> entity/db`
- la auditoria funcional y tecnica se correlaciona por `processExecutionId`
- la trazabilidad multiarchivo se persiste en `processed_source_file` y se expone en `executions` y `audit`
- el linaje de reproceso se registra mediante `source_execution_id` y `trigger_source`
- `overview` consume `GET /api/query/overview-summary` como resumen operativo agregado
