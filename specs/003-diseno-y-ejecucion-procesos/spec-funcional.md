---
origin: reingenieria
---

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

### Evolucion: motor dinamico de inputs/outputs de tareas (ADR-004, WIP)

Evoluciona la ejecucion para que cada tarea consuma outputs tipados de cualquier tarea
anterior, declare su modo de ejecucion y publique outputs reutilizables. No reemplaza el
catalogo de fuentes/readers/conexiones ni la ejecucion actual; agrega un contrato estandar
de inputs/outputs, modos de ejecucion y procesamiento por lotes. Ver
[ADR-004](../../docs/fase-3-arquitectura/adr/ADR-004-motor-input-output-tareas.md).

- RF-006 cada instancia de tarea debe tener un `taskRef` estable para ser referenciada por
  tareas posteriores.
- RF-007 cada tarea consumidora debe poder leer `summary`, `records`, `table` y `errors`
  desde cualquier tarea anterior compatible.
- RF-008 la metadata de ejecucion debe ser transversal y estar disponible para todas las
  tareas sin modelarse como output de tarea.
- RF-009 cada tarea debe declarar `executionMode`: `once`, `per-record` o `batch`.
- RF-010 el modo `batch` debe soportar `batchSize`, checkpoint, reintentos e idempotencia
  por lote.
- RF-011 el disenador debe permitir cadenas lineales, fan-out y fan-in.
- RF-012 el mapping debe ser comun para columnas DB, parametros SP/FN, REST
  path/query/header/body y templates de notificacion.
- RF-013 los flujos de mas de `1,000,000` registros no deben transportar todos los
  registros en memoria entre tareas.

## Reglas de negocio

- `FILE_READ` depende de fuente y reader validos
- las tareas se ejecutan en el orden definido (`task_order`)
- solo procesos activos son ejecutables
- la ejecucion debe dejar auditoria, trazas y detalle por tarea
- (motor dinamico) una tarea no puede consumir outputs de una tarea futura y el grafo no
  debe tener ciclos
- (motor dinamico) `once` consume metadata, summaries u outputs agregados; `per-record` y
  `batch` consumen `records`/`table`/`errors`, y `batch` requiere `batchSize`
- (motor dinamico) `batch` es el modo recomendado para alto volumen; fan-out permite que
  varias tareas consuman el mismo output anterior y fan-in que una tarea consuma multiples
  summaries/errors/metadata
- (motor dinamico) `FILE_READ` conserva fuente y reader; las tareas posteriores no quedan
  acopladas al reader original

## Criterios de aceptacion

- existe definicion persistida del proceso
- la ejecucion genera `processExecution`
- los errores quedan visibles y correlacionados
- (UI) el disenador visual permite ordenar tareas (flow palette/node) y cada tipo de tarea tiene
  su formulario dedicado en `process-task-form/` que captura solo sus campos validos
- (UI) las tareas DB seleccionan una conexion del catalogo y mapean tabla/rutina destino;
  `REST_CALL` admite secretos via `${secret:...}`

## Gates

Feature reconstruida por reingenieria sobre codigo en produccion; los gates de proceso se registran como `pending` hasta su validacion humana formal.

- `gate-spdd-approved`: pending
- `gate-prototype-ready`: pending
