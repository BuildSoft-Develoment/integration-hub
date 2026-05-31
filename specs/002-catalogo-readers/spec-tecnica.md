# Spec tecnica - Catalogo de readers

## Componentes relacionados

### Backend (`platform-app`)
- API: `ReaderDefinitionResource` (`/api/reader-definitions`).
- Servicio: `ReaderCatalogService`.
- Providers de reader (registry), uno por `ReaderType`: `TxtReaderProvider`, `CsvReaderProvider`,
  `XlsReaderProvider`, `XlsxReaderProvider`, `JsonReaderProvider`, `XmlReaderProvider`.
- Persistencia (Panache): `ReaderDefinitionRepository`.

### Frontend (`frontend/libs/features/readers`, Angular/Nx)
- API: `reader-api.service.ts`.
- Estado (CQRS): `reader-catalog.store.ts`, `reader-catalog-query.store.ts`,
  `reader-catalog-command.service.ts`, `reader-editor-state.service.ts`.
- Componentes: `reader-list`, `reader-editor`, `reader-type-form` (layout/opciones por formato),
  `reader-toolbar`. Descriptores de provider en `frontend/libs/core/providers/readers`.

## Modelo de datos

Tabla `reader_definition` (Flyway `V1__initial_schema.sql`):

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigserial | PK |
| `name` | varchar(120) | unico, no nulo |
| `reader_type` | varchar(40) | `txt`, `csv`, `xls`, `xlsx`, `json`, `xml` |
| `active` | boolean | default true |
| `configuration_json` | text | layout y opciones de interpretacion |

Indices: PK en `id`; UNIQUE en `name`.

## Consideraciones tecnicas

- el backend debe validar configuraciones por reader
- los readers de alto volumen deben favorecer streaming cuando aplique
- `XLSX` y `TXT/CSV` deben mantener el enfoque de bajo consumo ya documentado

## Pruebas tecnicas sugeridas

- lectura correcta de configuraciones
- compatibilidad por formato
- errores de layout mal definido
