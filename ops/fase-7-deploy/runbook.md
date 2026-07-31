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

## Despliegue real por ambiente

> Lo que habia aqui describia el bucle de desarrollo en la laptop (Quinoa sirviendo el bundle en
> `localhost:8080` tras `nx build web`). Eso es util para desarrollar, pero **no es el despliegue de
> ningun ambiente**: en todos los ambientes desplegados la UI viaja YA COMPILADA dentro del binario
> nativo. Se conserva el detalle de desarrollo en la guia de construccion, no aqui.

### On-premise (integracion y produccion chica)

Flujo **sin rebuild en destino**: se construye la imagen aqui, se exporta y se carga alla.

1. Build nativo con el perfil del subpath:
   `mvn -pl platform-app -am clean package -Dmaven.test.skip=true -Pnative,appih`
   `-Dquarkus.native.container-build=true`
2. Imagen desde `dist/common/Dockerfile.native` con el runner como `--build-arg RUNNER=...`
3. `docker save` de las imagenes -> `docker load` en el servidor -> `docker compose up -d`

Detalle completo, incluidos los gotchas del servidor: [`dist/README.md`](dist/README.md),
[`dist/NATIVE-STATUS.md`](dist/NATIVE-STATUS.md) y [`dist/onprem/int/README.md`](dist/onprem/int/README.md).

### Nube

Misma imagen nativa, desplegada por Helm: [`dist/common/helm/`](dist/common/helm/). Hay variantes por
proveedor en `dist/aws`, `dist/azure`, `dist/gcp` y `dist/oracle`.

### Antes de cualquiera de los dos

Pasar el [checklist de salida a produccion](../../docs/fase-7-deploy/07.00-checklist-salida-produccion.md),
que cubre la recreacion de base que exige ADR-023 y los seis controles bancarios. Y leer
[`rollback.md`](rollback.md): **esta release no es reversible solo con el artefacto**.
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
- Para distribuir claves desde trust store, configurar
  `integrationhub.plugins.backend.trust-store.path`,
  `integrationhub.plugins.backend.trust-store.type` (`PKCS12` por defecto) y
  `integrationhub.plugins.backend.trust-store.password` (directo o
  `${source:reference}` resuelto por `SecretResolver`). El alias del certificado se
  usa como `keyId` y la expiracion X.509 como limite operativo de la clave. Las
  claves inline y las del trust store no pueden repetir `keyId`.
- Para distribuir claves/revocaciones desde secret manager, configurar
  `integrationhub.plugins.backend.trusted-public-keys-ref` y/o
  `integrationhub.plugins.backend.revoked-key-ids-ref` con referencias
  `${source:reference}` resueltas por `SecretResolver`. El valor resuelto usa el
  mismo formato CSV de las propiedades inline.
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
- En Kafka, el value publicado es el payload JSON de trabajo y la metadata viaja
  en headers: `traceId`, `taskType`, `attempt`, `idempotencyKey`, `pluginId`,
  `pluginVersion` y `spiVersion`. El sidecar debe conservar `idempotencyKey` y
  `traceId` al generar el callback para mantener idempotencia y trazabilidad.
- Para transporte `GRPC`, el plugin debe implementar el servicio definido en
  `platform-app/src/main/proto/remote_plugin.proto`. El endpoint del descriptor
  acepta `http://host:port` en local/dev o `https://host:port` para ambientes no
  locales; el transporte aplica deadline de 60s y mapea el resultado remoto a
  `TaskResult`.
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
  `ejemplos/backend-plugin-sidecar`. El sidecar depende solo de
  `platform-contract`; `platform-app` lo usa en pruebas E2E solo como dependencia
  de test, no en runtime productivo. Validacion local:

```powershell
mvn -q -pl ejemplos/backend-plugin-sidecar -am test
mvn -q -pl platform-app -am "-Dtest=RemotePluginSidecarHttpE2EIT" "-Dsurefire.failIfNoSpecifiedTests=false" test
```

- El E2E `RemotePluginSidecarHttpE2EIT` instala un descriptor `trusted=true` con
  firma ECDSA valida, ejecuta un proceso `ACME_ECHO`, consume Kafka real, deja que
  el sidecar arme el callback firmado y reanuda por HTTP. Un descriptor
  `trusted=false` no ejecuta.
- Instalacion/actualizacion declarativa: `POST /api/plugins/install` registra o
  actualiza un descriptor en `plugin_descriptor`, valida politica/capabilities y
  recarga el catalogo. El payload acepta `providedTypes`, `providedSourceTypes`,
  `providedReaderTypes`, `marketplaceUrl`, `channel`, `pinnedVersion` y `pinned`.
  Si `active=true`, el descriptor solo queda disponible cuando pasa confianza,
  capabilities y el gate canary de metricas.
