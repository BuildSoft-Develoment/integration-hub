# Runbook - Programacion de procesos (006-programacion-procesos)

> Runbook operativo de la feature `006-programacion-procesos`. Cobertura: `RF-001`, `RF-002`,
> `RF-003`, `RF-004`. Reingenieria sobre codigo en produccion.

## Alcance
Programacion (scheduling) de procesos: marcar `scheduled`/`schedule_every`, disparo automatico
por el scheduler y consulta de programaciones (`GET /api/process-schedules`).

## SLO/SLI
> Objetivos baseline propuestos — pendientes de validacion con el equipo de operaciones.

- Disponibilidad del scheduler: **disponibilidad >= 99.5%** mensual.
- Puntualidad del disparo: **desviacion p95 <= 60** segundos respecto a `next_run_at`.
- Tasa de disparos duplicados: **<= 0** ante reinicio/failover (idempotencia).
- Latencia de consulta (`GET /api/process-schedules`): **p95 <= 800ms**.

## Monitoreo
- Metricas del scheduler (disparos, retrasos, fallos) via Micrometer (`/q/metrics`).
- Alertar ante procesos programados que no disparan o disparos duplicados.

## Procedimientos operativos
- **Despliegue / Rollback:** pausar el scheduler antes de un redeploy si hay ejecuciones largas.
- **Recuperacion:** ante failover, verificar que no haya disparos duplicados (revisar `last_run_at`).

## Troubleshooting
- Proceso programado no dispara: verificar que este `active` y `scheduled` y su `next_run_at`.
- Disparos duplicados: revisar la idempotencia del scheduler y el estado de `last_run_at`.

## Escalamiento
- Nivel 1: equipo de plataforma de integracion.
- Nivel 2: TBD (definir con el equipo de operaciones).
