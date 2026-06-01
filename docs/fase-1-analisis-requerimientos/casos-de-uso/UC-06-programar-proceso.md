# UC-06 Programar proceso

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [UC-05 Configurar conexion](UC-05-configurar-conexion.md)
- Siguiente: [UC-07 Configurar tema del sistema](UC-07-configurar-tema.md)
<!-- nav-guided:end -->

## Actor principal

`Integration Admin` (configura); `Scheduler` (dispara, actor de sistema)

## Trazabilidad

- RF global: `RF-09` (y `RF-04` ejecucion programada) · Modulo: orquestacion y ejecucion · Feature: `specs/006-programacion-procesos`

## Precondiciones

- existe un proceso definido y activo
- el usuario tiene permisos administrativos

## Flujo principal

1. El usuario marca el proceso como programado (`scheduled`) y fija su frecuencia (`schedule_every`).
2. El motor calcula el proximo disparo (`next_run_at`).
3. Al vencer la frecuencia, el `Scheduler` dispara la ejecucion del proceso activo.
4. Se registra el ultimo disparo (`last_run_at`) y la ejecucion con `trigger_source = scheduler`.
5. El usuario consulta las programaciones vigentes (`GET /api/process-schedules`).

## Flujos alternos

- el proceso esta inactivo o no marcado como programado: el scheduler no lo dispara
- reinicio/failover del servicio: el scheduler no debe duplicar disparos (idempotencia)
- la ejecucion programada falla: queda trazable y reprocesable como cualquier corrida

## Postcondiciones

- el proceso queda programado con su proximo disparo calculado
- las programaciones vigentes son consultables
- cada disparo deja la misma evidencia (auditoria/trazas/detalle) que la ejecucion manual
