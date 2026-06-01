# HU-06 Programar procesos

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [HU-05 Administrar conexiones](HU-05-administrar-conexiones.md)
- Siguiente: [Matriz de huecos de fase 1](../01.01-matriz-huecos-fase-1.md)
<!-- nav-guided:end -->

## Como

`Integration Admin`

## Quiero

programar la ejecucion automatica de procesos y ver las programaciones vigentes

## Para

que las integraciones corran solas segun su frecuencia, de forma gobernada y trazable

## Criterios de aceptacion

- permite marcar un proceso como programado (`scheduled`) y fijar su frecuencia (`schedule_every`)
- el scheduler dispara solo procesos activos y programados al vencer la frecuencia
- registra `next_run_at` y `last_run_at` por proceso
- permite consultar las programaciones vigentes (`GET /api/process-schedules`)
- el disparo programado deja la misma evidencia que la ejecucion manual (`trigger_source = scheduler`)

## Reglas de negocio

- solo procesos activos y marcados como programados son disparados
- la programacion es atributo del proceso (`process_definition`), no una entidad separada
- el scheduler no debe generar disparos duplicados ante reinicio o failover

## Trazabilidad

- RF global `RF-09` (y `RF-04`) · Modulo: orquestacion y ejecucion · Feature: `specs/006-programacion-procesos` · UC: `casos-de-uso/UC-06-programar-proceso.md`
