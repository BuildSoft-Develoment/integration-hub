# Spec tecnica - Motor dinamico de inputs/outputs de tareas

[README principal](../../README.md) | [Specs](../README.md)

## Decision arquitectonica

Ver [ADR-004 Motor de tareas con inputs y outputs tipados](../../docs/fase-3-arquitectura/adr/ADR-004-motor-input-output-tareas.md).

## Contrato canonico

El contrato se guarda dentro de `configuration_json` de cada tarea mientras no exista una
tabla especifica para inputs/outputs. La forma canonica es:

```json
{
  "taskRef": "task-3-sp1",
  "taskType": "DB_EXECUTE_SP",
  "dependsOn": ["task-2-db-write"],
  "executionMode": "batch",
  "input": {
    "source": "task-output",
    "sourceTaskRef": "task-2-db-write",
    "sourceOutput": "table",
    "readMode": "records",
    "batchSize": 5000,
    "cursor": {
      "type": "keyset",
      "orderBy": "id"
    }
  },
  "parameters": [
    {
      "name": "p_execution_id",
      "sourceKind": "metadata",
      "sourceKey": "_processExecutionId",
      "jdbcType": "BIGINT"
    },
    {
      "name": "p_batch_number",
      "sourceKind": "metadata",
      "sourceKey": "_batchNumber",
      "jdbcType": "INTEGER"
    },
    {
      "name": "p_cliente_id",
      "sourceKind": "field",
      "sourceKey": "cliente_id",
      "jdbcType": "BIGINT"
    }
  ],
  "outputs": [
    { "name": "summary", "type": "summary" },
    { "name": "table", "type": "table", "table": "resultado_sp1" },
    { "name": "errors", "type": "errors" }
  ],
  "retryPolicy": {
    "maxRetries": 3,
    "backoffSeconds": 10
  }
}
```

Para fan-in se usa `inputs`:

```json
{
  "taskRef": "notification-final",
  "taskType": "NOTIFICATION",
  "executionMode": "once",
  "inputs": [
    { "source": "task-output", "sourceTaskRef": "task-2-db-write", "sourceOutput": "summary" },
    { "source": "task-output", "sourceTaskRef": "task-4-sp1", "sourceOutput": "summary" },
    { "source": "task-output", "sourceTaskRef": "task-6-rest1", "sourceOutput": "errors" }
  ],
  "message": "Ejecucion {_processExecutionId}: insertados {task-2-db-write.writtenCount}, errores REST {task-6-rest1.errorCount}"
}
```

## Tipos de input

| Tipo | Descripcion | Uso principal |
| --- | --- | --- |
| `metadata` | contexto transversal, no output de tarea | bindings tecnicos y parametros comunes |
| `summary` | agregados de una tarea previa | notificaciones, cierres, SP/FN once |
| `records` | registros parseados o producidos por tarea previa | DB_WRITE, REST, SP/FN por registro/lote |
| `table` | output materializado consultable por cursor | alto volumen y tareas DB |
| `errors` | registros fallidos, rechazados o pendientes | reintentos, REST2, notificaciones |

## Metadata transversal

Metadata global:

- `_processExecutionId`
- `_processDefinitionId`
- `_processName`
- `_triggerSource`
- `_environment`
- `_startedAt`

Metadata de tarea:

- `_taskRef`
- `_taskDefinitionId`
- `_taskType`

Metadata de lote:

- `_batchNumber`
- `_batchSize`
- `_batchFrom`
- `_batchTo`
- `_recordCount`

Metadata de fuente/archivo cuando aplique:

- `_sourceFileName`
- `_sourceFilePath`
- `_sourceMediaType`
- `_sourceFileSize`
- `_sourceLastModified`

## Modos de ejecucion

| Modo | Entrada valida | Regla |
| --- | --- | --- |
| `once` | metadata, `summary`, agregados de `table`/`errors` | ejecuta una sola vez |
| `per-record` | `records`, `table`, `errors` | ejecuta por registro; usar solo cuando el destino no soporte lotes |
| `batch` | `records`, `table`, `errors` | ejecuta por bloque; requiere `batchSize` |

Para mas de `1,000,000` registros, `batch` debe ser el default recomendado. `per-record`
debe requerir justificacion de destino, especialmente para REST o funciones no set-based.

## Outputs por tipo de tarea

| Tarea | Consume | Produce |
| --- | --- | --- |
| `FILE_READ` | metadata transversal para variables de fuente | `records`, `summary`, `errors` |
| `DB_WRITE` | metadata, `summary`, `records`, `table`, `errors` | `table`/`targetTable`, `summary`, `errors` |
| `DB_EXECUTE_SP` | metadata, `summary`, `records`, `table`, `errors` | `summary`, `table`/`records` opcional, `errors` |
| `DB_EXECUTE_FN` | metadata, `summary`, `records`, `table`, `errors` | `summary`, `records`/`table`/`resultAlias`, `errors` |
| `REST_CALL` | metadata, `summary`, `records`, `table`, `errors` | `summary`, `responses` como `records`/`table`, `errors` |
| `NOTIFICATION` | metadata, `summary`, `records`, `table`, `errors` | `summary`, estado de notificacion, `errors` |

## Alto volumen

Reglas tecnicas obligatorias:

- no pasar listas completas de registros entre tareas.
- materializar outputs masivos o exponerlos por cursor/paginacion.
- registrar checkpoint por lote.
- hacer retry por lote y mantener idempotencia.
- filtrar outputs materializados por `_processExecutionId` y `taskRef` o equivalente.
- en REST, controlar throttle, timeout, retry e idempotency key.
- en SP/FN, preferir ejecucion set-based por lote (`processExecutionId`, `batchNumber`,
  `fromId`, `toId`) antes que una llamada por registro.

## Componentes esperados

Backend:

- `TaskInputResolver`: resuelve `input`/`inputs` y entrega metadata, summaries o cursores.
- `TaskOutputRegistry`: registra outputs publicados por tarea.
- `TaskBatchCursor`: lee outputs masivos por lote.
- `TaskBatchCheckpointService`: registra estado y retry por lote.
- validadores de grafo: ciclos, tareas futuras, outputs inexistentes y compatibilidad de modo.

Frontend:

- selector de origen de datos por tarea.
- selector `executionMode`.
- editor de `batchSize`, retry y checkpoint.
- mapping board comun para DB_WRITE, SP, FN, REST y NOTIFICATION.
- visualizacion de `taskRef` y dependencias.

## Migracion obligatoria

Procesos existentes sin `taskRef`, `executionMode` ni `input` explicito para tareas
`batch`/`per-record` deben migrarse. El motor no debe resolver datos desde el reader
original como fallback implicito para tareas posteriores.
