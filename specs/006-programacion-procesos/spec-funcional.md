---
origin: reingenieria
---

# Spec funcional - Programacion de procesos

## Objetivo

Permitir programar la ejecucion automatica de procesos (scheduling) y consultar las
programaciones vigentes, dejando que el motor dispare ejecuciones de los procesos activos
segun su frecuencia configurada.

## Actores

- `integration-admin` (configura la programacion del proceso)
- `operator`
- `auditor` (solo lectura de programaciones)
- `scheduler` (disparador del sistema, no es un rol RBAC)

## Flujo principal

1. En la definicion del proceso, marcarlo como programado (`scheduled`) y fijar su frecuencia (`schedule_every`).
2. El motor calcula el proximo disparo (`next_run_at`).
3. Al vencer, el scheduler dispara la ejecucion del proceso activo.
4. Se registra el ultimo disparo (`last_run_at`) y queda la ejecucion trazable.
5. Consultar las programaciones vigentes en el tablero de schedules.

## Requerimientos

- RF-001 marcar un proceso como programado (`scheduled`) y fijar su frecuencia (`schedule_every`).
- RF-002 disparar automaticamente ejecuciones de procesos activos y programados al vencer la frecuencia, registrando `next_run_at`/`last_run_at`.
- RF-003 consultar las programaciones vigentes (`GET /api/process-schedules`).
- RF-004 evitar disparos duplicados o solapados por reinicio o failover (idempotencia del scheduler).

## Reglas de negocio

- solo procesos **activos** y marcados `scheduled` son disparados por el scheduler
- la programacion es atributo del proceso (`process_definition`), no una entidad separada
- el scheduler no debe generar ejecuciones duplicadas por reinicio o failover no controlado
- el disparo programado deja la misma evidencia (auditoria/trazas/detalle) que la ejecucion manual, con `trigger_source` = scheduler

## Criterios de aceptacion

- un proceso programado se ejecuta solo al vencer su frecuencia
- `next_run_at` y `last_run_at` reflejan el ciclo de disparo
- las programaciones vigentes son consultables
- no hay duplicados ante reinicio del servicio

## Gates

Feature reconstruida por reingenieria sobre codigo en produccion; Fase 2 (prototipo/SPDD) no
aplica (`origin: reingenieria`). Los gates restantes se registran como `pending` hasta su
validacion humana formal.

- `gate-sdd-approved`: pending
- `gate-qa-passed`: pending
