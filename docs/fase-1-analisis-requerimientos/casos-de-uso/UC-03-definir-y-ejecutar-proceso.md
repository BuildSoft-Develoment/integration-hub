# UC-03 Definir y ejecutar proceso

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [UC-02 Configurar reader](UC-02-configurar-reader.md)
- Siguiente: [UC-04 Monitorear y reprocesar ejecucion](UC-04-monitorear-y-reprocesar-ejecucion.md)
<!-- nav-guided:end -->

## Actor principal

`Integration Admin` y `Operator`

## Precondiciones

- existen fuente y reader compatibles
- el proceso esta correctamente configurado y activo

## Flujo principal

1. El usuario crea o edita una definicion de proceso.
2. Agrega tareas en el orden requerido.
3. Guarda el proceso.
4. Ejecuta manualmente o programa su disparo.
5. El sistema registra tareas, estados y resultados.

## Flujos alternos

- una tarea falla y la corrida termina con error
- la configuracion de tareas es inconsistente
- una integracion externa no responde

## Postcondiciones

- queda una ejecucion registrada con trazabilidad completa
- el operador puede revisar el resultado y decidir reproceso si hace falta
