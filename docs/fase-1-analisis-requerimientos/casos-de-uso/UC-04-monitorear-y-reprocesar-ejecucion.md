# UC-04 Monitorear y reprocesar ejecucion

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [UC-03 Definir y ejecutar proceso](UC-03-definir-y-ejecutar-proceso.md)
- Siguiente: [UC-05 Configurar conexion](UC-05-configurar-conexion.md)
<!-- nav-guided:end -->

## Actor principal

`Operator` y `Auditor`

## Precondiciones

- existe al menos una ejecucion registrada
- el usuario tiene permisos para consultar o reprocesar

## Flujo principal

1. El usuario revisa ejecuciones, auditoria y archivos procesados.
2. Identifica fallos, pendientes o corridas hijas.
3. Decide reprocesar segun el caso.
4. El sistema genera una nueva ejecucion con referencia a la corrida origen.

## Flujos alternos

- la corrida origen ya fue corregida y no requiere reproceso
- el error persiste por una dependencia externa
- el usuario solo consulta sin ejecutar una nueva corrida

## Postcondiciones

- existe trazabilidad entre corrida origen y reproceso
- la evidencia operativa queda disponible para QA, soporte y auditoria
