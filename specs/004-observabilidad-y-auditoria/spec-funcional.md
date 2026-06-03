---
origin: reingenieria
---

# Spec funcional - Observabilidad y auditoria

## Objetivo

Dar visibilidad operativa y trazabilidad completa sobre procesos, tareas y archivos procesados.

## Actores

- `operator`
- `auditor`
- `platform-admin`

## Flujo principal

1. Consultar ejecuciones.
2. Revisar auditoria y trazas.
3. Identificar errores y reintentos.
4. Navegar a overview y detalles relacionados.

## Requerimientos

- RF-001 consultar ejecuciones y auditoria por filtros.
- RF-002 mostrar detalle por tarea y por archivo procesado.
- RF-003 navegar a overview y a ejecuciones relacionadas (hijas/reproceso).
- RF-004 exponer un resumen operativo agregado en `GET /api/query/overview-summary`.
- RF-005 correlacionar evidencia tecnica y funcional por `processExecutionId`.

## Reglas de negocio

- la correlacion base es `processExecutionId`
- la evidencia debe incluir auditoria persistida, trazas y estado por tarea
- el usuario `auditor` consulta pero no modifica catalogos ni procesos

## Criterios de aceptacion

- se pueden consultar ejecuciones y auditoria por filtros
- existen datos por archivo y por tarea
- overview consolida metricas de salud operativa
- (UI) hay vistas de listado/filtro (`execution-list`/`audit-list` + toolbars), detalle por tarea y
  archivo (`execution-editor` + `execution-task-list`/`execution-files-panel`), linaje de reproceso
  (`execution-lineage`) y resumen operativo (`overview-metric-card`/`overview-table-card`)

## Gates

Feature reconstruida por reingenieria sobre codigo en produccion; los gates de proceso se registran como `pending` hasta su validacion humana formal.

- `gate-spdd-approved`: pending
- `gate-prototype-ready`: pending
