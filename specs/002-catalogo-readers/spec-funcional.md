---
origin: reingenieria
---

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

## Requerimientos

- RF-001 crear un reader por cada formato soportado (`txt`, `csv`, `xls`, `xlsx`, `json`, `xml`).
- RF-002 definir layout y opciones de interpretacion por formato.
- RF-003 persistir la configuracion en `configuration_json`.
- RF-004 activar/desactivar readers existentes.
- RF-005 exponer el reader configurado para que el `Process Designer` lo asocie a procesos.

## Reglas de negocio

- el formato define campos obligatorios y validacion de layout
- `txt` puede operar delimitado, tabulado o por posiciones fijas
- el `name` del reader es unico
- un reader solo es util si su configuracion es consistente con la fuente y el proceso

## Criterios de aceptacion

- el catalogo soporta `txt`, `csv`, `xls`, `xlsx`, `json` y `xml`
- la configuracion queda persistida
- el `Process Designer` puede usar el reader configurado

## Gates

Feature reconstruida por reingenieria sobre codigo en produccion; los gates de proceso se registran como `pending` hasta su validacion humana formal.

- `gate-spdd-approved`: pending
- `gate-prototype-ready`: pending
