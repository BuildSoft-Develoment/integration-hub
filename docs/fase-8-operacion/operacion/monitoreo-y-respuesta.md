# Monitoreo y respuesta operativa

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Operacion continua](../08.00-operacion-continua.md)
- Siguiente: [Metricas y backlog evolutivo](metricas-y-backlog-evolutivo.md)
<!-- nav-guided:end -->

## Objetivo

Documentar la rutina minima de vigilancia y respuesta sobre la plataforma en operacion.

## Rutina diaria

- revisar disponibilidad UI y API
- revisar login `OIDC`
- revisar scheduler
- revisar ejecuciones fallidas
- revisar trazas, auditoria y errores de integracion

## Incidentes comunes

- falla de autenticacion
- falla de lectura de fuentes
- falla de ejecucion de procesos
- problemas de secretos o configuracion

## Regla de respuesta

Toda incidencia recurrente debe dejar aprendizaje util en `ops/`, `releases/` o backlog evolutivo, no solo resolverse en caliente.
