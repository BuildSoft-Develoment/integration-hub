# HU-03 Disenar y ejecutar procesos

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [HU-02 Configurar readers](HU-02-configurar-readers.md)
- Siguiente: [HU-04 Auditar y reprocesar](HU-04-auditar-y-reprocesar.md)
<!-- nav-guided:end -->

## Como

`Integration Admin` y `Operator`

## Quiero

definir procesos con tareas configurables y ejecutarlos manual o programadamente

## Para

automatizar integraciones y mantener control sobre su resultado operativo

## Criterios de aceptacion

- permite definir procesos activos con secuencia de tareas
- soporta ejecucion manual y programada
- registra tareas, tiempos y resultados por corrida
- expone estados y errores para seguimiento

## Reglas de negocio

- un proceso inactivo no debe ejecutarse
- toda corrida debe generar trazabilidad completa
