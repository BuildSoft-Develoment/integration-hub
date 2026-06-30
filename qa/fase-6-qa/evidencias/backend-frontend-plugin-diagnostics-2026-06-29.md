# Evidencia QA - Diagnostico de plugins front/back

Fecha: 2026-06-29  
Alcance: arquitectura modular extensible para plugins backend/frontend, diagnostico
observable y presupuesto de build frontend.

## Cambios validados

- Backend: `TaskProviderRegistry` conserva prioridad local y delega tipos remotos
  a `RemoteTaskProvider` cuando existe descriptor en `RemotePluginRegistry`.
- Backend: `plugin_descriptor` persiste descriptores externos y el core hidrata
  `RemotePluginRegistry` al arrancar desde descriptores activos.
- Backend: `PluginDescriptorTrustPolicy` valida procedencia operacional antes de
  activar descriptores (`GRPC` local/HTTPS allowlistado, transportes soportados,
  metadatos de firma/integridad y firma ECDSA P-256/SHA-256 contra clave publica
  confiable cuando `trusted=true`), con expiracion declarativa y revocacion por
  `keyId`.
- Backend: los descriptores rechazados por politica quedan visibles como
  `degraded` despues de la recarga atomica del registry.
- Backend: `RemotePluginDescriptor` conserva el `endpoint` validado y
  `ResilientRemotePluginInvoker` selecciona un `RemotePluginTransport` compatible
  detras de timeout/circuit breaker.
- Backend: `BrokerRemotePluginTransport` implementa transporte productivo
  asincrono por broker: publica `AsyncTaskEnvelope`, conserva idempotencia y deja
  la tarea `suspended` para reanudacion por sidecar/consumer.
- Backend: `RemoteTaskProvider` ahora es suspendible para plugins remotos; consume
  `RemoteTaskResumePayload` desde `externalEvent`, valida correlacion
  (`pluginId`, `taskType`, `idempotencyKey`) y convierte el callback en
  `TaskResult.success/failure`.
- Backend/contrato: `ResumeCallbackSignature` queda en `platform-contract` para
  que sidecars externos firmen `X-Signature` con el mismo algoritmo que valida el
  core.
- Ejemplo: `ejemplos/backend-plugin-sidecar` agrega un sidecar Maven autonomo que
  depende solo de `platform-contract`, consume `AsyncTaskEnvelope`, genera
  `RemoteTaskResumePayload`, firma `X-Signature` y preserva `idempotencyKey`.
- Backend: `POST /api/plugins/reload` y
  `POST /api/plugins/install` y `POST /api/plugins/{id}/activate|deactivate`
  agregan instalacion/upsert, recarga, activacion y rollback administrativo
  inicial sobre `plugin_descriptor`.
- Backend: `GET /api/plugins` expone diagnostico de plugins backend con RBAC.
- Backend: `GET /api/task-types` expone catalogo administrativo de tipos builtin,
  locales y remotos con estado (`AVAILABLE`, `DEGRADED`, `UNTRUSTED`,
  `SHADOWED_BY_LOCAL`) para hacer visibles conflictos de prioridad local/remota.
- Frontend: `/plugins` consume `/api/plugins` y muestra diagnostico backend junto
  al diagnostico de runtime frontend.
- Frontend: `federation.manifest.json` queda vacio por defecto; no hay remoto demo
  `mfe1`/`localhost:3000` cargado en arranque.

## Comandos ejecutados

### Backend unit/integration slice

```powershell
mvn -pl platform-app -am "-Dtest=TaskProviderRegistryTest,RemotePluginRegistryTest,RemoteTaskProviderTest,PluginDiagnosticsResourceTest,PluginDescriptorCatalogMapperTest" "-Dsurefire.failIfNoSpecifiedTests=false" test
```

Resultado:

- PASS.
- Tests: 18 ejecutados, 0 fallos, 0 errores, 0 omitidos.
- Nota no bloqueante: Maven informa relocation de `quarkus-junit5-mockito` a
  `quarkus-junit-mockito`; no afecta esta validacion.

### Backend trust-policy slice

```powershell
mvn -pl platform-app -am "-Dtest=BrokerRemotePluginTransportTest,BackendPluginAdminServiceTest,BackendPluginCatalogServiceTest,TaskProviderRegistryTest,RemotePluginRegistryTest,RemoteTaskProviderTest,PluginDiagnosticsResourceTest,PluginDescriptorCatalogMapperTest,PluginDescriptorTrustPolicyTest,ResilientRemotePluginInvokerTest" "-Dsurefire.failIfNoSpecifiedTests=false" test
```

