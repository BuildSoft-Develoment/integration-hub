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

### GET /api/plugins
**Trace**: `RF-002` · **Auth**: platform-admin, integration-admin, auditor · Diagnostico del catalogo de plugins backend: descriptores activos con sus tipos de tarea/fuente/reader aportados, transporte, trusted y estado (ACTIVE/UNTRUSTED/DEGRADED), mas todas las versiones instaladas y el mapa de degradados con su motivo.

### GET /api/plugins/canary/metrics
**Trace**: `RF-005` · **Auth**: platform-admin, integration-admin, auditor · Evalua cada version instalada contra la ventana canary (muestras, fallos, failureRatio, umbrales min-samples/max-failure-ratio, promotable, blockReason y serie de tendencia en 12 buckets) sin lanzar; es el tablero del gate de promocion.

### POST /api/plugins/reload
**Trace**: `RF-002` · **Auth**: platform-admin, integration-admin · Recarga en memoria el catalogo de plugins instalados desde la BD (revalida trust policy y reindexa los tipos por plugin) y devuelve el diagnostico resultante.

### POST /api/plugins/install
**Trace**: `RF-002` · **Auth**: platform-admin, integration-admin · Instala declarativamente un plugin backend (id, version, spiVersion, providedTypes/SourceTypes/ReaderTypes, transporte, endpoint, integrity/signature, canal, pin y configSchemas): valida la trust policy, persiste descriptor y version, y si viene active exige pasar el gate de promocion canary antes de activarlo.

### POST /api/plugins/marketplace/install
**Trace**: `RF-002` · **Auth**: platform-admin, integration-admin · Resuelve un plugin desde un catalogo marketplace remoto (catalogUrl + pluginId, con pinnedVersion/channel) y lo instala con el mismo camino que la instalacion declarativa, incluyendo trust policy y gate de promocion si se pide activo.

### POST /api/plugins/marketplace/preview
**Trace**: `RF-002` · **Auth**: platform-admin, integration-admin · Dry-run del alta desde marketplace: baja la entrada del catalogo remoto, valida la trust policy y devuelve el descriptor que quedaria instalado, sin persistir nada ni tocar el registro en memoria.

### POST /api/plugins/{id}/activate
**Trace**: `RF-002` · **Auth**: platform-admin, integration-admin · Activa el plugin indicado -sus tipos vuelven a ser resolubles por el motor- previo assertPromotable del gate canary (muestras minimas y ratio de fallo); 404 si el plugin no existe.

### POST /api/plugins/{id}/versions/{version}/activate
**Trace**: `RF-002` · **Auth**: platform-admin, integration-admin · Promueve una version concreta ya instalada a version activa del plugin (sirve tambien de rollback a una version anterior): revalida trust policy, exige el gate canary y recarga el catalogo; 404 si esa version no esta registrada.

### POST /api/plugins/{id}/versions/{version}/canary-weight
**Trace**: `RF-002` · **Auth**: platform-admin, integration-admin · Fija el porcentaje de trafico (0-100, recortado a ese rango; null lo limpia) que la version canary debe recibir, controlando que fraccion de las ejecuciones usa la version nueva del proveedor de tipos; 404 si la version no existe.

### GET /api/plugins/{id}/canary/route
**Trace**: `RF-002` · **Auth**: platform-admin, integration-admin, auditor · Resuelve, para una clave de enrutamiento dada (query param key), si ese segmento cae en la version canary o en la estable, usando el reparto determinista por CRC32 del peso configurado; devuelve la version que atenderia.

### POST /api/plugins/{id}/versions/{version}/canary/metrics
**Trace**: `RF-005` · **Auth**: platform-admin, integration-admin · Registra una muestra de invocacion de esa version de plugin (taskType, transporte, success, outcome, duracion y mensaje de error); es la evidencia que alimenta el gate que autoriza o bloquea la promocion.

### POST /api/plugins/{id}/deactivate
**Trace**: `RF-002` · **Auth**: platform-admin, integration-admin · Apaga el plugin sin borrarlo: sus tipos dejan de estar disponibles para el motor en la siguiente recarga, pero descriptor y versiones se conservan; 404 si el plugin no existe.

