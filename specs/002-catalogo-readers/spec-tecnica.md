# Spec tecnica - Catalogo de readers

## Componentes relacionados

- backend: `ReaderDefinitionResource`
- servicio: `ReaderCatalogService`
- persistencia: `ReaderDefinitionRepository`

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
