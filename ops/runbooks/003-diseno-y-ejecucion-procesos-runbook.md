# Runbook - Diseno y ejecucion de procesos (003-diseno-y-ejecucion-procesos)

> Runbook operativo de la feature `003-diseno-y-ejecucion-procesos`. Cobertura: `RF-001`,
> `RF-002`, `RF-003`, `RF-004`, `RF-005`. Reingenieria sobre codigo en produccion.

## Alcance
Diseno de procesos con tareas ordenadas y su ejecucion (manual/programada). Endpoints bajo
`/api/process-definitions` y consulta de ejecuciones en `/api/query/process-executions`.

## SLO/SLI
> Objetivos baseline propuestos — pendientes de validacion con el equipo de operaciones.

- Disponibilidad del motor de ejecucion: **disponibilidad >= 99.5%** mensual.
- Latencia de arranque de ejecucion manual: **p95 <= 2000ms** hasta crear el `process_execution`.
- Throughput de procesamiento: **throughput >= 100** registros/seg por pipeline (baseline).
- Tasa de ejecuciones fallidas: **<= 2%** (excluyendo errores de datos de la fuente).

## Monitoreo
- Metricas de ejecucion (duracion, registros procesados, fallos) via Micrometer (`/q/metrics`).
- Alertar ante acumulacion de ejecuciones en estado de error o colas crecientes del scheduler.

## Procedimientos operativos
- **Despliegue / Rollback:** artefacto Quarkus; Flyway aditivo. Pausar el scheduler antes de
  un redeploy si hay ejecuciones largas en curso.
- **Reproceso:** usar el linaje de ejecuciones (`children`) para reprocesar de forma trazable.

## Troubleshooting
- Proceso no ejecuta: verificar que este activo (RF-003) y que sus readers/fuentes esten activos.
- Tarea DbWrite falla: revisar conectividad y permisos del destino (RF-002).

## Escalamiento
- Nivel 1: equipo de plataforma de integracion.
- Nivel 2: TBD (definir con el equipo de operaciones).
