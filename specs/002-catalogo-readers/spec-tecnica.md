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

## Contrato `configuration_json` por formato de reader

`configuration_json` es un JSON dinamico cuya forma depende del `reader_type`. El contrato lo
definen los providers del frontend (`frontend/libs/core/providers/.../readers/reader.providers.ts`):
cada provider expone `toConfigurationObject(draft)` (arma el JSON persistido) y `hydrateDraft(json)`
(inverso). Universo de campos en `ReaderDraft` (`reader-provider.abstract.ts`).

Field-definition comun (`fields[]`): `{ "name", "type": "TEXT"|"NUMBER"|"DATE", "size"?,
"required"?, "defaultValue"?, "script"?, "pattern"? }` mas la posicion: `"position"` (delimitados
y excel) o `"start"`/`"end"` (txt fixed-length). Numeros van como number, no string.

```jsonc
// type "TXT" (delimited)   -> sin "fields" si no se definieron campos
{ "mode": "delimited", "encoding": "UTF-8", "rowData": 1, "delimiter": "|",
  "fields": [ { "name": "monto", "type": "NUMBER", "position": 3, "required": true } ] }

// type "TXT" (fixed-length) -> sin "delimiter"; usa start/end
{ "mode": "fixed-length", "encoding": "UTF-8", "rowData": 1,
  "fields": [ { "name": "cuenta", "type": "TEXT", "start": 0, "end": 10 } ] }

// type "CSV"
{ "delimiter": ",", "encoding": "UTF-8", "rowData": 1,
  "fields": [ { "name": "cliente", "type": "TEXT", "position": 1 } ] }

// type "XLS" / "XLSX"
{ "sheetIndex": 0, "rowData": 1, "trimValues": true,
  "fields": [ { "name": "fecha", "type": "DATE", "position": 2 } ] }

// type "JSON"  -> solo fieldMappings (alias -> ruta), si hay
{ "fieldMappings": { "monto": "$.detalle.total", "cliente": "$.cliente.nombre" } }

// type "XML"
{ "recordElement": "registro", "includeAttributes": true, "trimValues": true,
  "fieldMappings": { "monto": "total", "cliente": "@nombre" } }
```

> Fuente del contrato: `reader.providers.ts` (Txt/Csv/Xls/Xlsx/Json/Xml `*ReaderProvider`) +
> `ReaderDraft`. El backend lo consume en los `*ReaderProvider` de `platform-app`. Mantener
> contrato y codigo en sintonia al cambiar campos.

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
