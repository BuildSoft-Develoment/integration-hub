# API Contract - Catalogo de readers

> Contrato reconstruido por reingenieria desde `ReaderDefinitionResource` de
> `platform-app`. Se ensambla en `contracts/api/openapi.yaml` con
> `npm run generate:openapi`.

## Endpoints

### GET /api/reader-definitions
**Trace**: `RF-005` · **Auth**: platform-admin, integration-admin, auditor · Lista readers (disponibles para el disenador de procesos).

### POST /api/reader-definitions
**Trace**: `RF-001`, `RF-002`, `RF-003` · **Auth**: platform-admin, integration-admin · Crea un reader (valida layout por formato).

### PUT /api/reader-definitions/{readerDefinitionId}
**Trace**: `RF-002` · **Auth**: platform-admin, integration-admin · Actualiza un reader.

### POST /api/reader-definitions/{readerDefinitionId}/activation/{active}
**Trace**: `RF-004` · **Auth**: platform-admin, integration-admin · Activa o desactiva un reader.

## Paths OpenAPI

```yaml
paths:
  /api/reader-definitions:
    get:
      summary: Lista los readers configurados
      operationId: listReaderDefinitions
      responses:
        '200':
          description: OK
    post:
      summary: Crea un reader
      operationId: createReaderDefinition
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ReaderDefinition'
      responses:
        '200':
          description: OK
  /api/reader-definitions/{readerDefinitionId}:
    put:
      summary: Actualiza un reader
      operationId: updateReaderDefinition
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ReaderDefinition'
      responses:
        '200':
          description: OK
  /api/reader-definitions/{readerDefinitionId}/activation/{active}:
    post:
      summary: Activa o desactiva un reader
      operationId: setReaderDefinitionActive
      requestBody:
        required: false
        description: Sin cuerpo; el estado se indica en la ruta ({active}). Se referencia el recurso afectado por completitud del contrato.
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ReaderDefinition'
      responses:
        '200':
          description: OK
```

## Schema OpenAPI

```yaml
components:
  schemas:
    ReaderDefinition:
      type: object
      required: [id, name, readerType]
      properties:
        id:
          type: integer
          format: int64
        name:
          type: string
        readerType:
          type: string
        active:
          type: boolean
        configurationJson:
          type: string
```
