# Spec funcional - Diseno y ejecucion de procesos

## Objetivo

Permitir disenar procesos configurables y ejecutarlos de forma manual o programada.

## Actores

- `integration-admin`
- `operator`
- `scheduler`

## Flujo principal

1. Crear definicion de proceso.
2. Agregar tareas ordenadas.
3. Activar el proceso.
4. Ejecutar manualmente o por scheduler.
5. Revisar resultado y reprocesar si aplica.

## Requerimientos

- RF-001 crear y mantener definiciones de proceso con tareas ordenadas.
- RF-002 soportar tipos de tarea `FILE_READ`, `DB_WRITE`, `DB_EXECUTE_SP`, `DB_EXECUTE_FN`, `REST_CALL` y `NOTIFICATION`.
- RF-003 activar un proceso para habilitar su ejecucion.
- RF-004 ejecutar de forma manual o por scheduler.
- RF-005 registrar el resultado por ejecucion y por tarea, con linaje para reproceso.

## Reglas de negocio

- `FILE_READ` depende de fuente y reader validos
- las tareas se ejecutan en el orden definido (`task_order`)
- solo procesos activos son ejecutables
- la ejecucion debe dejar auditoria, trazas y detalle por tarea

## Criterios de aceptacion

- existe definicion persistida del proceso
- la ejecucion genera `processExecution`
- los errores quedan visibles y correlacionados

## Gates

Feature reconstruida por reingenieria sobre codigo en produccion; los gates de proceso se registran como `pending` hasta su validacion humana formal.

- `gate-spdd-approved`: pending
- `gate-prototype-ready`: pending
