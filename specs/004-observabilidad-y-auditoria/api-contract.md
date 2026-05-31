# API Contract - Observabilidad y auditoria

> Contrato reconstruido por reingenieria desde `ExecutionQueryResource` de
> `platform-app`. Se ensambla en `contracts/api/openapi.yaml` con
> `npm run generate:openapi`.

## Endpoints

### GET /api/query/process-executions
**Trace**: `RF-001` · **Auth**: platform-admin, integration-admin, operator, auditor · Consulta paginada de ejecuciones (filtros por estado/proceso/texto).

### GET /api/query/process-executions/{processExecutionId}/tasks
**Trace**: `RF-002` · **Auth**: roles de lectura · Detalle de tareas/archivos de una ejecucion.

### GET /api/query/process-executions/{processExecutionId}/children
**Trace**: `RF-003` · **Auth**: roles de lectura · Ejecuciones relacionadas (linaje de reproceso).

### GET /api/query/overview-summary
**Trace**: `RF-004` · **Auth**: roles de lectura · Resumen operativo.

### GET /api/query/audit-events
**Trace**: `RF-005` · **Auth**: roles de lectura · Eventos de auditoria correlacionados por `processExecutionId`.

## Paths OpenAPI

```yaml
paths:
  /api/query/overview-summary:
    get:
      summary: Resumen operativo
      operationId: overviewSummary
      responses:
        '200':
          description: OK
  /api/query/process-executions:
    get:
      summary: Lista ejecuciones de proceso
      operationId: listProcessExecutions
      responses:
        '200':
          description: OK
  /api/query/process-executions/{processExecutionId}:
    get:
      summary: Detalle de una ejecucion
      operationId: getProcessExecution
      responses:
        '200':
          description: OK
  /api/query/process-executions/{processExecutionId}/children:
    get:
      summary: Ejecuciones relacionadas (linaje)
      operationId: listProcessExecutionChildren
      responses:
        '200':
          description: OK
  /api/query/process-executions/{processExecutionId}/tasks:
    get:
      summary: Tareas de una ejecucion
      operationId: listProcessExecutionTasks
      responses:
        '200':
          description: OK
  /api/query/audit-events:
    get:
      summary: Lista eventos de auditoria
      operationId: listAuditEvents
      responses:
        '200':
          description: OK
```

## Schema OpenAPI

```yaml
components:
  schemas:
    ProcessExecution:
      type: object
      required: [id, status]
      properties:
        id:
          type: integer
          format: int64
        status:
          type: string
        startedAt:
          type: string
          format: date-time
        finishedAt:
          type: string
          format: date-time
    AuditEvent:
      type: object
      required: [id, eventType]
      properties:
        id:
          type: integer
          format: int64
        eventType:
          type: string
        status:
          type: string
        createdAt:
          type: string
          format: date-time
```
