# Operacion continua aplicada

## Rutina diaria

- revisar disponibilidad UI y API
- revisar login OIDC
- revisar conectividad a PostgreSQL
- revisar scheduler
- revisar ejecuciones fallidas
- revisar trazas y auditoria

## Health checks

- `GET /q/health`
- `GET /q/health/live`
- `GET /q/health/ready`
- `GET /q/metrics`

## Incidentes comunes

- falla de autenticacion
- falla de lectura de fuentes
- falla de ejecucion de procesos
- problemas de secretos o configuracion

## Recuperacion

- reinicio controlado de aplicacion
- restauracion de base de datos
- restauracion de secretos y configuracion

## Escalamiento

- `L1`: operacion basica y verificacion
- `L2`: equipo de plataforma o backend
- `L3`: infraestructura, base de datos y seguridad
