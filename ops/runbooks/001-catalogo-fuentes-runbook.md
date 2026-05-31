# Runbook - Catalogo de fuentes (001-catalogo-fuentes)

> Runbook operativo de la feature `001-catalogo-fuentes`. Cobertura: `RF-001`, `RF-002`,
> `RF-003`, `RF-004`, `RF-005`. Reingenieria sobre codigo en produccion.

## Alcance
Administracion del catalogo de fuentes (`source_definition`): alta, edicion, prueba de
conectividad y activacion. Endpoints bajo `/api/source-definitions`.

## SLO/SLI
> Objetivos baseline propuestos — pendientes de validacion con el equipo de operaciones.

- Disponibilidad del API de catalogo: **disponibilidad >= 99.5%** mensual.
- Latencia de lectura (`GET /api/source-definitions`): **p95 <= 500ms**.
- Latencia de prueba de fuente (`POST /test`): **p95 <= 3000ms** (depende de la fuente externa).
- Tasa de error 5xx: **<= 1%** de las requests.

## Monitoreo
- Metricas Micrometer/Prometheus expuestas por Quarkus (`/q/metrics`).
- Alertar si 5xx supera el umbral o si la latencia p95 excede el SLO 5 min sostenidos.

## Procedimientos operativos
- **Despliegue:** artefacto Quarkus; migraciones de esquema gestionadas por Flyway al arranque.
- **Rollback:** redeploy de la version anterior; las migraciones son aditivas (no destructivas).
- **Secretos:** las fuentes referencian `${secret:...}`; verificar el vault antes de activar (RF-004).

## Troubleshooting
- Prueba de fuente falla: revisar conectividad de red y credenciales del vault.
- `configurationJson` invalido al crear: validar contra el esquema (RF-003).

## Escalamiento
- Nivel 1: equipo de plataforma de integracion.
- Nivel 2: TBD (definir con el equipo de operaciones).
