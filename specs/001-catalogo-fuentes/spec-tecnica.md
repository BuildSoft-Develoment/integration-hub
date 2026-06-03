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
  "strictHostKeyChecking": false, "timeoutMillis": 15000, "mediaType": "text/csv" }

// type "rest"  (method default GET; authType: '' | basic | bearer)
{ "url": "https://api.demo/files", "method": "GET", "authType": "bearer", "token": "${secret:token}",
  "fileName": "data.csv", "timeoutSeconds": 20, "headers": { "X-Env": "prod" }, "mediaType": "application/json" }
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
| `source_type` | varchar(40) | `filesystem`, `ftp`, `sftp`, `rest` |
| `active` | boolean | default true |
| `configuration_json` | text | parametros de conexion y referencias `${secret:...}` |

Indices: PK en `id`; UNIQUE en `name`.

## Consideraciones tecnicas

- validar estructura del `configurationJson`
- soportar referencias a secretos usando el contrato `${secret:...}`
- mantener compatibilidad con filesystem, FTP, SFTP y REST

## Pruebas tecnicas sugeridas

- validacion por tipo de fuente
- persistencia y recuperacion de catalogo
- control de permisos por rol
