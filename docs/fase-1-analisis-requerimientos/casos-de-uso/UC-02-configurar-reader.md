# UC-02 Configurar reader

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [UC-01 Configurar fuente](UC-01-configurar-fuente.md)
- Siguiente: [UC-03 Definir y ejecutar proceso](UC-03-definir-y-ejecutar-proceso.md)
<!-- nav-guided:end -->

## Actor principal

`Integration Admin`

## Precondiciones

- existe una necesidad clara de interpretar un formato de entrada
- el usuario conoce layout, separadores o estructura del archivo

## Flujo principal

1. El usuario selecciona el tipo de reader.
2. Configura layout, columnas o reglas de parseo.
3. Guarda la definicion del reader.
4. El reader queda disponible para ser asociado a una fuente o proceso.

## Flujos alternos

- el layout no es compatible con el formato real del archivo
- faltan reglas de parseo para campos obligatorios
- la definicion del reader requiere ajustes antes de ser usada

## Postcondiciones

- el reader queda persistido y trazable
- la configuracion puede reutilizarse en distintos procesos
