# API Contract - Catalogo de conexiones

> Contrato reconstruido por reingenieria desde `ConnectionDefinitionResource` de
> `platform-app`. Se ensambla en `contracts/api/openapi.yaml` con `npm run generate:openapi`.

## Endpoints

### GET /api/connection-definitions
**Trace**: `RF-001` · **Auth**: platform-admin, integration-admin, auditor · Lista conexiones.

### POST /api/connection-definitions
**Trace**: `RF-001`, `RF-003` · **Auth**: platform-admin, integration-admin · Crea una conexion.

### POST /api/connection-definitions/test
**Trace**: `RF-002` · **Auth**: platform-admin, integration-admin · Prueba la conectividad.

### PUT /api/connection-definitions/{connectionDefinitionId}
**Trace**: `RF-001` · **Auth**: platform-admin, integration-admin · Actualiza una conexion.

### POST /api/connection-definitions/{connectionDefinitionId}/activation/{active}
**Trace**: `RF-002` · **Auth**: platform-admin, integration-admin · Activa o desactiva.

### GET /api/connection-definitions/{connectionDefinitionId}/jdbc-metadata/tables
**Trace**: `RF-004` · **Auth**: roles de lectura · Tablas del esquema (introspeccion).

### GET /api/connection-definitions/{connectionDefinitionId}/jdbc-metadata/procedures
**Trace**: `RF-005` · **Auth**: roles de lectura · Procedimientos disponibles (no MONGODB).

## Paths OpenAPI

```yaml
paths:
  /api/connection-definitions:
    get:
      summary: Lista las conexiones configuradas
      operationId: listConnectionDefinitions
      responses:
        '200':
          description: OK
    post:
      summary: Crea una conexion
      operationId: createConnectionDefinition
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ConnectionDefinition'
      responses:
        '200':
          description: OK
  /api/connection-definitions/test:
    post:
      summary: Prueba la conectividad de una conexion
      operationId: testConnectionDefinition
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ConnectionDefinition'
      responses:
        '200':
          description: OK
  /api/connection-definitions/{connectionDefinitionId}:
    put:
      summary: Actualiza una conexion
      operationId: updateConnectionDefinition
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ConnectionDefinition'
      responses:
        '200':
          description: OK
  /api/connection-definitions/{connectionDefinitionId}/activation/{active}:
    post:
      summary: Activa o desactiva una conexion
      operationId: setConnectionDefinitionActive
      requestBody:
        required: false
        description: Sin cuerpo; el estado se indica en la ruta ({active}).
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ConnectionDefinition'
      responses:
        '200':
          description: OK
  /api/connection-definitions/{connectionDefinitionId}/jdbc-metadata/tables:
    get:
      summary: Lista tablas (introspeccion JDBC)
      operationId: listConnectionTables
      responses:
        '200':
          description: OK
  /api/connection-definitions/{connectionDefinitionId}/jdbc-metadata/procedures:
    get:
      summary: Lista procedimientos (introspeccion JDBC)
      operationId: listConnectionProcedures
      responses:
        '200':
          description: OK
```

## Schema OpenAPI

```yaml
components:
  schemas:
    ConnectionDefinition:
      type: object
      required: [id, name, connectionType]
      properties:
        id:
          type: integer
          format: int64
        name:
          type: string
        connectionType:
          type: string
        active:
          type: boolean
        configurationJson:
          type: string
```