- Instalacion desde marketplace: `POST /api/plugins/marketplace/install` acepta
  `catalogUrl`, `pluginId`, `channel`, `pinnedVersion` y `active`. El backend
  descarga el catalogo JSON, selecciona la entrada exacta y aplica el mismo flujo
  de `install`. Si `pinnedVersion` viene informado, se instala esa version exacta;
  si se omite, se selecciona automaticamente la version semantica mas alta del
  plugin/canal. El catalogo debe enviar headers detached:
  `X-Plugin-Catalog-Integrity` con SRI `sha256/384/512` del body y
  `X-Plugin-Catalog-Signature` con `keyId:base64(signature)` sobre
  `catalogUrl:integrity`. El TTL del cache en memoria se configura con
  `integrationhub.plugins.marketplace.catalog-cache-ttl-seconds` (default `300`).
  Los catalogos verificados se persisten en `plugin_marketplace_catalog_cache`
  con estado, firma, integridad, expiracion y ultimo uso.
- Preflight de marketplace: `POST /api/plugins/marketplace/preview` acepta el
  mismo payload y devuelve el descriptor resuelto/validado sin persistir ni
  activar. Usarlo en pipelines de aprobacion para revisar version, capabilities,
  transporte, firma y pinning antes de ejecutar install.
- Para instalacion staged/canary manual, ejecutar marketplace install con
  `active=false`. La version queda registrada en `plugin_descriptor_version`, pero
  no reemplaza la proyeccion activa hasta llamar
  `POST /api/plugins/{id}/versions/{version}/activate`.
- Registrar muestras canary previas a la promocion con
  `POST /api/plugins/{id}/versions/{version}/canary/metrics`:

```json
{
  "taskType": "ACME_ECHO",
  "transport": "KAFKA",
  "success": true,
  "outcome": "SUCCESS",
  "durationMs": 25,
  "errorMessage": null
}
```

- La politica de promocion por defecto exige 3 muestras canary en las ultimas 24
  horas y ratio de fallo 0.0. Ajustar por ambiente con
  `integrationhub.plugins.canary.min-samples`,
  `integrationhub.plugins.canary.window-hours` y
  `integrationhub.plugins.canary.max-failure-ratio`.
- Toda activacion (`install active=true`, `POST /api/plugins/{id}/activate` o
  `POST /api/plugins/{id}/versions/{version}/activate`) consulta el mismo gate.
  No hay bypass legacy de activacion sin canary.
- Recarga operativa: `POST /api/plugins/reload` (roles `PLATFORM_ADMIN` o
  `INTEGRATION_ADMIN`) recarga el registry desde `plugin_descriptor`.
- Activacion declarativa inicial: `POST /api/plugins/{id}/activate` marca el
  descriptor `active=true`, actualiza `updated_at` y recarga el catalogo.
- Activacion por version instalada:
  `POST /api/plugins/{id}/versions/{version}/activate` copia la version desde
  `plugin_descriptor_version` hacia `plugin_descriptor`, valida confianza y recarga
  el registry. Usar este flujo para rollback/promotion entre versiones ya
  instaladas.
- Rollback declarativo inicial: `POST /api/plugins/{id}/deactivate` marca el
  descriptor `active=false`, actualiza `updated_at` y recarga el catalogo.
- Diagnostico de tipos disponibles: `GET /api/task-types` muestra tipos builtin,
  locales y remotos. Para tipos remotos, revisar `status`:
  - `AVAILABLE`: resoluble por plugin remoto.
  - `DEGRADED`: plugin marcado con fallo o descriptor rechazado.
  - `UNTRUSTED`: descriptor instalado sin confianza.
  - `SHADOWED_BY_LOCAL`: existe un provider local/builtin con prioridad; el plugin
    queda visible para diagnostico, pero no se usa en ejecucion.
- Source/reader remotos: `sourceType` y `readerType` son identificadores string
  normalizados en mayusculas. Si no existe provider CDI local, el registry busca
  capabilities `providedSourceTypes`/`providedReaderTypes` en plugins activos.
  Los adapters remotos requieren respuesta inmediata:
  - `SOURCE_SELECT:{TYPE}` debe devolver `outputs.files`.
  - `SOURCE_OPEN:{TYPE}` recibe `artifactRef` `PUT`; el plugin debe subir el
    archivo a esa URL presignada y puede devolver `outputs.mediaType`.
  - `READER_READ:{TYPE}` recibe `artifactRef` `GET` y debe devolver una pagina en
    `outputs.records`, opcionalmente `outputs.skippedRows` y `outputs.nextCursor`.
    Los readers remotos requieren el pipeline streaming; no se materializan via
    `collectReadResult`.
  Si el plugin responde `suspended` o no respeta el payload esperado, el plugin se
  marca `DEGRADED`; no se reintenta por un provider local alterno.
