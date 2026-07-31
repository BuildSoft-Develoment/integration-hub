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

### GET /api/query/tasks-dlq/summary
**Trace**: `RF-006` · **Auth**: platform-admin, integration-admin, operator, payments-operator, auditor · Contadores de la DLQ del backbone async (ADR-015): filas DEAD del outbox de despacho de tareas y filas DEAD y POISON del inbox del consumer.

### GET /api/query/tasks-dlq/dead
**Trace**: `RF-006` · **Auth**: platform-admin, integration-admin, operator, payments-operator, auditor · Lista las filas muertas del inbox del consumer (DEAD/POISON), mas recientes primero y hasta `limit` (default 100), con idempotencyKey, taskType, processExecutionId, taskDefinitionId y el error que las mato.

### GET /api/query/tasks-dlq/stalled
**Trace**: `RF-006` · **Auth**: platform-admin, integration-admin, operator, payments-operator, auditor · Lista scatters en streaming estancados (sin progreso por mas de `minutes`, default 5) con slices completadas/fallidas, ultima pagina despachada y ultimo progreso: son los candidatos a re-inyeccion de la cadena de paginas.

### POST /api/query/tasks-dlq/outbox/redrive
**Trace**: `RF-006` · **Auth**: platform-admin, integration-admin · Reencola trabajo async muerto: pasa hasta `limit` filas DEAD del outbox de despacho a PENDING para que el relay reintente publicarlas al broker, y devuelve cuantas reencolo; el reintento cubre cualquier tarea despachada con async:true, incluidas las de pago MT101, y la seguridad depende de la idempotencia aguas abajo por idempotencyKey.

### POST /api/query/tasks-dlq/suspensions/{processExecutionId}/{taskDefinitionId}/requeue
**Trace**: `RF-006` · **Auth**: platform-admin, integration-admin · Reencola el work-item de una tarea async todavia suspendida: reconstruye el envelope desde la configuracion de la tarea (con los ${secret:} sin resolver), borra el dedup de outbox e inbox por idempotencyKey y lo encola; si la tarea es un scatter en streaming re-inyecta su ultima pagina para que la cadena reanude, y responde requeued=false si no hay suspension activa o si el scatter es materializado. Reejecuta trabajo real, de pago incluido si la tarea suspendida es MT101_PAY.

### DELETE /api/query/audit-spool/dead-letters
**Trace**: `RF-008` · **Auth**: platform-admin, integration-admin · Purga por retencion los poison messages persistidos por el consumer en `audit_dead_letter_event`: borra los mas viejos que `retentionDays` (default 30) hasta `limit` filas (default 10000, tope 100000) y devuelve cuantas elimino; no toca los DEAD del relay, que se conservan aparte.

### GET /api/messaging/transports
**Trace**: `RF-006` · **Auth**: integration-admin, platform-admin, operator · Devuelve los tipos de broker registrados en el MessageBrokerRegistry (Kafka por defecto, JMS/RabbitMQ/Redis si estan), que alimentan el selector de transporte async del disenador de tareas.

### GET /api/messaging/async-status
**Trace**: `RF-006` · **Auth**: integration-admin, platform-admin, operator · Estado compuesto de disponibilidad del despacho async (DISABLED/DEGRADED/READY) con los flags que lo derivan: offload de ejecucion, relay outbox-broker, consumer habilitado, readiness EN VIVO de los canales tasks-in y audit-out, y si hay broker registrado; la UI lo usa para avisar que async:true no correria end-to-end.

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
  /api/query/tasks-dlq/summary:
    get:
      summary: Contadores de la DLQ del backbone async (ADR-015): filas DEAD del outbox de despacho de tareas y filas DEAD y 
      operationId: tasksDlqSummary
      responses:
        '200':
          description: OK
  /api/query/tasks-dlq/dead:
    get:
      summary: Lista las filas muertas del inbox del consumer (DEAD/POISON), mas recientes primero y hasta `limit` (default 1
      operationId: tasksDlqDead
      responses:
        '200':
          description: OK
  /api/query/tasks-dlq/stalled:
    get:
      summary: Lista scatters en streaming estancados (sin progreso por mas de `minutes`, default 5) con slices completadas/f
      operationId: tasksDlqStalled
      responses:
        '200':
          description: OK
  /api/query/tasks-dlq/outbox/redrive:
    post:
      summary: Reencola trabajo async muerto: pasa hasta `limit` filas DEAD del outbox de despacho a PENDING para que el rela
      operationId: redriveTasksDlqOutbox
      responses:
        '200':
          description: OK
  /api/query/tasks-dlq/suspensions/{processExecutionId}/{taskDefinitionId}/requeue:
    post:
      summary: Reencola el work-item de una tarea async todavia suspendida: reconstruye el envelope desde la configuracion de
      operationId: requeueTasksDlqSuspension
      responses:
        '200':
          description: OK
  /api/query/audit-spool/dead-letters:
    delete:
      summary: Purga por retencion los poison messages persistidos por el consumer en `audit_dead_letter_event`: borra los ma
      operationId: cleanupAuditSpoolDeadLetters
      responses:
        '200':
          description: OK
  /api/messaging/transports:
    get:
      summary: Devuelve los tipos de broker registrados en el MessageBrokerRegistry (Kafka por defecto, JMS/RabbitMQ/Redis si
      operationId: messagingTransports
      responses:
        '200':
          description: OK
  /api/messaging/async-status:
    get:
      summary: Estado compuesto de disponibilidad del despacho async (DISABLED/DEGRADED/READY) con los flags que lo derivan: 
      operationId: messagingAsyncStatus
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