Resultado:

- PASS.
- Tests: 50 ejecutados, 0 fallos, 0 errores, 0 omitidos.
- Cobertura puntual agregada:
  - plugin `GRPC` local trusted permitido para dev;
  - `integrity` y `signature` requeridos/formateados cuando `trusted=true`;
  - descriptor `trusted=true` acepta firma ECDSA valida sobre
    `id@version:integrity`;
  - descriptor `trusted=true` rechaza `keyId` no confiable y payload firmado
    alterado;
  - `http` no local rechazado;
  - `https` no local exige allowlist;
  - transporte no soportado rechazado;
  - descriptor sin `id` rechazado sin romper la recarga;
  - descriptor `KAFKA` permitido sin endpoint;
  - recarga con catalogo mixto conserva el plugin valido y expone el invalido como
    `degraded` despues de `replaceDescriptors`.
  - invoker resiliente delega al transporte compatible;
  - invoker resiliente falla de forma controlada cuando no hay transporte
    compatible.
  - recurso admin delega `reload` y `deactivate`;
  - recurso admin delega `activate`;
  - recurso admin delega `install`;
  - servicio admin marca descriptor activo/inactivo, actualiza timestamp y
    recarga catalogo;
  - servicio admin instala descriptor nuevo, actualiza descriptor existente y
    rechaza instalaciones sin tipos aportados;
  - repositorio de `plugin_descriptor` usa ID `String` (`PanacheRepositoryBase`).
  - transporte broker publica `AsyncTaskEnvelope` y deja la tarea suspendida;
  - transporte broker propaga rechazo del broker como fallo controlado;
  - transporte broker exige IDs de ejecucion/tarea para idempotencia.
- Notas no bloqueantes: warnings de Mockito dynamic agent y JBoss LogManager en
  test; el reactor termino `BUILD SUCCESS`.

### Backend remote resume slice

```powershell
mvn -pl platform-app -am "-Dtest=RemoteTaskProviderTest,ResumeCallbackSignatureVerifierTest,BrokerRemotePluginTransportTest,BackendPluginAdminServiceTest,BackendPluginCatalogServiceTest,TaskProviderRegistryTest,RemotePluginRegistryTest,PluginDiagnosticsResourceTest,PluginDescriptorCatalogMapperTest,PluginDescriptorTrustPolicyTest,ResilientRemotePluginInvokerTest" "-Dsurefire.failIfNoSpecifiedTests=false" test
```

Resultado:

- PASS.
- Tests: 62 ejecutados, 0 fallos, 0 errores, 0 omitidos.
- Cobertura adicional:
  - `RemoteTaskProvider` implementa `SuspendableTaskProvider`.
  - callback remoto exitoso produce `TaskResult.success` con outputs del sidecar.
  - callback remoto fallido produce `TaskResult.failure` conservando outputs de
    diagnostico.
  - callback con `idempotencyKey` inesperada marca el plugin como `degraded`.
  - callback sin `externalEvent` falla de forma controlada.
  - el verificador HMAC del endpoint usa el helper compartido
    `ResumeCallbackSignature`.
  - `platform-contract` compila con los nuevos contratos compartidos para
    sidecars.
  - se mantiene verde el slice de instalacion/activacion/trust-policy/broker.

### Backend remote resume focused rerun

```powershell
mvn -pl platform-app -am "-Dtest=RemoteTaskProviderTest,ResumeCallbackSignatureVerifierTest" "-Dsurefire.failIfNoSpecifiedTests=false" test
```

Resultado:

- PASS.
- Tests: 15 ejecutados, 0 fallos, 0 errores, 0 omitidos.
- Valida el ajuste posterior de normalizacion de `taskType` en la correlacion del
  callback remoto y el helper compartido de firma HMAC.

### Backend sidecar reference slice

```powershell
mvn -pl platform-contract install
mvn -f ejemplos/backend-plugin-sidecar/pom.xml test
```

Resultado:

- PASS.
- `platform-contract`: `BUILD SUCCESS`, jar instalado en el repositorio Maven
  local para simular consumo externo.
- `backend-plugin-sidecar-example`: 4 tests ejecutados, 0 fallos, 0 errores,
  0 omitidos.
