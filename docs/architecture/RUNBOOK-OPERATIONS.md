# RUNBOOK Operations

## Objetivo

Definir una guia operativa base para soporte, arranque, verificacion y recuperacion de la plataforma `Integration Hub` en ambientes on-prem.

## Alcance

- `DEV` sobre Docker
- `PRE` sobre un nodo
- `PROD` sobre Kubernetes HA

## Verificaciones diarias

- validar disponibilidad de la UI y API
- validar login OIDC contra Keycloak
- validar conectividad a PostgreSQL
- validar estado del scheduler
- validar ultimas ejecuciones fallidas
- validar trazas en OpenTelemetry y Jaeger

## Health checks

- `GET /q/health`
- `GET /q/health/live`
- `GET /q/health/ready`
- `GET /q/metrics`

## Arranque por ambiente

## DEV

- levantar PostgreSQL, Keycloak y observabilidad con Docker Compose
- iniciar Quarkus en modo desarrollo o binario local
- validar acceso a `http://localhost:8080`

## PRE

- validar nodo unico disponible
- validar secretos y configuracion externa
- desplegar nueva version
- ejecutar smoke test funcional

## PROD

- validar `load balancer`
- validar `ingress controller`
- validar `Integration Hub Service`
- validar `appPod1` y `appPod2`
- validar `PostgreSQL primary/replica`
- validar nodos de Keycloak

## Incidentes comunes

## Falla de autenticacion

- revisar disponibilidad de Keycloak
- revisar validez de realm, client y redirect URI
- revisar reloj del servidor
- revisar expiracion de token

## Falla de lectura de fuentes

- revisar credenciales en Kubernetes Secrets / External Config
- revisar conectividad a `FTP` o `SFTP`
- revisar permisos de filesystem
- revisar disponibilidad de API fuente

## Falla de ejecucion de procesos

- revisar `process_execution`
- revisar `process_task_execution`
- revisar `audit_event`
- revisar trazas de OpenTelemetry
- revisar timeouts de APIs externas

## Recuperacion

## Reinicio controlado de aplicacion

- drenar trafico si aplica
- reiniciar pods uno por uno en `PROD`
- validar health checks despues del reinicio

## Recuperacion de base de datos

- restaurar desde backup validado
- aplicar verificacion de integridad
- revalidar scheduler y ejecuciones pendientes

## Recuperacion de secretos y configuracion

- restaurar secretos desde repositorio seguro o mecanismo corporativo
- validar referencias en despliegue
- reiniciar aplicacion si los secretos no refrescan en caliente

## Evidencias minimas de operacion

- estado de health checks
- numero de procesos ejecutados
- numero de fallos por proceso
- ultima ejecucion programada
- capturas o enlaces de trazas relevantes

## Escalamiento

- `L1`: operacion basica y verificacion
- `L2`: equipo de plataforma / backend
- `L3`: infraestructura, base de datos, seguridad