### DELETE /api/plugins/{id}
**Trace**: `RF-002` · **Auth**: platform-admin, integration-admin · Desinstala de verdad el plugin: borra el descriptor y TODAS sus versiones registradas y recarga el catalogo para que el registro deje de exponer sus tipos; 404 si no existia.

### GET /api/plugins/ui-catalog
**Trace**: `RF-002` · **Auth**: platform-admin, integration-admin, operator, payments-operator, auditor · Devuelve los manifiestos de plugins de frontend registrados en runtime (navegacion, rutas, workspaces, acciones, i18n y remote de module federation) que el shell carga al arrancar; una entrada con JSON corrupto se omite en vez de romper el catalogo.

### POST /api/plugins/ui-catalog
**Trace**: `RF-002` · **Auth**: platform-admin, integration-admin · Alta o reemplazo (upsert por el campo id del manifiesto) de un plugin de frontend en el catalogo runtime; exige id textual no vacio y JSON serializable, y responde el catalogo completo ya actualizado.

### DELETE /api/plugins/ui-catalog/{id}
**Trace**: `RF-002` · **Auth**: platform-admin, integration-admin · Quita un plugin de frontend del catalogo runtime por su id, devolviendo el catalogo restante; 404 si ese id no estaba registrado.

### GET /api/plugins/config-schema/{type}
**Trace**: `RF-001` · **Auth**: integration-admin, platform-admin, operator · Devuelve el schema de configuracion de un tipo buscando en los registries de task, luego source y luego reader, para que el disenador renderice el formulario dinamico (ih-schema-form) de un tipo aportado por plugin; si ninguno lo declara responde 200 con schema vacio.

### GET /api/task-types
**Trace**: `RF-002` · **Auth**: platform-admin, integration-admin, auditor · Lista el catalogo de task types soportados por el motor (locales y de plugin) con origin, provider, pluginId, pluginVersion, transport, status, reason y ademas asyncOffload y configurable, que la UI usa para decidir que tipos ofrece el disenador y cuales admiten formulario de configuracion.

### GET /api/query/process-executions/{processExecutionId}/progress
**Trace**: `RF-005` · **Auth**: platform-admin, integration-admin, operator, payments-operator, auditor · Progreso agregado y en vivo de una ejecucion: por tarea scatter devuelve slices completados/fallidos, total (null cuando el page-chain aun no se sello, con streaming=true y sin porcentaje falso), status y lastProgressAt; por tarea batch sincrona el contador recordsProcessed; y la salud del pipeline con el resumen de la DLQ asincrona.

