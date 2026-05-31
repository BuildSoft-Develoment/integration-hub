# Spec tecnica - Catalogo de fuentes

## Componentes relacionados

- frontend: formularios y vistas de catalogo
- backend: `SourceDefinitionResource`
- servicio: `SourceCatalogService`
- persistencia: `SourceDefinitionRepository`

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
