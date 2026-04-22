# HU-02 Configurar readers

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [HU-01 Administrar fuentes](HU-01-administrar-fuentes.md)
- Siguiente: [HU-03 Disenar y ejecutar procesos](HU-03-disenar-y-ejecutar-procesos.md)
<!-- nav-guided:end -->

## Como

`Integration Admin`

## Quiero

definir readers compatibles con los formatos de entrada

## Para

interpretar archivos y cargas de forma consistente y reutilizable

## Criterios de aceptacion

- soporta `txt`, `csv`, `xls`, `xlsx`, `json` y `xml`
- guarda layout y configuracion por tipo
- permite asociar el reader a procesos y fuentes compatibles

## Reglas de negocio

- un reader debe declarar reglas compatibles con el formato real
- cambios en layout deben quedar auditables
