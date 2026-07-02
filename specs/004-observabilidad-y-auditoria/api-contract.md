# API Contract - Observabilidad y auditoria

> Contrato reconstruido por reingenieria desde los recursos de consulta de
> `platform-app`. Se ensambla en `contracts/api/openapi.yaml` con
> `npm run generate:openapi`.

## Endpoints

### GET /api/query/process-executions
**Trace**: `RF-001` · **Auth**: platform-admin, integration-admin, operator, auditor · Consulta paginada de ejecuciones.

### GET /api/query/process-executions/{processExecutionId}/tasks
**Trace**: `RF-002` · **Auth**: roles de lectura · Detalle de tareas/archivos de una ejecucion.

### GET /api/query/process-executions/{processExecutionId}/children
**Trace**: `RF-003` · **Auth**: roles de lectura · Ejecuciones relacionadas.

### GET /api/query/overview-summary
**Trace**: `RF-004` · **Auth**: roles de lectura · Resumen operativo.

### GET /api/query/audit-events
**Trace**: `RF-005` · **Auth**: roles de lectura · Eventos de auditoria correlacionados por `processExecutionId`.

### GET /api/query/record-lineage
**Trace**: `RF-007` · **Auth**: roles de lectura · Linea E2E por `recordId`, `traceId`, archivo/fila o clave operacional.

### GET /api/query/audit-spool/summary
**Trace**: `RF-008` · **Auth**: roles de lectura · Conteos `PENDING`/`IN_FLIGHT`/`SENT`/`DEAD` y pendiente mas antiguo.

### GET /api/query/audit-spool/dead
**Trace**: `RF-008` · **Auth**: roles de lectura · Lista eventos `DEAD` con intentos, lock y error.

### POST /api/query/audit-spool/{id}/retry
**Trace**: `RF-008` · **Auth**: platform-admin, integration-admin · Reenvia un evento `DEAD` a `PENDING`.

### DELETE /api/query/audit-spool/sent
**Trace**: `RF-008` · **Auth**: platform-admin, integration-admin · Limpia eventos `SENT` por retencion y limite.

### GET /api/query/mt101-fragments/source-row
**Trace**: `RF-009` · **Auth**: roles de lectura · Ubica fragmentos MT101 por fila origen/rango.

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
      summary: Ejecuciones relacionadas
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
  /api/query/record-lineage:
    get:
      summary: Trazabilidad E2E por registro
      operationId: recordLineage
      responses:
        '200':
          description: OK
  /api/query/audit-spool/summary:
    get:
      summary: Resumen del spool asincronico de auditoria
      operationId: auditSpoolSummary
      responses:
        '200':
          description: OK
  /api/query/audit-spool/dead:
    get:
      summary: Eventos DEAD del spool de auditoria
      operationId: auditSpoolDead
      responses:
        '200':
          description: OK
  /api/query/audit-spool/{id}/retry:
    post:
      summary: Reprocesa un evento DEAD
      operationId: retryAuditSpoolEvent
      responses:
        '204':
          description: No Content
  /api/query/audit-spool/sent:
    delete:
      summary: Limpia eventos SENT del spool
      operationId: cleanupAuditSpoolSent
      responses:
        '200':
          description: OK
  /api/query/mt101-fragments/source-row:
    get:
      summary: Fragmentos MT101 por fila origen
      operationId: mt101FragmentsBySourceRow
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
    AuditSpoolSummary:
      type: object
      properties:
        pending:
          type: integer
        inFlight:
          type: integer
        sent:
          type: integer
        dead:
          type: integer
        oldestPendingCreatedAt:
          type: string
          format: date-time
    AuditSpoolEntry:
      type: object
      properties:
        id:
          type: integer
          format: int64
        eventId:
          type: string
        traceId:
          type: string
        spoolStatus:
          type: string
        attempts:
          type: integer
        deadReason:
          type: string
    Mt101FragmentLink:
      type: object
      properties:
        fragmentSetId:
          type: string
        processExecutionId:
          type: integer
          format: int64
        sourceTable:
          type: string
        sourceRowFrom:
          type: integer
          format: int64
        sourceRowTo:
          type: integer
          format: int64
        sendersReference:
          type: string
        status:
          type: string
```
