# API Contract - Programacion de procesos

> Contrato reconstruido por reingenieria desde `ProcessScheduleResource` de `platform-app`.
> La configuracion de la programacion (`scheduled`/`schedule_every`) se hace via
> `/api/process-definitions` (feature 003). Se ensambla en `contracts/api/openapi.yaml` con
> `npm run generate:openapi`.

## Endpoints

### GET /api/process-schedules
**Trace**: `RF-003` · **Auth**: platform-admin, integration-admin, operator, auditor · Lista las programaciones vigentes (procesos programados, proximo y ultimo disparo).

### POST /api/process-definitions
**Trace**: `RF-001` · **Auth**: platform-admin, integration-admin · Configura `scheduled`/`schedule_every` en la definicion del proceso (endpoint de la feature 003).

## Paths OpenAPI

```yaml
paths:
  /api/process-schedules:
    get:
      summary: Lista las programaciones de proceso vigentes
      operationId: listProcessSchedules
      responses:
        '200':
          description: OK
```

## Schema OpenAPI

```yaml
components:
  schemas:
    ProcessSchedule:
      type: object
      required: [processDefinitionId, scheduled]
      properties:
        processDefinitionId:
          type: integer
          format: int64
        scheduled:
          type: boolean
        scheduleEvery:
          type: string
        nextRunAt:
          type: string
          format: date-time
        lastRunAt:
          type: string
          format: date-time
```
