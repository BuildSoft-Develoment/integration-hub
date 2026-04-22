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

## Reglas

- la correlacion base es `processExecutionId`
- la evidencia debe incluir auditoria persistida, trazas y estado por tarea
- el usuario auditor no modifica catalogos ni procesos

## Criterios de aceptacion

- se pueden consultar ejecuciones y auditoria por filtros
- existen datos por archivo y por tarea
- overview consolida metricas de salud operativa
