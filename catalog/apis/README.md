# Catalogo de APIs - Integration Hub

Inventario de los contratos de API que expone la plataforma. Es la entrada
unica para descubrir superficies de integracion y su gobernanza.

| API | Tipo | Contrato | Estado |
|---|---|---|---|
| Integration Hub REST API | OpenAPI 3.1 | contracts/api/openapi.yaml | Activo |
| Eventos (auditoria + notificaciones) | AsyncAPI 3.0 | contracts/events/asyncapi.yaml | Activo |

## Convenciones
- El contrato REST se regenera desde el codigo con `npm run generate:openapi`.
- Los esquemas de eventos viven bajo `contracts/events/`.
- Todo cambio de contrato pasa por gobernanza de contratos (fase transversal).