- Cobertura:
  - callback de resume exitoso con body JSON y `X-Signature` valida;
  - propagacion de `idempotencyKey` y `traceId`;
  - `taskType` no soportado produce callback de failure firmado;
  - excepcion del handler externo produce callback de failure firmado;
  - payload JSON malformado falla antes de generar callback.

### Backend task type catalog slice

```powershell
mvn -pl platform-app -am "-Dtest=TaskTypeCatalogServiceTest,TaskTypeCatalogResourceTest,TaskTypeRegistryTest,TaskProviderRegistryTest,RemotePluginRegistryTest" "-Dsurefire.failIfNoSpecifiedTests=false" test
```

Resultado:

- PASS.
- Tests: 17 ejecutados, 0 fallos, 0 errores, 0 omitidos.
- Cobertura:
  - catalogo une tipos builtin, providers CDI locales y tipos remotos;
  - tipos remotos degradados muestran `DEGRADED` y razon;
  - descriptores remotos no confiables muestran `UNTRUSTED`;
  - tipos remotos que colisionan con local/builtin muestran
    `SHADOWED_BY_LOCAL`;
  - `GET /api/task-types` serializa la respuesta administrativa.

### Backend trust-key governance slice

```powershell
mvn -pl platform-app -am "-Dtest=PluginDescriptorTrustPolicyTest,BackendPluginAdminServiceTest,BackendPluginCatalogServiceTest,PluginDiagnosticsResourceTest" "-Dsurefire.failIfNoSpecifiedTests=false" test
```

Resultado:

- PASS.
- Tests: 31 ejecutados, 0 fallos, 0 errores, 0 omitidos.
- Cobertura agregada:
  - `trusted-public-keys` mantiene compatibilidad con formato
    `keyId:base64X509`;
  - formato extendido `keyId:base64X509:expiresAtUtc` acepta claves vigentes;
  - claves expiradas rechazan descriptores `trusted=true`;
  - `integrationhub.plugins.backend.revoked-key-ids` rechaza claves revocadas
    aunque la firma sea valida;
  - instalacion/admin/catalogo conservan compatibilidad con la politica.
- Nota no bloqueante: `mvn ... clean test` no pudo limpiar
  `platform-app/target/platform-app-dev.jar` porque estaba bloqueado por la app
  local/dev; se reejecuto el slice sin `clean` y termino `BUILD SUCCESS`. JaCoCo
  puede advertir datos previos mezclados si el target no se limpia.

### E2E localhost 8080 autenticado

Fecha: 2026-06-30
Credenciales usadas para la prueba local: usuario `admin`, clave provista por el
solicitante.

#### Bloqueo detectado y corregido

Al iniciar la prueba en `http://localhost:8080/`, Quarkus dev mostraba:

- `ApplicationStartException`.
- Configs incorrectas:
  - `integrationhub.plugins.backend.trusted-public-keys`
  - `integrationhub.plugins.backend.revoked-key-ids`
  - `integrationhub.plugins.backend.allowed-origins`

Causa: las propiedades vacias de plugins backend se inyectaban como `String`
obligatorio. Se corrigio `PluginDescriptorTrustPolicy` para inyectarlas como
`Optional<String>` y conservar compatibilidad con valores vacios.

Validacion posterior:

```powershell
mvn -pl platform-app -am "-Dtest=PluginDescriptorTrustPolicyTest,BackendPluginAdminServiceTest,BackendPluginCatalogServiceTest,PluginDiagnosticsResourceTest" "-Dsurefire.failIfNoSpecifiedTests=false" test
```

Resultado:

- PASS.
- Tests: 31 ejecutados, 0 fallos, 0 errores, 0 omitidos.

#### Stack local

```powershell
cmd.exe /c start-platform-stack.cmd
```

Resultado:

- PASS.
- `http://localhost:8080/q/health`: `UP`.
- `http://localhost:8080/api/plugins` sin sesion: `401`, esperado por RBAC.

#### API autenticada

Se obtuvo token real desde Keycloak:

```powershell
POST http://localhost:8180/realms/integration-hub/protocol/openid-connect/token
grant_type=password
client_id=integration-hub-api
client_secret=change-me
username=admin
password=***
```

Resultado de llamadas protegidas con Bearer:

- `/api/plugins`: PASS, `installed=0`.
- `/api/task-types`: PASS, `taskTypes=20`, primer tipo `FILE_READ`.

