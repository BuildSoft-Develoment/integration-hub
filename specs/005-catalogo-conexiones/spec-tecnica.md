# Spec tecnica - Catalogo de conexiones

## Componentes relacionados

### Backend (`platform-app`)
- API: `ConnectionDefinitionResource` (`/api/connection-definitions`).
- Servicios: `ConnectionCatalogService` (CRUD/activacion/test) y `ConnectionMetadataService`
  (introspeccion JDBC: esquemas/tablas/columnas/procedimientos/funciones y parametros).
- Mapeo: `ConnectionApiMapper`.
- Persistencia (Panache): `ConnectionDefinitionRepository`.
- Tipos: enum `ConnectionType` = `ORACLE`, `POSTGRESQL`, `SQLSERVER`, `MYSQL`, `MONGODB`
  (solo los motores relacionales exponen rutinas).

### Frontend (`frontend/libs/features/connections`, Angular/Nx)
- API: `connection-api.service.ts`.
- Estado (CQRS): `connection-catalog.store.ts`, `connection-catalog-query.store.ts`.
- Componentes: listado/editor de conexiones y selección de tabla/rutina por metadata, consumidos
  por los formularios de tarea DB de la feature `processes`.

## Contrato `configuration_json` por motor

`configuration_json` es un JSON dinamico cuya forma depende del `connection_type` (familia
`jdbc` o `mongodb`). El contrato lo definen los providers del frontend
(`frontend/libs/core/providers/.../connections/*-connection.provider.ts`):
`toConfigurationObject(draft)` arma el JSON; `hydrateDraft(json)` el inverso. El campo `password`
(jdbc) y `connectionString` (mongodb) admiten referencia `${secret:...}` (nunca valor en claro).

```jsonc
// familia "jdbc": ORACLE / POSTGRESQL / SQLSERVER / MYSQL
{ "jdbcUrl": "jdbc:postgresql://host:5432/db", "username": "user", "password": "${secret:pg}",
  "minSize": 0, "maxSize": 10, "acquisitionTimeoutSeconds": 30, "validationTimeoutSeconds": 5,
  "reapTimeoutMinutes": 5, "initialSql": "SET ...", "jdbcProperties": { "ssl": "true" } }

// familia "mongodb"
{ "connectionString": "${secret:mongo}", "database": "ventas",
  "connectTimeoutMillis": 10000, "readTimeoutMillis": 30000 }
```

> Fuente del contrato: los 5 `*ConnectionProvider` (`connections/*-connection.provider.ts`) +
> `ConnectionDraft`. El backend lo consume en `ConnectionCatalogService`/`ConnectionMetadataService`
> de `platform-app`. La metadata JDBC (RF-004/RF-005) NO vive en `configuration_json`: se
> introspecciona en vivo y alimenta los forms de tarea DB en Procesos (003). Mantener contrato y
> codigo en sintonia al cambiar campos.

## Modelo de datos

Tabla `connection_definition` (Flyway `V3__connection_definition.sql`):

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigserial | PK |
| `name` | varchar(120) | unico, no nulo |
| `connection_type` | varchar(40) | enum `ConnectionType` (`ORACLE`/`POSTGRESQL`/`SQLSERVER`/`MYSQL`/`MONGODB`) |
| `active` | boolean | default true |
| `configuration_json` | text | driver/url/credenciales con referencias `${secret:...}` |

Indices: PK en `id`; UNIQUE en `name`.

La metadata JDBC (esquemas, tablas, columnas, procedimientos, funciones y sus parametros) NO se
persiste: se introspecciona en vivo contra el motor a traves de `ConnectionMetadataService`.

## Consideraciones tecnicas

- validar estructura del `configurationJson` por motor
- resolver secretos con el contrato `${secret:...}` (nunca persistir credenciales en claro)
- `MONGODB` no soporta rutinas: los endpoints de procedures/functions no aplican
- la introspeccion debe acotar tiempos y manejar errores de conectividad sin filtrar credenciales

## Endpoints (resumen; detalle en `api-contract.md`)

- CRUD: `GET`/`POST /api/connection-definitions`, `PUT /{connectionDefinitionId}`.
- `POST /api/connection-definitions/test` (prueba de conectividad).
- `POST /{connectionDefinitionId}/activation/{active}` (activar/desactivar).
- Metadata JDBC (`GET`): `/jdbc-metadata/schemas`, `/tables`, `/columns`, `/procedures`,
  `/procedure-parameters`, `/functions`, `/function-parameters`.

## Pruebas tecnicas sugeridas

- creacion/validacion por motor
- prueba de conectividad (`/test`) exitosa y fallida
- introspeccion de esquemas/tablas/columnas y rutinas
- control de permisos por rol (escritura admin; lectura/metadata incluye `auditor`)
