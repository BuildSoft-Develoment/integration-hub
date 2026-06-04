# API Contract - Motor dinamico de inputs/outputs de tareas

[README principal](../../README.md) | [Specs](../README.md)

## Estado

Fase 0 documental. No se agregan endpoints nuevos en esta etapa.

## Contrato afectado

La evolucion impacta el cuerpo de `POST /api/process-definitions` y
`PUT /api/process-definitions/{processDefinitionId}` porque cada tarea mantiene su
`configurationJson`.

## Cambio esperado en payload

Los objetos de tarea deben aceptar `configurationJson` con:

- `taskRef`
- `dependsOn`
- `executionMode`
- `input`
- `inputs`
- `outputs`
- `retryPolicy`
- mappings por tipo de tarea

## Migracion

El API debe validar el contrato nuevo para procesos creados o editados:

- cada tarea requiere `taskRef`.
- cada tarea requiere `executionMode`.
- `batch` y `per-record` requieren `input`.
- una tarea no puede consumir outputs futuros o inexistentes.

Los procesos sin estos campos deben migrarse; no se define comportamiento legacy.
