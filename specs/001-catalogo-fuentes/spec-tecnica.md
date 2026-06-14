# Spec tecnica - Catalogo de fuentes

## Componentes relacionados

### Backend (`platform-app`)
- API: `SourceDefinitionResource` (`/api/source-definitions`).
- Servicio: `SourceCatalogService`; mapeo/validacion `JsonConfigurationMapper`.
- Secretos: `FileVaultSecretValueProvider` resuelve el contrato `${secret:...}`.
- Providers de fuente (registry): `FilesystemSourceProvider` (y FTP/SFTP/REST segun `SourceType`).
- Persistencia (Panache): `SourceDefinitionRepository`.

### Frontend (`frontend/libs/features/sources`, Angular/Nx)
- API: `source-api.service.ts`.
- Estado (CQRS): `source-catalog.store.ts`, `source-catalog-query.store.ts`,
  `source-catalog-command.service.ts`, `source-editor-state.service.ts`.
- Componentes: `source-list`, `source-editor`, `source-inspector`, `source-toolbar`, y un
  formulario de configuracion por tipo (`source-type-form/`) que captura el contrato de abajo.

## Contrato `configuration_json` por tipo de fuente

`configuration_json` es un JSON dinamico cuya forma depende del `type`. El contrato lo definen
los providers del frontend (`frontend/libs/core/providers/.../sources/*-source.provider.ts`):
`SourceDraft` es el universo de campos y `toConfigurationObject(draft)` arma el JSON persistido;
`hydrateDraft(json)` hace el inverso. Campos `password`/`passphrase`/`token` admiten referencia
`${secret:...}` (nunca valor en claro).

Bloque comun de seleccion de archivo (aplica a `filesystem`/`ftp`/`sftp`, opcional): `fileNameTemplate`,
`selectionMode` (`latestModified` | `single` | `all`), `fileErrorPolicy` (`failFast` | `continue`),
`templateVariables` (objeto). Timeouts: file-based usan `timeoutMillis` (default 15000); `rest` usa
`timeoutSeconds` (default 20).

```jsonc
// type "filesystem"
{ "path": "/data/demo", "fileNameTemplate": "ventas_*.csv", "selectionMode": "latestModified",
  "fileErrorPolicy": "failFast", "mediaType": "text/csv" }

// type "ftp"   (port default 21)
{ "host": "192.168.1.100", "port": 21, "username": "user", "password": "${secret:ftp}",
  "remotePath": "/in", "passiveMode": false, "timeoutMillis": 15000, "mediaType": "text/csv" }

// type "sftp"  (port default 22)
{ "host": "192.168.1.100", "port": 22, "username": "user", "password": "${secret:sftp}",
  "remotePath": "/in", "privateKeyPath": "/keys/id_rsa", "passphrase": "${secret:pass}",
  "strictHostKeyChecking": true, "knownHostsPath": "/etc/ssh/ssh_known_hosts",
  "timeoutMillis": 15000, "mediaType": "text/csv" }

// type "rest"  (method default GET; authType: '' | basic | bearer)
{ "url": "https://api.demo/files", "method": "GET", "authType": "bearer", "token": "${secret:token}",
  "fileName": "data.csv", "timeoutSeconds": 20, "headers": { "X-Env": "prod" }, "mediaType": "application/json" }

// type "s3"  (AWS S3 / compatible MinIO via endpoint) — cloud, WIP (ADR-006)
{ "region": "us-east-1", "bucket": "ventas-raw", "prefix": "incoming/", "fileNameTemplate": "ventas_*.csv",
  "selectionMode": "latestModified", "authMode": "default", "accessKeyId": "${secret:aws/key}",
  "secretAccessKey": "${secret:aws/secret}", "endpoint": "", "pathStyleAccess": false, "mediaType": "text/csv" }

// type "gcs"  (Google Cloud Storage) — cloud, WIP (ADR-006)
{ "bucket": "ventas-raw", "prefix": "incoming/", "fileNameTemplate": "ventas_*.csv",
  "authMode": "adc", "serviceAccountJson": "${secret:gcp/sa}", "mediaType": "text/csv" }

// type "azure-blob"  (Azure Blob Storage) — cloud, WIP (ADR-006)
{ "accountName": "ventasstg", "container": "raw", "prefix": "incoming/", "fileNameTemplate": "ventas_*.csv",
  "authMode": "managed-identity", "accountKey": "${secret:az/key}", "sasToken": "${secret:az/sas}", "mediaType": "text/csv" }
```

> Fuente del contrato: `SourceDraft` (`source-provider.abstract.ts`) + los 4 `*-source.provider.ts`.
> El backend lo consume en los `*SourceProvider` de `platform-app`. Mantener este contrato y el
> codigo en sintonia al cambiar campos.

## Modelo de datos

Tabla `source_definition` (Flyway `V1__initial_schema.sql`):

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigserial | PK |
| `name` | varchar(120) | unico, no nulo |
| `source_type` | varchar(40) | `filesystem`, `ftp`, `sftp`, `rest` (+ `s3`, `gcs`, `azure-blob` cloud, WIP ADR-006) |
| `active` | boolean | default true |
| `configuration_json` | text | parametros de conexion y referencias `${secret:...}` |

Indices: PK en `id`; UNIQUE en `name`.

## Evolucion: fuentes de almacenamiento cloud (ADR-006, WIP)

> Añade tipos `s3` / `gcs` / `azure-blob` como object stores. Implementan el mismo SPI
> (`SourceProvider.selectFiles`=ListObjects(prefix); `openFile`=GetObject por stream) y reutilizan
> el bloque comun de seleccion (`fileNameTemplate`/`selectionMode`/`fileErrorPolicy`/`mediaType`),
> con `prefix` en el rol de `remotePath`. Decision en
> [ADR-006](../../docs/fase-3-arquitectura/adr/ADR-006-fuentes-almacenamiento-cloud.md).

- **Credenciales** (`authMode`): nativas por defecto (IAM role/instance-profile, ADC/Workload
  Identity, Managed Identity) o claves explicitas (`accessKeyId`/`secretAccessKey`,
  `serviceAccountJson`, `accountKey`/`sasToken`/`connectionString`) via `${secret:...}`.
- **Streaming**: `SourcePayload` se extiende para soportar `InputStream`; la descarga no carga el
  archivo completo en memoria (objetos grandes).
- **Transporte HTTP lean-native** (la app compila a native-image): AWS `url-connection-client`
  (excluir Apache); GCS HTTP/JSON `NetHttpTransport` (no gRPC); Azure `azure-core-http-jdk-httpclient`
  (no Netty). Extensiones Quarkiverse (`quarkus-amazon-s3`, `quarkus-google-cloud-storage`,
  Azure Services) por su soporte native. Cliente programatico por fuente, cacheado por hash de config.
- **Verificacion native obligatoria por fase**; Azure es el de mayor riesgo (spike adelantado).

## Consideraciones tecnicas

- validar estructura del `configurationJson`
- soportar referencias a secretos usando el contrato `${secret:...}`
- mantener compatibilidad con filesystem, FTP, SFTP y REST
- (cloud, WIP) descarga por streaming y transporte HTTP compatible con native-image por proveedor

## Pruebas tecnicas sugeridas

- validacion por tipo de fuente
- persistencia y recuperacion de catalogo
- control de permisos por rol
