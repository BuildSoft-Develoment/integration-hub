# Spec funcional - Catalogo de readers

## Objetivo

Configurar como interpretar archivos o payloads de entrada segun formato.

## Actores

- `integration-admin`

## Flujo principal

1. Crear reader.
2. Seleccionar formato.
3. Completar layout y opciones.
4. Guardar.
5. Asociarlo a procesos.

## Reglas

- el formato define campos obligatorios
- `txt` puede operar delimitado, tabulado o por posiciones fijas
- un reader solo es util si su configuracion es consistente con la fuente y el proceso

## Criterios de aceptacion

- el catalogo soporta `txt`, `csv`, `xls`, `xlsx`, `json` y `xml`
- la configuracion queda persistida
- el `Process Designer` puede usar el reader configurado
