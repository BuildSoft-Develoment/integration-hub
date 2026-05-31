# Runbook - Observabilidad y auditoria (004-observabilidad-y-auditoria)

> Runbook operativo de la feature `004-observabilidad-y-auditoria`. Cobertura: `RF-001`,
> `RF-002`, `RF-003`, `RF-004`, `RF-005`. Reingenieria sobre codigo en produccion.

## Alcance
Consulta de ejecuciones, tareas, linaje, resumen operativo y eventos de auditoria.
Endpoints de solo lectura bajo `/api/query/*`. Correlacion por `processExecutionId`.

## SLO/SLI
> Objetivos baseline propuestos — pendientes de validacion con el equipo de operaciones.

- Disponibilidad de los tableros de consulta: **disponibilidad >= 99.5%** mensual.
- Latencia de consulta paginada (`/process-executions`): **p95 <= 800ms**.
- Latencia de resumen operativo (`/overview-summary`): **p95 <= 1200ms**.
- Frescura de eventos de auditoria: **latencia de ingestion <= 5** segundos desde el evento.

## Monitoreo
- Metricas de consulta y de auditoria via Micrometer (`/q/metrics`).
- Alertar si la latencia de los tableros excede el SLO o si caen los eventos de auditoria.

## Procedimientos operativos
- **Despliegue / Rollback:** artefacto Quarkus; Flyway aditivo. Las consultas son de solo
  lectura: el rollback no afecta datos historicos.
- **Retencion:** politica de retencion de `audit_event` / `process_execution` — TBD con el
  equipo de datos.

## Troubleshooting
- Tableros lentos: revisar indices de `process_execution` / `audit_event` y volumen de datos.
- Falta correlacion: verificar que `processExecutionId` se propague en toda la cadena (RF-005).

## Escalamiento
- Nivel 1: equipo de plataforma de integracion.
- Nivel 2: TBD (definir con el equipo de operaciones).