#### UI autenticada

Prueba Playwright headless contra `http://localhost:8080`:

- Login Keycloak con usuario `admin`: PASS.
- Redireccion post-login a `http://localhost:8080/#/overview`: PASS.
- Titulo visible: `Resumen - Integration Hub`.
- Ruta `/#/plugins`: PASS, titulo `Plugins - Integration Hub`, seccion
  `Backend (0)` visible.
- Ruta `/#/connections`: PASS, titulo `Conexiones - Integration Hub`, conexion
  `bdtrama` visible.

Capturas:

- `qa/fase-6-qa/evidencias/e2e-localhost-login-2026-06-30.png`
- `qa/fase-6-qa/evidencias/e2e-localhost-plugins-2026-06-30.png`
- `qa/fase-6-qa/evidencias/e2e-localhost-connections-2026-06-30.png`
- `qa/fase-6-qa/evidencias/e2e-localhost-post-login-2026-06-30.png`

Notas:

- La sesion del navegador integrado quedo bloqueada tras el error inicial de
  Quarkus; se uso Playwright headless local del workspace para completar la E2E.
- `fetch()` manual desde la pagina a `/api/plugins` y `/api/task-types` devolvio
  `401` porque no adjunta el token OIDC del cliente Angular; la validacion API
  protegida se hizo con Bearer token real de Keycloak.

### Frontend tests

```powershell
cmd.exe /c npx nx test web --skip-nx-cache --output-style=static
```

Resultado:

- PASS.
- Test files: 79 passed.
- Tests: 358 passed.

### Frontend build y presupuesto

```powershell
cmd.exe /c npx nx build web --skip-nx-cache --output-style=static
```

Resultado:

- PASS.
- `web:validate-plugins`: PASS, catalogo valido, manifests: 0.
- Bundle inicial production: 172.47 kB raw, 26.72 kB transfer estimado.
- Chunk lazy `plugin-diagnostics-page-component`: 11.27 kB raw, 1.47 kB transfer
  estimado tras marcar la consulta `/api/plugins` como feedback no disruptivo.

### Stack local

```powershell
cmd.exe /c start-platform-stack.cmd
```

Resultado:

- PASS.
- App health: `http://localhost:8080/q/health` respondio 200.
- Audit consumer: `CONSUMER_OK`.
- Flyway valido 70 migraciones y aplico `V70__backend_plugin_descriptor.sql`.
- Tabla verificada en Postgres: `to_regclass('public.plugin_descriptor') =
  plugin_descriptor`.
- Historial Flyway verificado: version `70`, descripcion
  `backend plugin descriptor`, `success=true`.
- Log de arranque: `Backend plugin descriptors loaded: 0`, esperado sin plugins
  externos activos instalados.
- `GET http://localhost:8080/api/plugins` sin sesion respondio 401, esperado por
  RBAC del endpoint.

## Evidencia visual / a11y

- La ruta `http://localhost:8080/#/plugins` se verifico autenticada con usuario
  `admin`.
- Captura: `qa/fase-6-qa/evidencias/backend-frontend-plugin-diagnostics-2026-06-29.png`.
- Estado visible validado:
  - Titulo: `Plugins - Integration Hub`.
  - Secciones: `Instalados (1)`, `En cuarentena (0)`, `Degradados (0)`,
    `Backend (0)`.
  - Tabla frontend: plugin `platform`, nombre `Integration Hub Platform`,
    version `1.0.0`, origen `Plataforma`.
  - Empty state backend: `No hay plugins de backend instalados.`
- Tras reiniciar Quarkus dev, el shell sirvio el bundle nuevo
  `main-3225VQT4.js`. Antes del reinicio, Quinoa seguia sirviendo el bundle
  anterior del proceso dev.
- Consola antes del ajuste mostro intentos de cargar
  `http://localhost:3000/remoteEntry.json` desde el remoto demo `mfe1`.
- Se elimino el remoto demo del manifest estatico; `rg "mfe1|localhost:3000"
  frontend\apps\web\public frontend\dist -n` no encontro referencias despues del
  build.
- La consulta de diagnostico backend usa `SKIP_GLOBAL_ERROR_FEEDBACK` para que un
  fallo opcional de `/api/plugins` muestre el estado local de la pagina sin
  disparar feedback global.
