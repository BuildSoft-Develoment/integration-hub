# Evidencia - Backend plugin extensibility y pinning

## Alcance

- Metadata persistente para `providedSourceTypes`, `providedReaderTypes`,
  `marketplaceUrl`, `channel`, `pinnedVersion` y `pinned`.
- Registry remoto con indices separados para task/source/reader.
- Politica de confianza desacoplada via `PluginTrustMaterialProvider`.
- Proveedor base de trust material desde claves inline y trust store
  (`integrationhub.plugins.backend.trust-store.*`).
- Proveedor base de trust material desde secret manager via `SecretResolver`
  (`trusted-public-keys-ref`, `revoked-key-ids-ref`).
- Instalacion desde marketplace con seleccion por `pluginId`/`channel`/
  `pinnedVersion` y reutilizacion de la politica de confianza.
- Marketplace firmado con headers detached (`X-Plugin-Catalog-Integrity`,
  `X-Plugin-Catalog-Signature`) y cache TTL por URL.
- Cache/auditoria persistente de marketplace en `plugin_marketplace_catalog_cache`
  (`V72`).
- Version store paralelo en `plugin_descriptor_version` (`V73`) y activacion por
  version instalada.
- Metric store de runtime/canary en `plugin_invocation_metric` (`V74`) y gate de
  promocion sobre metricas historicas.
- Resolucion automatica de marketplace a la version semantica mas alta del
  plugin/canal cuando no se envia `pinnedVersion`; pin exacto cuando se envia.
- Preview/preflight de marketplace sin persistencia para aprobacion previa a
  instalacion o activacion.
- Endpoint administrativo para registrar muestras canary:
  `POST /api/plugins/{id}/versions/{version}/canary/metrics`.
- Politica `PluginPromotionGate` desacoplada: la implementacion por metricas
  bloquea `install(active=true)`, `activate` y `activateVersion` si la version no
  tiene ventana canary suficiente o excede el ratio de fallos.
- Transporte gRPC base con IDL `remote_plugin.proto` y mapeo a `TaskResult`.
- E2E core -> Kafka real para `BrokerRemotePluginTransport`, incluyendo headers
  canonicos, callback remoto firmado y reanudacion de `RemoteTaskProvider`.
- E2E core -> Kafka real -> sidecar de referencia -> callback HTTP HMAC ->
  cierre de proceso suspendido.
- Persistencia de descriptores/versiones corregida para poblar campos obligatorios
  antes de persistir entidades nuevas.
- `SourceDefinition`/`ReaderDefinition` migrados a identificadores `String` para
  permitir tipos externos sin enums cerrados.
- `SourceProviderRegistry`/`ReaderProviderRegistry` resuelven providers remotos
  declarados en capabilities cuando no existe provider CDI local.
- Adapters `RemoteSourceProvider` y `RemoteReaderProvider` con contrato sincronico
  y degradacion explicita ante resultado suspendido o payload invalido.

## Comandos ejecutados

```powershell
mvn -q -pl platform-app clean compile
```

Resultado: PASS.

```powershell
mvn -q -pl platform-app -am "-Dtest=BackendPluginAdminServiceTest,PluginDiagnosticsResourceTest,ResilientRemotePluginInvokerTest,MetricsPluginPromotionGateTest,PluginRuntimeMetricsRecorderTest" "-Dsurefire.failIfNoSpecifiedTests=false" test
```

Resultado: PASS. Incluye bloqueo de promocion sin muestras suficientes, rechazo
por ratio de fallo, registro transaccional de metricas, endpoint canary y
persistencia de metricas desde el invocador remoto.

```powershell
mvn -q -pl platform-app -am "-Dtest=SourceApiMapperTest,ReaderApiMapperTest,SourceCatalogServiceTest,CatalogQueryServiceTest,SourceProviderRegistryRemoteTest,ReaderProviderRegistryRemoteTest" "-Dsurefire.failIfNoSpecifiedTests=false" test
```

Resultado: PASS. Valida tipos source/reader como strings, normalizacion de tipos,
filtros de catalogo sin enums cerrados y resolucion remota source/reader desde
capabilities del plugin.

```powershell
mvn -q -pl platform-app "-Dtest=BrokerRemotePluginTransportKafkaIT" "-Dsurefire.failIfNoSpecifiedTests=false" test
```

Resultado: PASS. Levanta PostgreSQL 16 y Kafka 3.7.0 con Testcontainers, aplica
74 migraciones Flyway y verifica que `BrokerRemotePluginTransport` publique el
payload remoto al topic real `tasks.acme_do`, conserve metadata en headers Kafka
(`traceId`, `taskType`, `idempotencyKey`, `pluginId`), produzca un callback
`RemoteTaskResumePayload` firmado con `ResumeCallbackSignature` y que
`RemoteTaskProvider.resume()` complete la tarea con la correlacion esperada.

```powershell
mvn -q -pl ejemplos/backend-plugin-sidecar,platform-app -am -DskipTests compile
```

Resultado: PASS. Compila el sidecar de referencia dentro del reactor y confirma
que `platform-app` solo lo consume en scope test.

```powershell
mvn -q -pl platform-app -am "-Dtest=RemotePluginSidecarHttpE2EIT" "-Dsurefire.failIfNoSpecifiedTests=false" test
```

Resultado: PASS. Levanta PostgreSQL 16 y Kafka 3.7.0 con Testcontainers, instala
un descriptor remoto `trusted=true` firmado con ECDSA como version staged
`active=false`, registra 3 muestras canary sanas, promueve la version por
`activateVersion`, ejecuta un proceso `ACME_ECHO`, consume el work-item Kafka con
el sidecar de referencia, firma `RemoteTaskResumePayload` con HMAC y reanuda por HTTP
`/api/process-executions/resume/{token}` hasta dejar proceso/tarea en
`COMPLETED`.

```powershell
mvn -q -pl ejemplos/backend-plugin-sidecar -am test
```

Resultado: PASS. Confirma que el sidecar de referencia sigue compilando/probando
como modulo externo de contrato, sin dependencia productiva desde `platform-app`.

```powershell
mvn -q -pl platform-app -am "-Dtest=KafkaPublishIT,BrokerRemotePluginTransportKafkaIT,RemotePluginSidecarHttpE2EIT" "-Dsurefire.failIfNoSpecifiedTests=false" test
```

Resultado: PASS. Regresion integrada de broker, transporte remoto y sidecar E2E
con PostgreSQL/Kafka reales via Testcontainers.

## Observaciones

- El transporte broker existente sigue verde; se corrigio la publicacion Kafka
  para propagar headers del `OutboundMessage`, alineando implementacion con
  `AsyncTaskMessageCodec`.
- La ejecucion remota de `SourceProvider`/`ReaderProvider` queda documentada como
  pendiente real porque el catalogo funcional actual usa enums cerrados
  (`SourceType`, `ReaderType`).
- El E2E con sidecar de referencia ya cruza el endpoint HTTP real de resume. El
  runtime productivo no depende del ejemplo; se conserva aislamiento out-of-process
  por contrato y despliegue.
- El canary basico con metricas reales ya esta implementado. Queda pendiente
  orquestacion progresiva de trafico/segmentos y aprobacion automatizada ligada a
  marketplace corporativo.
- Source/reader remoto queda habilitado para resultados sincronicos. Queda
  pendiente streaming/chunking remoto para archivos grandes.
