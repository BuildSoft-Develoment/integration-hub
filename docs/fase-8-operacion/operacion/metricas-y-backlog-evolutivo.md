# Metricas y backlog evolutivo

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Monitoreo y respuesta operativa](monitoreo-y-respuesta.md)
- Siguiente: [Auditoria documental fases 0-8 vs codigo](../../transversal/90.37-auditoria-fases-0-8-vs-codigo.md)
<!-- nav-guided:end -->

## Objetivo

Relacionar el seguimiento operativo con las metricas minimas y las mejoras posteriores al release.

## Metricas minimas

- procesos ejecutados por estado
- ultima ejecucion programada
- tiempo por tarea
- filas procesadas
- fallos por proceso
- latencia DB y REST

## Fuentes actuales

- `ops/fase-8-operacion/metricas.md`
- `ops/observabilidad.md`
- `docs/fase-8-operacion/08.00-operacion-continua.md`

## Baseline de capacidad

### DEV

- 1 host Docker
- 4 vCPU
- 8 GB RAM
- 50 GB disco

### PRE

- 1 nodo de aplicacion
- 4 a 8 vCPU
- 16 GB RAM
- 100 GB disco

### PROD

- 2 nodos de aplicacion `Kubernetes`
- 4 a 8 vCPU por nodo
- 16 a 32 GB RAM por nodo
- `PostgreSQL` primary + replica
- `Keycloak` dimensionado para usuarios concurrentes

## Backlog evolutivo

- mejorar visibilidad de errores y tiempos por flujo
- formalizar mas indicadores operativos por feature
- sostener alineacion entre incidentes, metricas y decisiones futuras
- introducir notificaciones operativas para ejecuciones con errores o archivos pendientes
- ampliar reportes operativos por proceso, fuente o reader
- evaluar acciones masivas y reproceso avanzado sobre lotes grandes
- reforzar auditoria fina sobre reprocesos y acciones manuales sensibles

## Regla de madurez

La fase 8 no solo mide; tambien convierte observaciones operativas en mejoras priorizables para nuevas specs, ajustes tecnicos o cambios de operacion.
