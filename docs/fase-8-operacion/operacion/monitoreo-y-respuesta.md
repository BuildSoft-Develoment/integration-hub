# Monitoreo y respuesta operativa

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Operacion continua](../08.00-operacion-continua.md)
- Siguiente: [Metricas y backlog evolutivo](metricas-y-backlog-evolutivo.md)
<!-- nav-guided:end -->

## Objetivo

Documentar la rutina minima de vigilancia y respuesta sobre la plataforma en operacion.

## Rutina diaria

- revisar disponibilidad UI y API
- revisar login `OIDC`
- revisar conectividad a `PostgreSQL`
- revisar scheduler
- revisar ejecuciones fallidas
- revisar trazas, auditoria y errores de integracion

## Health checks

- `GET /q/health`
- `GET /q/health/live`
- `GET /q/health/ready`
- `GET /q/metrics`

## Arranque por ambiente

### DEV

- levantar `PostgreSQL`, `Keycloak` y observabilidad con `docker compose`
- iniciar Quarkus en modo desarrollo o binario local
- validar acceso a `http://localhost:8080`

### PRE

- validar nodo unico disponible
- validar secretos y configuracion externa
- desplegar nueva version
- ejecutar smoke test funcional

### PROD

- validar `load balancer`
- validar `ingress controller`
- validar servicio de aplicacion
- validar pods de aplicacion
- validar `PostgreSQL` primary/replica
- validar nodos de `Keycloak`

## Incidentes comunes

- falla de autenticacion
- falla de lectura de fuentes
- falla de ejecucion de procesos
- problemas de secretos o configuracion

## Regla de respuesta

Toda incidencia recurrente debe dejar aprendizaje util en `ops/`, `releases/` o backlog evolutivo, no solo resolverse en caliente.

## Recuperacion

- drenar trafico si aplica y reiniciar pods uno por uno en `PROD`
- restaurar base de datos desde backup validado
- restaurar secretos desde mecanismo seguro y revalidar referencias

## Escalamiento

- `L1`: operacion basica y verificacion
- `L2`: equipo de plataforma o backend
- `L3`: infraestructura, base de datos y seguridad