- La consola del navegador retenia un error antiguo (`ERROR E`) con timestamp
  previo al reinicio; no se observo nuevo error al cargar el bundle actualizado.

### Rerun E2E localhost autenticado

Fecha: 2026-06-30.

Datos usados: `http://localhost:8080`, usuario `admin`, clave provista por el
solicitante.

Validaciones:

- `GET http://localhost:8080/q/health`: PASS, estado `UP`.
- Token Keycloak password grant: PASS, `token_type=Bearer`.
- `GET /api/plugins` autenticado: PASS, `installed=0`.
- `GET /api/task-types` autenticado: PASS, `taskTypes=20`, contiene
  `FILE_READ`.
- Login UI: PASS, redireccion a `/#/overview`.
- Navegacion UI autenticada: PASS en `/#/plugins`, `/#/connections` y
  `/#/processes`.
- Estado esperado visible:
  - `/#/plugins`: `Backend (0)` y `No hay plugins de backend instalados.`
  - `/#/connections`: conexion `bdtrama`.
  - `/#/processes`: titulo `Procesos`.

Capturas:

- `qa/fase-6-qa/evidencias/e2e-localhost-overview-2026-06-30-rerun.png`.
- `qa/fase-6-qa/evidencias/e2e-localhost-plugins-2026-06-30-rerun.png`.
- `qa/fase-6-qa/evidencias/e2e-localhost-connections-2026-06-30-rerun.png`.
- `qa/fase-6-qa/evidencias/e2e-localhost-processes-2026-06-30-rerun.png`.

### Fix E2E `/processes` por import runtime de testing

Fecha: 2026-06-30.

Hallazgo reportado en navegador:

- Ruta: `http://localhost:8080/#/processes`.
- Error: `Unable to resolve specifier '@angular/core/testing' imported from
  http://localhost:8080/_foblex_flow.eeQJxwMt_t.js`.

Diagnostico:

- `@foblex/flow@18.3.0` publica helpers de `testing` en su `public-api`.
- Native Federation empaqueta `@foblex/flow` como externo compartido y mantiene
  imports a `@angular/core/testing` dentro del artefacto `_foblex_flow`.
- El runtime productivo usa `module-shim`; por eso el mapa debe declararse como
  `importmap-shim`, no como `importmap` HTML nativo.

Correccion:

- Se agrego un import map shim para resolver `@angular/core/testing` hacia un
  stub minimo servido por la aplicacion.
- Se agrego el asset `stubs/angular-core-testing.js` para cubrir solo los
  simbolos importados por helpers de testing no usados en runtime productivo.

Validaciones:

- `cmd.exe /c npx nx build web --skip-nx-cache --output-style=static`: PASS.
- `cmd.exe /c start-platform-stack.cmd`: PASS, health `UP`.
- `GET http://localhost:8080/stubs/angular-core-testing.js`: PASS, HTTP 200.
- Playwright autenticado con usuario `admin`: PASS.
- Navegacion `/#/processes`: PASS, titulo `Procesos - Integration Hub`.
- Consola relevante filtrada por `angular/core/testing`, `Unable to resolve
  specifier`, `_foblex_flow`, `ERROR Error`: sin eventos.

Captura:

- `qa/fase-6-qa/evidencias/e2e-localhost-processes-foblex-testing-fix-2026-06-30.png`.

### Correcciones UI/a11y y contratos frontend extensibles

Fecha: 2026-06-30.

Alcance:

- Shortcuts globales seguros: no se disparan dentro de campos editables y el
  registro devuelve cleanup local para no borrar atajos de plugins externos.
- Acciones masivas: confirmacion basada en contrato explicito
  `requiresConfirmation`/`confirmationLabelKey`, no en heuristica por texto.
- Listas de catalogo: foco por flechas queda scoped al componente; evita colision
  entre listas del core y listas instaladas por plugins.
- Estados de error/reintento: `sources`, `connections`, `readers`, `processes`,
  `executions`, `schedules` y `audit` exponen `error` traducible y `retry`.
- Semantica visual: pantallas principales exponen `h1` manteniendo la clase visual
  `ih-section-title`.
- Limpieza: se elimino el stub duplicado `frontend/apps/web/src/stubs`; queda solo
  el asset servido por `frontend/apps/web/public/stubs/angular-core-testing.js`.

Validaciones:

