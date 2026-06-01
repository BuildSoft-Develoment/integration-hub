# Runbook - Catalogo de conexiones (005-catalogo-conexiones)

> Runbook operativo de la feature `005-catalogo-conexiones`. Cobertura: `RF-001`, `RF-002`,
> `RF-003`, `RF-004`, `RF-005`. Reingenieria sobre codigo en produccion.

## Alcance
Catalogo de conexiones JDBC (`ORACLE`/`POSTGRESQL`/`SQLSERVER`/`MYSQL`/`MONGODB`): alta, prueba,
activacion e introspeccion de metadata. Endpoints bajo `/api/connection-definitions`.

## SLO/SLI
> Objetivos baseline propuestos — pendientes de validacion con el equipo de operaciones.

- Disponibilidad del API de conexiones: **disponibilidad >= 99.5%** mensual.
- Latencia de lectura (`GET /api/connection-definitions`): **p95 <= 500ms**.
- Latencia de prueba/introspeccion (`/test`, `/jdbc-metadata/*`): **p95 <= 3000ms** (depende del motor remoto).
- Tasa de error 5xx: **<= 1%** de las requests.

## Monitoreo
- Metricas Micrometer/Prometheus (`/q/metrics`).
- Alertar ante fallos recurrentes de `/test` o de introspeccion por motor.

## Procedimientos operativos
- **Despliegue / Rollback:** artefacto Quarkus; Flyway aditivo.
- **Secretos:** los parametros de conexion usan `${secret:...}`; verificar el vault antes de activar.
- **Rotacion de credenciales:** actualizar el secreto referenciado; no requiere recrear la conexion.

## Troubleshooting
- `/test` falla: revisar red, driver/url y credenciales del vault.
- Introspeccion vacia: validar permisos del usuario de BD sobre el esquema.
- `MONGODB`: no expone rutinas (procedures/functions); es esperado.

## Escalamiento
- Nivel 1: equipo de plataforma de integracion.
- Nivel 2: TBD (definir con el equipo de operaciones).
