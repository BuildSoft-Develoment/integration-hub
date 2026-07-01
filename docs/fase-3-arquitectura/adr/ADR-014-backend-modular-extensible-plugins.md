# ADR-014 Backend modular extensible por plugins instalables

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

## Estado

Aceptado; base implementada (descriptor, registry, seam de invocacion,
`RemoteTaskProvider`, catalogo persistente `plugin_descriptor`, resolucion desde
`TaskProviderRegistry`, politica inicial de confianza/procedencia y diagnostico
administrativo `/api/plugins`).

Contraparte backend de [ADR-012](ADR-012-frontend-modular-extensible-plugins.md) y
[ADR-013](ADR-013-frontend-module-federation-remote-plugins.md). El frontend ya
permite plugins instalables desde fuera con gobernanza; esta ADR propone el modelo
equivalente para `platform-app` (Quarkus).

## Contexto

El motor ya es **extensible por SPI**, pero en build-time:

- Contratos SPI: `TaskProvider` (`type()` + `execute(TaskContext, config)`),
  `SourceProvider`, `ReaderProvider`, `PaymentMessageFormatter/Transport`,
  `ValidationRuleProvider`, `MessageBrokerProvider`.
- Resolucion por CDI: `TaskProviderRegistry` inyecta `Instance<TaskProvider>` y
  resuelve por `type()`; `TaskTypeRegistry` une los tipos builtin con los aportados
  por providers.
- Estructura actual: las verticales (SWIFT/MT101 en `provider/.../swift`, ISO20022/
  PAIN001 en `provider/.../iso20022`) son **paquetes compilados dentro de
  `platform-app`**, no modulos separados. El reactor Maven tiene tres modulos:
  `platform-contract` (contratos SPI compartidos, p.ej. `MessageBrokerProvider`),
  `platform-app` y `audit-consumer`.

Limitacion: anadir un proveedor nuevo exige recompilar/empaquetar el core. No hay
forma de **instalar una extension desde fuera** sin reconstruir `platform-app`.

Ademas, Quarkus es **build-time/closed-world**: el grafo CDI se resuelve en build y
el target puede ser nativo (GraalVM). Cargar JARs arbitrarios con beans CDI nuevos
en runtime no esta soportado de forma nativa. Es el mismo tipo de restriccion que
en el frontend obligo a Native Federation en vez de webpack: el modelo de build es
cerrado.

Riesgo agravado respecto al frontend: un plugin de backend ejecuta codigo con
acceso potencial a datos, secretos y red. La gobernanza (procedencia, permisos,
aislamiento) es aun mas critica.

## Decision

Adoptar plugins **out-of-process** como mecanismo de extension instalable desde
fuera, con un contrato estable y la misma gobernanza que el modelo frontend. Las
verticales de primera parte siguen como modulos de build.

### Opciones evaluadas

1. **Modulo de build.** Formaliza el estado actual: hoy las verticales son paquetes
   en `platform-app`; este modelo las extraeria a modulos Maven / extensiones
   Quarkus ensambladas en una distribucion. "Instalar" = reconstruir. Seguro y
   compatible con nativo, pero NO instalable en runtime. Se conserva para verticales
   de confianza (primera parte).
2. **Out-of-process (sidecar) [RECOMENDADO].** Cada plugin es un proceso/contenedor
   propio que expone el contrato SPI por un transporte estable. El core delega la
   ejecucion y nunca carga su codigo. Encaja con el modelo closed-world/nativo de
   Quarkus, da aislamiento real (crash, recursos, memoria), y permite despliegue,
   versionado y rollback independientes. Es el analogo backend del "remote" del
   frontend.
3. **In-process classloader aislado (JVM ServiceLoader + URLClassLoader).**
   RECHAZADO: incompatible con compilacion nativa, sin sandbox real (Java
   SecurityManager esta deprecado/eliminado), y el plugin correria en el mismo
   proceso con acceso completo. Riesgo inaceptable para codigo de terceros.

### Contrato de plugin

- Manifest del plugin: `id`, `version`, `platformVersion`, `spiVersion`,
  `capabilities`, `providedTypes` (tipos task/source/reader que aporta),
  `endpoint`/`image` y `signature`/`integrity`.
