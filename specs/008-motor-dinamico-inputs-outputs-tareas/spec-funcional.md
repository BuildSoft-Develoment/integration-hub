# Spec funcional - Motor dinamico de inputs/outputs de tareas

[README principal](../../README.md) | [Specs](../README.md)

## Objetivo

Permitir que cada tarea de un proceso consuma outputs tipados de cualquier tarea anterior,
defina su modo de ejecucion (`once`, `per-record` o `batch`) y publique outputs
reutilizables para tareas posteriores.

## Actores

- `integration-admin`
- `operator`
- `scheduler`
- sistemas externos invocados por tareas

## Alcance

Esta feature evoluciona la feature `003-diseno-y-ejecucion-procesos`. No reemplaza el
catalogo de fuentes, readers, conexiones ni la ejecucion actual; agrega un contrato
estandar para inputs, outputs, modos de ejecucion y procesamiento por lotes.

## Requerimientos

- RF-001 cada instancia de tarea debe tener un `taskRef` estable para ser referenciada por
  tareas posteriores.
- RF-002 cada tarea consumidora debe poder leer `summary`, `records`, `table` y `errors`
  desde cualquier tarea anterior compatible.
- RF-003 la metadata de ejecucion debe ser transversal y estar disponible para todas las
  tareas sin modelarse como output de tarea.
- RF-004 cada tarea debe declarar `executionMode`: `once`, `per-record` o `batch`.
- RF-005 el modo `batch` debe soportar `batchSize`, checkpoint, reintentos e idempotencia
  por lote.
- RF-006 el disenador debe permitir cadenas lineales, fan-out y fan-in.
- RF-007 el mapping debe ser comun para columnas DB, parametros SP/FN, REST
  path/query/header/body y templates de notificacion.
- RF-008 los flujos de mas de `1,000,000` registros no deben transportar todos los
  registros en memoria entre tareas.

## Reglas funcionales

- una tarea no puede consumir outputs de una tarea futura.
- el grafo no debe tener ciclos.
- `once` consume metadata, summaries u outputs agregados.
- `per-record` consume `records`, `table` o `errors`.
- `batch` consume `records`, `table` o `errors` y requiere `batchSize`.
- `batch` es el modo recomendado para volumen alto.
- fan-out permite que varias tareas consuman el mismo output anterior.
- fan-in permite que una tarea consuma multiples summaries/errors/metadata.
- `FILE_READ` conserva fuente y reader; las tareas posteriores no deben quedar acopladas
  al reader original.

## Flujo principal

1. El usuario crea o edita un proceso.
2. Agrega tareas con `taskRef` visibles y orden/dependencias.
3. En cada tarea elige el origen de datos: output anterior o metadata transversal.
4. Selecciona `executionMode`.
5. Configura mappings y outputs publicados.
6. Guarda el proceso.
7. El motor valida dependencias, compatibilidad de modo, batch y mappings.
8. La ejecucion procesa cada tarea segun su input/output declarado.

## Ejemplos de flujo

Cadena lineal:

```text
FILE_READ -> DB_WRITE -> SP1 -> SP2 -> FN -> REST1 -> REST2 -> NOTIFICATION1 -> NOTIFICATION2
```

Ramas y consolidacion:

```text
FILE_READ -> DB_WRITE
          -> REST1 leyendo task-1.records
          -> SP1 leyendo task-2.targetTable
          -> NOTIFICATION leyendo task-2.summary + SP1.summary + metadata transversal
```

## Criterios de aceptacion

- el contrato permite configurar inputs desde outputs anteriores por `taskRef`.
- todas las tareas soportan `executionMode`.
- metadata transversal esta disponible en mappings sin seleccionarse como output de tarea.
- fan-out y fan-in estan representados en el contrato.
- los ejemplos de alto volumen usan `batch` y outputs materializados o consultables por
  cursor.
- procesos sin `taskRef`, `executionMode` o `input` requerido fallan validacion y deben migrarse.
