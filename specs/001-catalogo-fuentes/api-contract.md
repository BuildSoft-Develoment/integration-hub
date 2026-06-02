# API Contract - Catalogo de fuentes

> Contrato reconstruido por reingenieria desde las clases `@Path` reales de
> `platform-app` (`SourceDefinitionResource`). Fuente de las rutas: codigo en
> produccion. Se ensambla en `contracts/api/openapi.yaml` con
> `npm run generate:openapi`.

## Endpoints

### GET /api/source-definitions
**Trace**: `RF-001` · **Auth**: requerido (platform-admin, integration-admin, auditor) · Lista las fuentes.

### POST /api/source-definitions
**Trace**: `RF-001`, `RF-003`, `RF-004` · **Auth**: platform-admin, integration-admin · Crea una fuente (valida `configurationJson` y referencias `${secret:...}`).

### POST /api/source-definitions/test
**Trace**: `RF-005` · **Auth**: platform-admin, integration-admin · Prueba la conectividad/lectura de una fuente.

### PUT /api/source-definitions/{sourceDefinitionId}
**Trace**: `RF-002` · **Auth**: platform-admin, integration-admin · Actualiza una fuente.

### POST /api/source-definitions/{sourceDefinitionId}/activation/{active}
**Trace**: `RF-002` · **Auth**: platform-admin, integration-admin · Activa o desactiva una fuente.

## Paths OpenAPI

```yaml
paths:
  /api/source-definitions:
    get:
      summary: Lista las fuentes configuradas
      operationId: listSourceDefinitions
      responses:
        '200':
          description: OK
    post:
      summary: Crea una fuente
      operationId: createSourceDefinition
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SourceDefinition'
      responses:
        '200':
          description: OK
  /api/source-definitions/test:
    post:
      summary: Prueba una fuente
      operationId: testSourceDefinition
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SourceDefinition'
      responses:
        '200':
          description: OK
  /api/source-definitions/{sourceDefinitionId}:
    put:
      summary: Actualiza una fuente
      operationId: updateSourceDefinition
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SourceDefinition'
      responses:
        '200':
          description: OK
  /api/source-definitions/{sourceDefinitionId}/activation/{active}:
    post:
      summary: Activa o desactiva una fuente
      operationId: setSourceDefinitionActive
      requestBody:
        required: false
        description: Sin cuerpo; el estado se indica en la ruta ({active}). Se referencia el recurso afectado por completitud del contrato.
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SourceDefinition'
      responses:
        '200':
          description: OK
  /api/query/source-definitions:
    get:
      summary: Lista (query) las fuentes con filtros (q, type, status) y paginacion
      operationId: querySourceDefinitions
      responses:
        '200':
          description: OK
```

## Schema OpenAPI

```yaml
components:
  schemas:
    SourceDefinition:
      type: object
      required: [id, name, sourceType]
      properties:
        id:
          type: integer
          format: int64
        name:
          type: string
        sourceType:
          type: string
        active:
          type: boolean
        configurationJson:
          type: string
```

## Correlacion
La correlacion operativa se realiza por `processExecutionId` en ejecuciones y auditoria.
