# UC-01 Configurar fuente

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Modulo observabilidad y seguridad](../modulos/modulo-observabilidad-y-seguridad.md)
- Siguiente: [UC-02 Configurar reader](UC-02-configurar-reader.md)
<!-- nav-guided:end -->

## Actor principal

`Integration Admin`

## Precondiciones

- el usuario tiene permisos administrativos
- existe conectividad hacia el origen a configurar

## Flujo principal

1. El usuario selecciona el tipo de fuente.
2. Ingresa parametros de conexion, acceso y ruta.
3. Ejecuta una validacion de conectividad cuando aplique.
4. Guarda la definicion de fuente.
5. La fuente queda disponible para ser usada por procesos.

## Flujos alternos

- la validacion de conectividad falla y el usuario ajusta parametros
- el secreto o credencial no es valido
- el origen no responde dentro del tiempo esperado

## Postcondiciones

- la fuente queda registrada con estado consistente
- la accion deja trazabilidad para auditoria y soporte
