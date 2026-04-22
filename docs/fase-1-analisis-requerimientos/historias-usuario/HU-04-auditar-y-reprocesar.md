# HU-04 Auditar y reprocesar

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [HU-03 Disenar y ejecutar procesos](HU-03-disenar-y-ejecutar-procesos.md)
- Siguiente: [Fase 2 - UX/UI](../../fase-2-ux-ui/README.md)
<!-- nav-guided:end -->

## Como

`Operator` y `Auditor`

## Quiero

consultar auditoria, revisar ejecuciones y lanzar reprocesos controlados

## Para

resolver fallos operativos sin perder trazabilidad ni contexto historico

## Criterios de aceptacion

- muestra ejecuciones, tareas y archivos procesados
- permite filtrar por proceso, estado o fecha
- soporta reprocesos con referencia a la corrida origen
- conserva evidencia para auditoria y soporte

## Reglas de negocio

- un reproceso genera una nueva ejecucion
- el historial original no debe sobrescribirse
