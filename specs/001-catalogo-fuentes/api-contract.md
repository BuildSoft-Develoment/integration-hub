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

### GET /api/source-types
**Trace**: `RF-001` · **Auth**: platform-admin, integration-admin, auditor · Lista el catalogo de source types locales y aportados por plugins con type, origin, provider, pluginId, pluginVersion, transport, status y reason, espejo de reader-types, para poblar el selector de tipos de fuente y marcar los no confiables.

### GET /api/secret-sources
**Trace**: `QA-006`, ADR-031 D1 · **Auth**: platform-admin, integration-admin, auditor · Declara que fuentes de secreto resuelve ESTE despliegue (`vaultkv`, `config`, `env`...), para que la interfaz deje de recomendar un prefijo que aqui no existe. En la VM un `${secret:...}` falla en ejecucion porque no hay file-vault, y hoy nada lo detecta antes de que reviente.

> **Vive aqui de forma provisional.** El endpoint sirve tambien a conexiones y tareas (ADR-031 D6). Cuando exista la feature de referencias de secreto, se mueve alli.

### GET /api/secret-sources/{source}/entries
**Trace**: `QA-006`, ADR-031 D3, D4, D5 · **Auth**: platform-admin, integration-admin · Enumera los secretos que existen en una fuente: **rutas y nombres de campo, jamas valores**. Es lo que permite ofrecer la clave en un desplegable en vez de escribirla de memoria.

Los nombres de campo se leen por `secret/subkeys` y nunca por `secret/data` (D4): por `subkeys` OpenBao devuelve el arbol de claves con los valores a `null`, asi que el backend no llega a tener el secreto en memoria. `complete: false` avisa de que el recorrido se corto por sus topes — una lista recortada y una completa se ven igual desde la pantalla.

RBAC **mas estrecho que el del catalogo**: sin `auditor`. Una ruta no es un secreto, pero `connections/banco-XXX/sftp` dice con quien operas y cuantos son, asi que pide el mismo permiso que editar conexiones. Una fuente inexistente, no disponible o no enumerable responden las tres lo mismo — lista vacia —, para no convertir la ruta en un detector de que proveedores tiene montados la maquina.

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
  /api/source-types:
    get:
      summary: Lista el catalogo de source types locales y aportados por plugins con type, origin, provider, pluginId, plugin
      operationId: listSourceTypes
      responses:
        '200':
          description: OK
  /api/secret-sources:
    get:
      summary: Declara que fuentes de secreto resuelve este despliegue, y cuales pueden enumerarse
      operationId: listSecretSources
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                required: [sources]
                properties:
                  sources:
                    type: array
                    items:
                      type: object
                      required: [source, enumerable]
                      properties:
                        source:
                          type: string
                          example: vaultkv
                        enumerable:
                          type: boolean
  /api/secret-sources/{source}/entries:
    get:
      summary: Enumera los secretos de una fuente (rutas y nombres de campo, jamas valores)
      operationId: listSecretEntries
      parameters:
        - name: source
          in: path
          required: true
          schema:
            type: string
          example: vaultkv
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                required: [source, entries, complete]
                properties:
                  source:
                    type: string
                    example: vaultkv
                  entries:
                    type: array
                    items:
                      type: object
                      required: [path, fields]
                      properties:
                        path:
                          type: string
                          example: connections/db/ih-internal
                        fields:
                          type: array
                          items:
                            type: string
                          example: [username, password]
                  complete:
                    type: boolean
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