- Superficie SPI por el cable: el mismo contrato `TaskProvider` serializado. El core
  envia `TaskContext` + `configuration` + los registros necesarios y recibe un
  `TaskResult`. El plugin NO accede a la BD ni a secretos del core: solo opera sobre
  los datos que el core le pasa (frontera de datos explicita).
- Transporte agnostico tras un seam (analogo a `REMOTE_MODULE_LOADER` del front):
  `RemoteTaskProviderTransport`. Default recomendado **gRPC** (contrato tipado,
  streaming para lotes); alternativa asincrona sobre el broker ya existente
  (`MessageBrokerProvider`) para tareas largas.
- El contrato (SPI serializado + IDL) reside en `platform-contract`, el modulo
  compartido ya existente (donde hoy vive `MessageBrokerProvider`), para que el core
  y los autores de plugins dependan del mismo artefacto versionado.

### Procedencia, firma e integridad

- El artefacto/imagen del plugin se firma (p.ej. cosign/sigstore para imagenes de
  contenedor) y solo se admite si su firma valida contra una clave de confianza y su
  origen esta en una allowlist.
- El manifest declara `integrity` y `signature`; el core los verifica antes de
  activar el plugin (mismo principio que el verifier del frontend).

### Capabilities y permisos

- El plugin declara `capabilities` y el core las concede explicitamente: tipos que
  puede aportar, egress de red permitido, y limites de recursos. Sin secretos ni
  conexiones del core salvo las que el core medie y pase por el contrato.
- RBAC: un tipo de tarea aportado por plugin se sujeta a los mismos roles/permisos
  del motor; el plugin no amplia privilegios.

### Aislamiento (sandbox)

- Proceso/contenedor separado: aislamiento de crash, cuotas de CPU/memoria, y sin
  memoria compartida. Un plugin defectuoso no tumba el motor.
- Timeout + circuit breaker en el transporte (reutiliza el patron de
  `ResilientHttpSender`): un plugin que falla se marca `degraded` y el tipo de tarea
  queda no disponible, sin romper el resto del motor.

### Descubrimiento y resolucion

- Registro de plugins externos (tabla `plugin_descriptor` o catalogo firmado) con
  `id`, `version`, `endpoint`, `providedTypes`, estado.
- `TaskProviderRegistry` se extiende para incluir **providers remotos**: ante un
  `type()` no cubierto por un bean CDI local, resuelve un `RemoteTaskProvider` que
  delega en el endpoint del plugin via el transporte. `TaskTypeRegistry` une builtin
  + locales + remotos.

### Ciclo de vida y rollback

- Instalacion: registrar el descriptor (verificado) + health-check del endpoint.
- Activacion: el tipo aportado pasa a estar disponible solo si el plugin esta sano.
- Rollback declarativo: retirar/fijar la version previa del descriptor; el core no
  retiene codigo del plugin.

### Observabilidad

- Estado por plugin (`active`/`degraded`/`unavailable`) expuesto para una vista de
  administracion (equivalente a la vista `/plugins` del frontend).
- Auditoria de invocaciones a plugins por el trail existente (traceId del proceso).

## Consecuencias

- El motor pasa de extensible-en-build a extensible-en-runtime sin perder el modelo
  closed-world/nativo de Quarkus.
- Los plugins de terceros corren aislados; su procedencia se verifica y sus permisos
  se conceden explicitamente. Un plugin no accede a BD/secretos del core.
- Aparece coste operativo: gestion de firmas, despliegue de sidecars, y latencia de
  red por invocacion (mitigada por gRPC + breaker; tareas locales builtin no se ven
  afectadas).
- La frontera de datos del contrato obliga a serializar lo necesario; tareas que hoy
  asumen acceso directo al proceso deben pasar por el contrato.
- Las verticales de primera parte (MT101, PAIN001) pueden seguir como modulos de
  build por rendimiento y confianza; solo los plugins de terceros van out-of-process.

## Reglas

- Todo plugin externo declara `id`, `version`, `platformVersion`, `spiVersion`,
  `capabilities` y firma valida; sin firma/origen valido, no se activa.
- El plugin solo opera sobre los datos que el core le pasa por el contrato; nunca
  accede a BD, secretos o conexiones del core directamente.
- Un tipo aportado por plugin se sujeta al RBAC del motor; no amplia privilegios.
- Toda invocacion remota tiene timeout + circuit breaker; un fallo marca el plugin
  `degraded` y deja su tipo no disponible, sin tumbar el motor.
