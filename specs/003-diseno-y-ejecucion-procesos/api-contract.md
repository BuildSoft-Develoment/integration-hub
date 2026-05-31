# API Contract - Diseno y ejecucion de procesos

> Contrato reconstruido por reingenieria desde `ProcessDefinitionResource` (y la
> consulta de ejecuciones en `ExecutionQueryResource`) de `platform-app`. Se
> ensambla en `contracts/api/openapi.yaml` con `npm run generate:openapi`.

## Endpoints

### GET /api/process-definitions
**Trace**: `RF-001` · **Auth**: platform-admin, integration-admin, operator, auditor · Lista procesos.

### POST /api/process-definitions
**Trace**: `RF-001`, `RF-002`, `RF-004` · **Auth**: platform-admin, integration-admin · Crea/define un proceso con tareas ordenadas; dispara ejecucion manual/programada.

### PUT /api/process-definitions/{processDefinitionId}
**Trace**: `RF-001` · **Auth**: platform-admin, integration-admin · Actualiza la definicion del proceso.

### POST /api/process-definitions/{processDefinitionId}/activation/{active}
**Trace**: `RF-003` · **Auth**: platform-admin, integration-admin · Activa o desactiva un proceso (solo activos son ejecutables).

### GET /api/query/process-executions
**Trace**: `RF-005` · **Auth**: platform-admin, integration-admin, operator, auditor · Lista ejecuciones (linaje/reproceso).

## Paths OpenAPI

```yaml
paths:
  /api/process-definitions:
    get:
      summary: Lista los procesos definidos
      operationId: listProcessDefinitions
      responses:
        '200':
          description: OK
    post:
      summary: Crea un proceso
      operationId: createProcessDefinition
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProcessDefinition'
      responses:
        '200':
          description: OK
  /api/process-definitions/{processDefinitionId}:
    put:
      summary: Actualiza un proceso
      operationId: updateProcessDefinition
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProcessDefinition'
      responses:
        '200':
          description: OK
  /api/process-definitions/{processDefinitionId}/activation/{active}:
    post:
      summary: Activa o desactiva un proceso
      operationId: setProcessDefinitionActive
      requestBody:
        required: false
        description: Sin cuerpo; el estado se indica en la ruta ({active}). Se referencia el recurso afectado por completitud del contrato.
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProcessDefinition'
      responses:
        '200':
          description: OK
```

## Schema OpenAPI

```yaml
components:
  schemas:
    ProcessDefinition:
      type: object
      required: [id, name]
      properties:
        id:
          type: integer
          format: int64
        name:
          type: string
        description:
          type: string
        active:
          type: boolean
```
