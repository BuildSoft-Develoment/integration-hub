# Runbook - Tema del sistema (007-tema-del-sistema)

> Runbook operativo de la feature `007-tema-del-sistema`. Cobertura: `RF-001`, `RF-002`,
> `RF-003`. Reingenieria sobre codigo en produccion.

## Alcance
Configuracion unica (singleton) de apariencia/idioma/sidebar de la consola.
Endpoints `GET` y `PUT /api/system/theme`.

## SLO/SLI
> Objetivos baseline propuestos — pendientes de validacion con el equipo de operaciones.

- Disponibilidad del endpoint de tema: **disponibilidad >= 99.5%** mensual.
- Latencia de lectura/guardado (`GET`/`PUT /api/system/theme`): **p95 <= 300ms**.
- Tasa de error 5xx: **<= 1%** de las requests.

## Monitoreo
- Metricas Micrometer/Prometheus (`/q/metrics`).
- Alertar ante errores al cargar la configuracion (afecta el arranque visual de la consola).

## Procedimientos operativos
- **Despliegue / Rollback:** artefacto Quarkus; Flyway aditivo (V9/V10). Es solo configuracion: bajo riesgo.
- **Recuperacion:** si la configuracion se corrompe, restaurar valores por defecto via `PUT`.

## Troubleshooting
- La consola no aplica el tema: verificar respuesta de `GET /api/system/theme` y valores soportados.
- Valor invalido rechazado: ajustar a los catalogos de scheme/preset/density/sidebar.

## Escalamiento
- Nivel 1: equipo de plataforma de integracion.
- Nivel 2: TBD (definir con el equipo de operaciones).
