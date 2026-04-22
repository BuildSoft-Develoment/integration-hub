# Spec tecnica - Catalogo de fuentes

## Componentes relacionados

- frontend: formularios y vistas de catalogo
- backend: `SourceDefinitionResource`
- servicio: `SourceCatalogService`
- persistencia: `SourceDefinitionRepository`

## Consideraciones tecnicas

- validar estructura del `configurationJson`
- soportar referencias a secretos usando el contrato `${secret:...}`
- mantener compatibilidad con filesystem, FTP, SFTP y REST

## Pruebas tecnicas sugeridas

- validacion por tipo de fuente
- persistencia y recuperacion de catalogo
- control de permisos por rol