- El catalogo de descriptores es la unica fuente de verdad de que plugins externos
  estan activos; rollback = editar el catalogo.
- La compilacion nativa del core no depende de codigo de plugin.

## Alcance implementado (base)

- Contrato compartido `AsyncTaskEnvelope` (`platform-contract`) que cruza el broker
  y la frontera del plugin ([ADR-015](ADR-015-backend-task-async-broker-execution.md)).
- `RemotePluginDescriptor` (id, version, spiVersion, providedTypes, transport,
  endpoint, `trusted`) y `RemotePluginRegistry` (resolucion por tipo, listado de
  descriptores, tipos disponibles, rechazo de duplicados, recarga atomica del
  catalogo y estado `degraded`). Desde `V71`, el registry tambien indexa
  capacidades remotas declaradas de fuente y reader mediante
  `descriptorForSource`, `descriptorForReader`, `availableSourceTypes` y
  `availableReaderTypes`.
- Tabla persistente `plugin_descriptor` (`V70`) con identidad, version, version SPI,
  tipos aportados, transporte, endpoint, estado activo, confianza e integridad.
  `V71` extiende el descriptor con capacidades separadas para
  `providedSourceTypes`/`providedReaderTypes`, metadata de marketplace
  (`marketplaceUrl`, `channel`) y version pinning declarativo
  (`pinnedVersion`, `pinned`).
- Tabla persistente `plugin_marketplace_catalog_cache` (`V72`) para auditoria/cache
  del catalogo marketplace firmado: URL, body verificado, integridad, firma,
  estado, error, fecha de descarga, expiracion y ultimo uso.
- Tabla persistente `plugin_descriptor_version` (`V73`) para conservar multiples
  versiones instaladas por plugin. `plugin_descriptor` queda como proyeccion activa
  usada por el runtime, y una version instalada puede promoverse con activacion
  explicita.
- Tabla persistente `plugin_invocation_metric` (`V74`) para conservar muestras de
  invocacion/canary por `pluginId`, version, tipo, transporte, resultado,
  duracion, error y fecha. La promocion de versiones activas consulta estas
  metricas; no existe ruta legacy que active una version saltando el gate.
- `PluginDescriptorRepository`, `PluginDescriptorCatalogMapper` y
  `BackendPluginCatalogService`: al arrancar, el core hidrata
  `RemotePluginRegistry` desde descriptores activos y marca como degradados los
  descriptores malformados sin tumbar el motor.
- `PluginDescriptorTrustPolicy`: antes de publicar un descriptor activo en el
  registry valida identidad/version/SPI, transporte soportado (`GRPC`, `KAFKA`),
  endpoint `GRPC`, HTTPS obligatorio fuera de local dev, origen no local en
  `integrationhub.plugins.backend.allowed-origins`, integridad/firma en formato
  declarativo y firma ECDSA P-256/SHA-256 valida contra una clave publica
  configurada en `integrationhub.plugins.backend.trusted-public-keys` cuando
  `trusted=true`. La clave puede declarar expiracion (`expiresAtUtc`) y puede
  revocarse de inmediato con `integrationhub.plugins.backend.revoked-key-ids`.
  Los rechazados se exponen como `degraded` y no quedan disponibles para
  resolucion. La obtencion del material de confianza esta desacoplada por
  `PluginTrustMaterialProvider`: la implementacion base conserva claves inline,
  anade carga desde trust store (`integrationhub.plugins.backend.trust-store.*`)
  con password directo o referencia `${source:reference}`, y puede resolver claves
  confiables/revocaciones desde secret manager mediante
  `integrationhub.plugins.backend.trusted-public-keys-ref` y
  `integrationhub.plugins.backend.revoked-key-ids-ref`, apoyado en
  `SecretResolver`.
- `RemotePluginInvoker` (seam de invocacion, analogo a `REMOTE_MODULE_LOADER` del
  frontend), `RemotePluginTransport` (SPI de transporte instalable) y
  `ResilientRemotePluginInvoker` con timeout/circuit breaker comun antes del
  transporte concreto. Cada invocacion remota registra una
  `PluginInvocationMetric`; si el registro de la metrica falla, la invocacion no
  se oculta ni se degrada por fallback silencioso.
