# Runbook - Catalogo de readers (002-catalogo-readers)

> Runbook operativo de la feature `002-catalogo-readers`. Cobertura: `RF-001`, `RF-002`,
> `RF-003`, `RF-004`, `RF-005`. Reingenieria sobre codigo en produccion.

## Alcance
Administracion del catalogo de readers (`reader_definition`): alta, edicion y activacion de
readers por formato (CSV/TXT/XLSX). Endpoints bajo `/api/reader-definitions`.

## SLO/SLI
> Objetivos baseline propuestos — pendientes de validacion con el equipo de operaciones.

- Disponibilidad del API de readers: **disponibilidad >= 99.5%** mensual.
- Latencia de lectura (`GET /api/reader-definitions`): **p95 <= 500ms**.
- Tasa de error 5xx: **<= 1%** de las requests.

## Monitoreo
- Metricas Micrometer/Prometheus (`/q/metrics`).
- Alertar ante errores de validacion de layout recurrentes por formato.

## Procedimientos operativos
- **Despliegue / Rollback:** igual que el resto de la plataforma (artefacto Quarkus, Flyway aditivo).
- **Validacion de layout:** cada formato valida su layout al crear el reader (RF-001..RF-003).

## Troubleshooting
- Reader no aparece para el disenador de procesos: verificar que este activo (RF-004, RF-005).
- Error de parseo en ejecucion: revisar el layout declarado vs el archivo real.

## Escalamiento
- Nivel 1: equipo de plataforma de integracion.
- Nivel 2: TBD (definir con el equipo de operaciones).
