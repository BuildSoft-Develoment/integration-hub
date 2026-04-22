# Modulo observabilidad y seguridad

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Modulo orquestacion y ejecucion](modulo-orquestacion-y-ejecucion.md)
- Siguiente: [UC-01 Configurar fuente](../casos-de-uso/UC-01-configurar-fuente.md)
<!-- nav-guided:end -->

## Objetivo

Garantizar trazabilidad, monitoreo y control de acceso sobre la operacion del producto.

## Entradas

- eventos de auditoria
- spans y metricas de ejecucion
- autenticacion `OIDC`
- asignacion de roles y permisos

## Salidas

- auditoria consultable por proceso y usuario
- trazas correlacionadas por `processExecutionId`
- overview operativo con resumen de ejecuciones y errores
- autorizacion consistente entre UI y API

## Reglas

- toda ejecucion relevante debe dejar rastros en auditoria y observabilidad
- `auditor` consulta, pero no altera configuraciones
- `operator` ejecuta y monitorea procesos
- errores operativos deben quedar visibles para reproceso y soporte

## Integraciones

- `Keycloak` para identidad y roles
- `OpenTelemetry Collector` y backend de trazas
- `PostgreSQL` para auditoria y correlacion operativa

## Riesgos

- baja trazabilidad entre UI, API y tareas internas
- permisos inconsistentes por ambiente
- ruido o ausencia de metricas utiles
- dificultad para diagnosticar fallos intermitentes