- `cmd.exe /c npx nx build web --skip-nx-cache --output-style=static`: PASS.
- `cmd.exe /c npx nx test web --skip-nx-cache --output-style=static`: PASS,
  `80` archivos de prueba y `361` tests.
- `cmd.exe /c start-platform-stack.cmd`: primer rerun bloqueado por `500 Internal
  Server Error` de Docker Hub al resolver `eclipse-temurin:25-jre`; se recupero
  Quarkus dev con `run-platform-app-dev-jdk25.cmd`.
- `GET http://localhost:8080/q/health`: PASS, estado `UP`.
- Smoke autenticado con cache-buster en `localhost:8080`: PASS en `/#/overview`,
  `/#/connections`, `/#/processes`, `/#/executions`, `/#/schedules`, `/#/audit`,
  `/#/audit/spool` y `/#/audit/mt101-quarantine`.
- Verificacion DOM: `h1` visible en rutas principales y submodulos audit
  validados; sin eventos relevantes de `@angular/core/testing`, `NG0908` o
  `_foblex_flow`.

Captura:

- `qa/fase-6-qa/evidencias/e2e-localhost-ui-a11y-extensible-fixes-2026-06-30.png`.

### Rerun final antes de commit

Fecha: 2026-06-30.

Cambios adicionales validados:

- Ruta legacy `/#/audit/events` redirige al catalogo canonico `/#/audit`.
- El scaffold Playwright de `frontend/apps/web-e2e` dejo de validar el placeholder
  `Welcome` y ahora cubre rutas reales con login Keycloak cuando se ejecuta con
  `BASE_URL=http://localhost:8080`.
- `KeyboardShortcutsService` cuenta con spec dedicado para campos editables,
  cleanup por registro y `preventDefault` en shortcuts coincidentes.

Validaciones:

- `cmd.exe /c npx nx test web --skip-nx-cache --output-style=static`: PASS,
  `80` archivos de prueba y `361` tests.
- `cmd.exe /c npx nx build web --skip-nx-cache --output-style=static`: PASS,
  `Initial total=172.39 kB`, `Estimated transfer=26.77 kB`.
- `mvn -q -pl platform-app -am "-Dtest=PluginDiagnosticsResourceTest,RemoteTaskProviderTest,ResumeCallbackSignatureVerifierTest,BackendPluginAdminServiceTest,BackendPluginCatalogServiceTest,PluginDescriptorTrustPolicyTest,TaskTypeCatalogServiceTest,BrokerRemotePluginTransportTest,TaskTypeCatalogResourceTest" "-Dsurefire.failIfNoSpecifiedTests=false" test`:
  PASS. Warnings esperados: descriptor unsafe ignorado por allowlist, Mockito
  inline mock maker y LogManager temprano.
- `cmd.exe /c start-platform-stack.cmd`: PASS inicial, app y audit-consumer
  reportados listos.
- `BASE_URL=http://localhost:8080 npx playwright test -c apps/web-e2e/playwright.config.ts --project=chromium`:
  BLOQUEADO por entorno local. Quarkus dev quedo intermitente y Playwright recibio
  `ERR_EMPTY_RESPONSE`; `platform-app-dev.out.log` mostro parada de
  `platform-app` tras el arranque y errores `Error Occurred After Shutdown`
  asociados a schedulers/EntityManagerFactory. No se observo reaparicion del
  error original `@angular/core/testing`/`_foblex_flow` en las validaciones
  previas autenticadas.

## Riesgos residuales

- Falta implementacion productiva del transporte `RemotePluginTransport` gRPC para
  plugins sin broker; el transporte broker asincrono ya existe.
- Falta prueba e2e con broker real. El sidecar runnable de referencia ya existe
  en `ejemplos/backend-plugin-sidecar`, y el core ya puede reanudar plugins
  remotos via `RemoteTaskResumePayload` + HMAC.
- Falta distribuir claves desde secret manager/trust store. La verificacion ECDSA,
  expiracion declarativa y revocacion por `keyId` ya estan disponibles por config.
- Falta flujo administrativo avanzado de marketplace/version pinning; instalacion
  declarativa, activacion, rollback/desactivacion y recarga ya tienen API inicial.
- Falta incorporar el rerun E2E local autenticado al pipeline CI; la navegacion
  local ya fue validada con Playwright headless contra `localhost:8080`.
- El log de ambiente local muestra un fallo no relacionado del scheduler MT101
  por autenticacion de Postgres; no impidio health ni la migracion V70.
