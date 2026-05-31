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
- Componentes: `source-list`, `source-editor`, `source-type-form` (parametros por tipo),
  `source-inspector`, `source-toolbar`. Descriptores de provider en `frontend/libs/core/providers/sources`.

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