### POST /api/process-executions/resume/{token}
**Trace**: `RF-009` · **Auth**: platform-admin, integration-admin, operator, payments-operator · Callback del camino del dinero: reanuda una tarea suspendida entregandole como externalEvent el push del gateway bancario (MT900/MT910, pacs.002, camt.054) o el disparo del SuspensionExpiryScheduler; verifica HMAC-SHA256 sobre el body crudo via X-Signature cuando esta habilitado (401 si falta o no cuadra), consume el token de un solo uso (404 en replay, 409 si el estado no admite reanudar) y devuelve outcome, processCompleted, details y el nextResumeToken si la tarea vuelve a suspenderse.

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
  /api/query/process-definitions:
    get:
      summary: Lista (query) los procesos con filtros (q, mode, status) y paginacion
      operationId: queryProcessDefinitions
      responses:
        '200':
          description: OK
  /api/process-executions/{processDefinitionId}:
    post:
      summary: Dispara la ejecucion de un proceso definido
      operationId: triggerProcessExecution
      requestBody:
        required: false
        description: Parametros opcionales de ejecucion; el proceso objetivo se indica en la ruta ({processDefinitionId}).
        content:
          application/json:
            schema:
              type: object
      responses:
        '200':
          description: OK
  /api/plugins:
    get:
      summary: Diagnostico del catalogo de plugins backend: descriptores activos con sus tipos de tarea/fuente/reader aportad
      operationId: pluginDiagnostics
      responses:
        '200':
          description: OK
  /api/plugins/canary/metrics:
    get:
      summary: Evalua cada version instalada contra la ventana canary (muestras, fallos, failureRatio, umbrales min-samples/m
      operationId: pluginCanaryMetrics
      responses:
        '200':
          description: OK
  /api/plugins/reload:
    post:
      summary: Recarga en memoria el catalogo de plugins instalados desde la BD (revalida trust policy y reindexa los tipos p
      operationId: reloadPlugins
      responses:
        '200':
          description: OK
  /api/plugins/install:
    post:
      summary: Instala declarativamente un plugin backend (id, version, spiVersion, providedTypes/SourceTypes/ReaderTypes, tr
      operationId: installPlugin
      responses:
        '200':
          description: OK
  /api/plugins/marketplace/install:
    post:
      summary: Resuelve un plugin desde un catalogo marketplace remoto (catalogUrl + pluginId, con pinnedVersion/channel) y l
      operationId: installPluginFromMarketplace
      responses:
        '200':
          description: OK
  /api/plugins/marketplace/preview:
    post:
      summary: Dry-run del alta desde marketplace: baja la entrada del catalogo remoto, valida la trust policy y devuelve el 
      operationId: previewMarketplacePlugin
      responses:
        '200':
          description: OK
  /api/plugins/{id}/activate:
    post:
      summary: Activa el plugin indicado -sus tipos vuelven a ser resolubles por el motor- previo assertPromotable del gate c
      operationId: activatePlugin
      responses:
        '200':
          description: OK
  /api/plugins/{id}/versions/{version}/activate:
    post:
      summary: Promueve una version concreta ya instalada a version activa del plugin (sirve tambien de rollback a una versio
      operationId: activatePluginVersion
      responses:
        '200':
          description: OK
  /api/plugins/{id}/versions/{version}/canary-weight:
    post:
      summary: Fija el porcentaje de trafico (0-100, recortado a ese rango
      operationId: setPluginCanaryWeight
      responses:
        '200':
          description: OK
  /api/plugins/{id}/canary/route:
    get:
      summary: Resuelve, para una clave de enrutamiento dada (query param key), si ese segmento cae en la version canary o en
      operationId: pluginCanaryRoute
      responses:
        '200':
          description: OK
  /api/plugins/{id}/versions/{version}/canary/metrics:
    post:
      summary: Registra una muestra de invocacion de esa version de plugin (taskType, transporte, success, outcome, duracion 
      operationId: recordPluginCanaryMetric
      responses:
        '200':
          description: OK
  /api/plugins/{id}/deactivate:
    post:
      summary: Apaga el plugin sin borrarlo: sus tipos dejan de estar disponibles para el motor en la siguiente recarga, pero
      operationId: deactivatePlugin
      responses:
        '200':
          description: OK
  /api/plugins/{id}:
    delete:
      summary: Desinstala de verdad el plugin: borra el descriptor y TODAS sus versiones registradas y recarga el catalogo pa
      operationId: uninstallPlugin
      responses:
        '200':
          description: OK
  /api/plugins/ui-catalog:
    get:
      summary: Devuelve los manifiestos de plugins de frontend registrados en runtime (navegacion, rutas, workspaces, accione
      operationId: uiPluginCatalog
      responses:
        '200':
          description: OK
    post:
      summary: Alta o reemplazo (upsert por el campo id del manifiesto) de un plugin de frontend en el catalogo runtime
      operationId: upsertUiPluginCatalogEntry
      responses:
        '200':
          description: OK
  /api/plugins/ui-catalog/{id}:
    delete:
      summary: Quita un plugin de frontend del catalogo runtime por su id, devolviendo el catalogo restante
      operationId: removeUiPluginCatalogEntry
      responses:
        '200':
          description: OK
  /api/plugins/config-schema/{type}:
    get:
      summary: Devuelve el schema de configuracion de un tipo buscando en los registries de task, luego source y luego reader
      operationId: pluginConfigSchema
      responses:
        '200':
          description: OK
  /api/task-types:
    get:
      summary: Lista el catalogo de task types soportados por el motor (locales y de plugin) con origin, provider, pluginId, 
      operationId: listTaskTypes
      responses:
        '200':
          description: OK
  /api/query/process-executions/{processExecutionId}/progress:
    get:
      summary: Progreso agregado y en vivo de una ejecucion: por tarea scatter devuelve slices completados/fallidos, total (n
      operationId: processExecutionProgress
      responses:
        '200':
          description: OK
  /api/process-executions/resume/{token}:
    post:
      summary: Callback del camino del dinero: reanuda una tarea suspendida entregandole como externalEvent el push del gatew
      operationId: resumeSuspendedProcessExecution
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