- `BrokerRemotePluginTransport`: implementacion productiva asincrona para
  descriptores `KAFKA`/broker; publica `AsyncTaskEnvelope` via
  `MessageBrokerProvider` + `TaskDispatchPublisher` y devuelve
  `TaskResult.suspended` con `traceId`, `idempotencyKey` y referencia del broker.
  El value Kafka es el payload JSON de trabajo y la metadata canónica viaja en
  headers (`traceId`, `taskType`, `attempt`, `idempotencyKey`, `pluginId`,
  `pluginVersion`, `spiVersion`) para que un sidecar reconstruya el contexto sin
  depender de parseos laterales.
- `GrpcRemotePluginTransport`: implementacion sin broker para descriptores `GRPC`.
  El contrato IDL vive en `platform-app/src/main/proto/remote_plugin.proto`; el
  core serializa `TaskContext`, atributos y configuracion como JSON dentro del
  request gRPC y mapea la respuesta a `TaskResult` (`success`, `failure` o
  `suspended`).
- `RemoteTaskProvider` implementa `SuspendableTaskProvider`: invocacion fallida o
  descriptor no confiable marcan `degraded`; cuando el transporte broker deja la
  tarea suspendida, el callback del sidecar se transforma en `TaskResult`
  validando `pluginId`, `taskType` e `idempotencyKey`.
- Contrato compartido para sidecars: `RemoteTaskResumePayload` define el JSON
  canonico de resultado remoto y `ResumeCallbackSignature` firma/verifica
  `X-Signature` HMAC-SHA256 sobre el body crudo del callback.
- Sidecar backend de referencia en `ejemplos/backend-plugin-sidecar`: ejemplo
  Maven autonomo que depende solo de `platform-contract`, consume
  `AsyncTaskEnvelope`, ejecuta un handler externo (`ACME_ECHO`), genera
  `RemoteTaskResumePayload`, firma `X-Signature` y conserva `idempotencyKey`.
  El ejemplo forma parte del reactor como artefacto de referencia y se usa en
  pruebas E2E del core solo en scope test; el runtime productivo de
  `platform-app` no depende del codigo del sidecar.
- Catalogo administrativo `GET /api/task-types`: expone tipos builtin, providers
  CDI locales y tipos remotos aportados por plugins con origen, provider/plugin,
  transporte, estado (`AVAILABLE`, `DEGRADED`, `UNTRUSTED`,
  `SHADOWED_BY_LOCAL`) y razon. Esto hace visible cuando un plugin remoto esta
  instalado pero no toma prioridad porque existe un tipo local/builtin.
- `TaskProviderRegistry` conserva prioridad de providers CDI locales y delega a
  `RemoteTaskProvider` cuando un tipo no local esta cubierto por un descriptor
  remoto; si no existe `RemotePluginInvoker`, falla rapido con diagnostico claro.
- `SourceDefinition` y `ReaderDefinition` usan identificadores `String` para
  `sourceType`/`readerType`; los enums cerrados fueron retirados del flujo
  productivo. `SourceProviderRegistry` y `ReaderProviderRegistry` conservan
  prioridad local y, si no hay provider CDI, resuelven `RemoteSourceProvider` o
  `RemoteReaderProvider` desde las capabilities activas del plugin. Estos adapters
  exigen resultado inmediato; una respuesta `suspended` falla y degrada el plugin,
  sin fallback a providers locales.
- Contrato remoto source/reader base:
  - Source `SOURCE_SELECT:{type}` devuelve `outputs.files`.
  - Source `SOURCE_OPEN:{type}` devuelve `outputs.contentBase64` y opcionalmente
    `outputs.mediaType`.
  - Reader `READER_READ:{type}` recibe `contentBase64`, `sourceFile`,
    `configuration` y `batchSize`, y devuelve `outputs.records` y
    `outputs.skippedRows`.
- Endpoint `GET /api/plugins` con RBAC (`PLATFORM_ADMIN`, `INTEGRATION_ADMIN`,
  `AUDITOR`) que expone plugins backend instalados, tipos aportados, transporte,
  confianza, estado y razon de degradacion.
