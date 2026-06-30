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
- Para `trusted=true`, configurar claves publicas confiables en
  `integrationhub.plugins.backend.trusted-public-keys` con formato compatible:
  `keyId:base64(X.509 SubjectPublicKeyInfo EC P-256)` o
  `keyId:base64(X.509 SubjectPublicKeyInfo EC P-256):expiresAtUtc`. La firma del
  descriptor usa formato `keyId:base64(signature)` y se verifica con
  `SHA256withECDSA` sobre el payload canonico `id@version:integrity`.
- Para rotacion/revocacion inmediata, agregar `keyId` a
  `integrationhub.plugins.backend.revoked-key-ids`. Una clave revocada o expirada
  rechaza cualquier descriptor `trusted=true` firmado con ella, aunque la firma
  criptografica sea valida.
- Los descriptores rechazados no se publican como tipos remotos y quedan visibles
  como `degraded` en `GET /api/plugins`.
- La invocacion de un plugin pasa por `ResilientRemotePluginInvoker`: timeout de
  60s y circuit breaker comun antes del transporte concreto. Si no existe un
  `RemotePluginTransport` compatible con el descriptor, la ejecucion falla de
  forma controlada y el plugin queda `degraded`.
- Para transporte `KAFKA`/broker, `BrokerRemotePluginTransport` publica un
  `AsyncTaskEnvelope` en el broker resuelto por `MessageBrokerProvider`; la tarea
  queda `suspended` hasta que un consumer/sidecar reanude el proceso. El
  `idempotencyKey` es deterministico por plugin, ejecucion, tarea y tipo.
- El sidecar debe enviar el resultado al callback
  `POST /api/process-executions/resume/{resumeToken}` usando como body el contrato
  `RemoteTaskResumePayload`:

```json
{
  "pluginId": "acme-tasks",
  "taskType": "ACME_DO",
  "idempotencyKey": "plugin:acme-tasks:42:7:ACME_DO",
  "success": true,
  "details": "done by sidecar",
  "outputs": {
    "remoteRef": "R-100"
  }
}
```

- Si `integrationhub.resume.hmac.enabled=true`, el sidecar firma el body crudo con
  `ResumeCallbackSignature.headerValue(secret, rawBody)` y envia el resultado en
  `X-Signature`. El backend valida la misma firma antes de procesar el JSON.
- Al reanudar un plugin remoto, `RemoteTaskProvider` valida que `pluginId`,
  `taskType` e `idempotencyKey` coincidan con la suspension original. Si la
  correlacion no coincide, marca el plugin como `degraded` y falla la reanudacion.
- Sidecar de referencia para autores externos:
  `ejemplos/backend-plugin-sidecar`. Validacion local:

```powershell
mvn -pl platform-contract install
mvn -f ejemplos/backend-plugin-sidecar/pom.xml test
```

- Instalacion/actualizacion declarativa: `POST /api/plugins/install` registra o
  actualiza un descriptor en `plugin_descriptor`, valida politica/providedTypes y
  recarga el catalogo. Si `active=true`, el descriptor queda disponible de
  inmediato si pasa validacion.
- Recarga operativa: `POST /api/plugins/reload` (roles `PLATFORM_ADMIN` o
  `INTEGRATION_ADMIN`) recarga el registry desde `plugin_descriptor`.
- Activacion declarativa inicial: `POST /api/plugins/{id}/activate` marca el
  descriptor `active=true`, actualiza `updated_at` y recarga el catalogo.
- Rollback declarativo inicial: `POST /api/plugins/{id}/deactivate` marca el
  descriptor `active=false`, actualiza `updated_at` y recarga el catalogo.
- Diagnostico de tipos disponibles: `GET /api/task-types` muestra tipos builtin,
  locales y remotos. Para tipos remotos, revisar `status`:
  - `AVAILABLE`: resoluble por plugin remoto.
  - `DEGRADED`: plugin marcado con fallo o descriptor rechazado.
  - `UNTRUSTED`: descriptor instalado sin confianza.
  - `SHADOWED_BY_LOCAL`: existe un provider local/builtin con prioridad; el plugin
    queda visible para diagnostico, pero no se usa en ejecucion.
