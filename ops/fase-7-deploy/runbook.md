# Runbook de despliegue

## Flujo base

1. construir backend y frontend
2. validar pruebas minimas
3. desplegar a `DEV`
4. promover a `PRE`
5. ejecutar smoke tests
6. promover a `PRO`

## Verificaciones

- health checks
- login OIDC
- conectividad DB
- scheduler
- overview y auditoria
