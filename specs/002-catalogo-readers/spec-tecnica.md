# Spec tecnica - Catalogo de readers

## Componentes relacionados

- backend: `ReaderDefinitionResource`
- servicio: `ReaderCatalogService`
- persistencia: `ReaderDefinitionRepository`

## Consideraciones tecnicas

- el backend debe validar configuraciones por reader
- los readers de alto volumen deben favorecer streaming cuando aplique
- `XLSX` y `TXT/CSV` deben mantener el enfoque de bajo consumo ya documentado

## Pruebas tecnicas sugeridas

- lectura correcta de configuraciones
- compatibilidad por formato
- errores de layout mal definido
