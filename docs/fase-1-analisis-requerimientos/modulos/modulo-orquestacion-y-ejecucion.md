# Modulo orquestacion y ejecucion

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Modulo catalogo y conectividad](modulo-catalogo-y-conectividad.md)
- Siguiente: [Modulo observabilidad y seguridad](modulo-observabilidad-y-seguridad.md)
<!-- nav-guided:end -->

## Objetivo

Controlar la definicion, ejecucion, programacion y reproceso de procesos sobre fuentes, readers y tareas configurables.

## Entradas

- definiciones de proceso activas
- tareas configuradas como `FILE_READ`, `DB_WRITE`, `DB_EXECUTE_SP`, `DB_EXECUTE_FN`, `REST_CALL` y `NOTIFICATION`
- disparos manuales y programados
- variables de ejecucion y metadata por archivo

## Salidas

- corridas registradas con estado, tiempos y resultados
- archivos procesados y metricas por ejecucion
- reprocesos con linaje hacia ejecuciones origen
- resultados publicados para tareas posteriores o integraciones externas

## Reglas

- un proceso solo se ejecuta si esta activo y su configuracion es valida
- cada corrida genera una nueva ejecucion aunque provenga de un reproceso
- el scheduler no debe disparar procesos inactivos
- la secuencia de tareas debe respetar dependencias y outputs previos

## Integraciones

- `PostgreSQL` para `process_execution`, `process_task_execution`, `staging_record` y `processed_source_file`
- sistemas externos invocados por `REST_CALL`
- bases de datos y procedimientos usados por tareas `DB_*`

## Riesgos

- secuencias de tareas mal configuradas
- errores por alto volumen o timeouts
- reprocesos sin criterios claros de recuperacion
- acoplamiento excesivo a integraciones externas