- Endpoints administrativos iniciales `POST /api/plugins/reload` y
  `POST /api/plugins/install` y `POST /api/plugins/{id}/activate|deactivate`
  con RBAC administrativo para instalar/actualizar descriptores, recargar el
  catalogo persistente, activar descriptores existentes y ejecutar rollback
  declarativo sin reinicio manual. El request/response de instalacion ya transporta
  capacidades task/source/reader y metadata de marketplace/version pinning.
- `POST /api/plugins/marketplace/install`: instala desde un catalogo JSON remoto
  usando `catalogUrl`, `pluginId`, `channel` y `pinnedVersion`. Si el catalogo
  contiene multiples versiones compatibles y no se envia `pinnedVersion`, selecciona
  automaticamente la version semantica mas alta del plugin/canal; si se envia
  `pinnedVersion`, selecciona esa version exacta. El descriptor seleccionado vuelve
  a pasar por la misma politica de confianza antes de persistir.
  El catalogo se verifica con firma detached en headers
  `X-Plugin-Catalog-Integrity` y `X-Plugin-Catalog-Signature` antes de parsear el
  JSON, y se cachea en memoria por URL segun
  `integrationhub.plugins.marketplace.catalog-cache-ttl-seconds`. El mismo
  catalogo verificado queda persistido en `plugin_marketplace_catalog_cache` para
  reuso operativo y auditoria tecnica.
- `POST /api/plugins/marketplace/preview`: preflight administrativo para
  aprobacion/canary. Resuelve la misma entrada de marketplace, valida
  integridad/confianza/capabilities y devuelve el descriptor que se instalaria,
  sin persistir version ni recargar el registry. Permite separar revision humana o
  pipeline de aprobacion de la instalacion/activacion efectiva.
- `POST /api/plugins/{id}/versions/{version}/activate`: promueve una version
  instalada desde `plugin_descriptor_version` a la proyeccion activa
  `plugin_descriptor`, validando nuevamente confianza/capabilities y el gate
  canary de metricas antes de recargar el registry. `GET /api/plugins` expone
  tambien las versiones instaladas y marca cual coincide con la version activa.
- `PluginPromotionGate` desacopla la politica de promocion. La implementacion
  `MetricsPluginPromotionGate` exige por defecto al menos 3 muestras canary en las
  ultimas 24 horas y ratio de fallo 0.0
  (`integrationhub.plugins.canary.min-samples`,
  `integrationhub.plugins.canary.window-hours`,
  `integrationhub.plugins.canary.max-failure-ratio`). La misma regla aplica a
  `install(active=true)`, `activate` y `activateVersion`.
- `POST /api/plugins/{id}/versions/{version}/canary/metrics`: endpoint
  administrativo para registrar muestras canary externas/preflight antes de
  promover una version. El runtime tambien alimenta la misma tabla en invocaciones
  reales.
- La vista frontend `/plugins` consume `/api/plugins` y muestra el diagnostico
  backend junto con instalados/cuarentena/degradados del runtime frontend.
- Verde: unit tests de `RemotePluginRegistry`, `RemoteTaskProvider`,
  `TaskProviderRegistry`, `PluginDescriptorCatalogMapper`,
  `PluginDiagnosticsResource` y `PluginDiagnosticsPage`.

## Alcance pendiente (implementacion)

- E2E core -> Kafka real -> sidecar de referencia -> callback HTTP HMAC ->
  `RemoteTaskProvider.resume()` cubierto por `RemotePluginSidecarHttpE2EIT`. El
  descriptor usado en el E2E se instala como `trusted=true` con firma ECDSA valida;
  no existe ruta de ejecucion para plugins no confiables.
- Adapter productivo a secret manager corporativo administrado. El seam,
  `SecretResolver`, refs secretas y trust store ya estan implementados; falta
  elegir/probar proveedor real administrado (Vault/AWS/GCP/Azure) por ambiente.
- Marketplace avanzado: el canary con metricas historicas y gate de promocion ya
  existe como base. Queda pendiente orquestacion progresiva de trafico por
  porcentaje/segmento, politicas por canal y aprobacion automatizada desde un
  marketplace corporativo.
- Streaming remoto avanzado para `SourceProvider`/`ReaderProvider`: la base
  sincronica ya resuelve plugins externos y procesa payloads por contrato. Queda
  pendiente streaming/chunking nativo para archivos grandes y canary dedicado por
  operacion source/reader.
