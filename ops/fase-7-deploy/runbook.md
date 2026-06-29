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

## Frontend servido por Quinoa

- `platform-app` sirve la UI desde `frontend/` via Quinoa
  (`quarkus.quinoa.ui-dir=../frontend`, `quarkus.quinoa.build-dir=dist/browser`).
- Despues de ejecutar `npx nx build web`, reiniciar Quarkus dev para que el runtime
  sirva el bundle nuevo. `start-platform-stack.cmd` no reinicia la app si el puerto
  `8080` ya esta escuchando.
- Smoke recomendado tras reinicio:
  - `http://localhost:8080/q/health` responde `200`.
  - Login Keycloak con usuario operativo.
  - `http://localhost:8080/#/plugins` muestra `Plugins - Integration Hub` y la
    seccion `Backend`.

## Plugins backend

- Los plugins externos backend se declaran en `plugin_descriptor`.
- El core hidrata descriptores activos al arrancar y los expone en
  `GET /api/plugins` con RBAC (`PLATFORM_ADMIN`, `INTEGRATION_ADMIN`, `AUDITOR`).
- Antes de activar un descriptor, el core valida la politica de confianza:
  `id`/`version`/`spiVersion`, transporte soportado (`GRPC`, `KAFKA`), endpoint
  `GRPC`, `https` fuera de local dev, origen no local configurado en
  `integrationhub.plugins.backend.allowed-origins`, e `integrity`/`signature` con
  formato valido cuando `trusted=true`.
- Los descriptores rechazados no se publican como tipos remotos y quedan visibles
  como `degraded` en `GET /api/plugins`.
- Rollback declarativo inicial: desactivar el descriptor (`active=false`) y
  reiniciar la app para recargar el catalogo.
