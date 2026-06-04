# ADR-004 Motor de tareas con inputs y outputs tipados

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR](README.md)
- Siguiente: [Indice docs](../../README.md)
<!-- nav-guided:end -->

## Estado

Propuesto.

## Contexto

El motor actual de procesos soporta tareas configurables como `FILE_READ`, `DB_WRITE`,
`DB_EXECUTE_SP`, `DB_EXECUTE_FN`, `REST_CALL` y `NOTIFICATION`. La ejecucion vigente
mantiene un `readResult` producido por `FILE_READ` y un mapa plano de outputs tecnicos,
lo que alcanza para flujos lineales simples pero limita escenarios donde una tarea
posterior debe leer datos ya procesados por cualquier tarea anterior.

Los procesos objetivo deben permitir cadenas y variantes dinamicas como:

```text
FILE_READ -> DB_WRITE -> SP1 -> SP2 -> FN -> REST1 -> REST2 -> NOTIFICATION1 -> NOTIFICATION2

FILE_READ -> DB_WRITE
          -> REST1 leyendo task-1.records
          -> SP1 leyendo task-2.targetTable
          -> NOTIFICATION leyendo task-2.summary + SP1.summary
```

Ademas, se espera procesar mas de `1,000,000` registros. Por lo tanto, la arquitectura
no debe transportar registros masivos en memoria entre tareas.

## Decision

Adoptar un modelo de motor basado en:

- `taskRef` estable por instancia de tarea.
- `dependsOn` para dependencias explicitas entre tareas.
- `executionMode` obligatorio: `once`, `per-record` o `batch`.
- metadata transversal disponible para todas las tareas.
- outputs tipados publicados por cada tarea: `summary`, `records`, `table` y `errors`.
- inputs declarativos por tarea desde outputs anteriores: `input` para una fuente y
  `inputs` para fan-in.
- procesamiento por lotes como mitigacion principal de volumen.
- checkpoints, reintentos e idempotencia por lote para outputs masivos.

La metadata no sera un output de tarea. Sera contexto transversal de ejecucion, tarea y
lote, accesible por cualquier tarea mediante bindings de tipo `metadata`.

## Contrato base

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
    "batchSize": 5000
  },
  "parameters": [
    { "name": "p_execution_id", "sourceKind": "metadata", "sourceKey": "_processExecutionId" },
    { "name": "p_batch_number", "sourceKind": "metadata", "sourceKey": "_batchNumber" },
    { "name": "p_cliente_id", "sourceKind": "field", "sourceKey": "cliente_id" }
  ],
  "outputs": [
    { "name": "summary", "type": "summary" },
    { "name": "table", "type": "table", "table": "resultado_sp1" },
    { "name": "errors", "type": "errors" }
  ]
}
```

## Reglas

- `once` ejecuta una vez usando metadata transversal, summaries u outputs agregados.
- `per-record` ejecuta una vez por registro y solo debe usarse si el destino no soporta
  lotes o set-based processing.
- `batch` ejecuta bloques de registros y debe ser el modo recomendado para volumen alto.
- todas las tareas consumidoras deben poder acceder a `summary`, `records`, `table`,
  `errors` y metadata transversal.
- `FILE_READ` publica `records`, `summary` y `errors`.
- `DB_WRITE` publica `table` o `targetTable`, `summary` y `errors`.
- `DB_EXECUTE_SP` y `DB_EXECUTE_FN` publican `summary`, opcionalmente `table`/`records`
  y `errors`.
- `REST_CALL` publica `summary`, `responses` como `table`/`records` cuando aplique, y
  `errors`.
- `NOTIFICATION` consume principalmente metadata, summaries y errors; publica
  `summary` o estado de notificacion.
- ningun flujo de mas de `1,000,000` registros debe depender de listas completas en
  memoria entre tareas.
- outputs grandes deben materializarse o exponerse por cursor/paginacion.

## Consecuencias

Positivas:

- habilita cadenas lineales largas, fan-out y fan-in.
- evita acoplar tareas posteriores al reader original de `FILE_READ`.
- crea un contrato comun de mapping para DB, SP, FN, REST y notificaciones.
- mejora reproceso, auditoria e idempotencia por lote.

Costos:

- requiere evolucionar el contrato `configuration_json`.
- requiere un `TaskInputResolver`, un registro de outputs y lectura batch por output.
- requiere validaciones de grafo, ciclos, dependencias y compatibilidad de modo.
- requiere cambios UI para seleccionar output anterior y modo de ejecucion.

## Migracion

No se conserva modo legacy para tareas nuevas ni editadas. Cada tarea debe declarar
`taskRef` y `executionMode`. Las tareas `batch` o `per-record` deben declarar `input`
explicito; si falta el origen o el output referenciado no existe, la ejecucion debe fallar
con error de configuracion.

Los procesos existentes que no tengan este contrato deben migrarse antes de operar bajo
este motor. La migracion minima agrega `taskRef`, `executionMode` e `input` para cada
tarea consumidora.

## Referencias

- [Spec 008 - Motor dinamico de inputs/outputs de tareas](../../../specs/008-motor-dinamico-inputs-outputs-tareas/spec-tecnica.md)
- [Spec 003 - Diseno y ejecucion de procesos](../../../specs/003-diseno-y-ejecucion-procesos/spec-tecnica.md)
- [Modulo orquestacion y ejecucion](../../fase-1-analisis-requerimientos/modulos/modulo-orquestacion-y-ejecucion.md)
