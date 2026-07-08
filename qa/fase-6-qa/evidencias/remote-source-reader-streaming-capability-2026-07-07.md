# Evidencia: Source/Reader remoto por artifactRef y fast path por capability - 2026-07-07

## Alcance

- Se reemplaza la elegibilidad hardcoded del fast path por capacidad del SPI:
  `ReaderProvider.supportsStreamingPipeline()`.
- `RemoteReaderProvider` declara `supportsStreamingPipeline()` y
  `requiresStreamingPipeline()` para impedir materializacion por `collectReadResult`.
- `FileReadRuntimeSupport.collectReadResult` falla rapido para readers que requieren
  streaming.
- `S3ArtifactStaging.stageForDownload` elimina el fallback `readAllBytes()`; el
  staging hacia descarga remota requiere longitud conocida y usa upload por stream.
- El sidecar de ejemplo expone `ArtifactTransfer.upload(ArtifactReference,
  InputStream, long)` para implementaciones externas sin byte-array obligatorio.

## Evidencia backend

```powershell
mvn -q -pl platform-app -am "-Dtest=RemoteReaderProviderTest,FileReadTaskFastPathTest,SourceProviderRegistryRemoteTest,ReaderProviderRegistryRemoteTest,ArtifactStagingProducerTest" "-Dsurefire.failIfNoSpecifiedTests=false" test
```

Resultado: PASS.

## Evidencia E2E / integracion

```powershell
mvn -q -pl platform-app -am "-Dtest=S3ArtifactStagingMinioIT,RemoteSourceArtifactRefMinioIT,RemoteReaderArtifactRefMinioIT" "-Dsurefire.failIfNoSpecifiedTests=false" test
```

Resultado: PASS. Ejecuta Testcontainers con MinIO real y valida:

- staging S3/MinIO con presigned PUT/GET.
- `RemoteSourceProvider` subiendo por `artifactRef` PUT.
- `RemoteReaderProvider` descargando por `artifactRef` GET.
- paginacion por `nextCursor` con `Range` GET contra MinIO real.

```powershell
mvn -q -pl platform-app -am "-Dtest=RemotePluginSidecarHttpE2EIT" "-Dsurefire.failIfNoSpecifiedTests=false" test
```

Resultado: PASS. Ejecuta PostgreSQL y Kafka reales via Testcontainers, promueve un
plugin remoto confiable, publica work-item al broker, corre sidecar de referencia
y completa el proceso por callback HTTP firmado con HMAC.

## Riesgo cubierto

- Un `REMOTE_CSV` o reader externo equivalente puede entrar al fast path por
  capability, sin modificar listas internas del engine.
- Un reader remoto ya no puede caer silenciosamente al camino materializado de
  `FILE_READ`.
- El staging S3/MinIO ya no carga en memoria archivos de tamano desconocido.

## Pendiente posterior

- E2E de volumen con broker/sidecar real para `RemoteReaderProvider`.
- Politica operativa para TTL renovable o TTL por tamano en transferencias largas.
- Canary/metricas dedicadas por operacion `SOURCE_OPEN`/`READER_READ`.

## Ejemplo externo plugin-demo

Se extendio `ejemplos/plugin-demo` para cubrir readers remotos externos reales de ejemplo
en los tres backends:

- `DEMO_REMOTE_CSV` declarado en `install/backend-java.json` como `providedReaderTypes`.
- `DEMO_REMOTE_CSV_NODE` declarado en `install/backend-node.json` como `providedReaderTypes`.
- `DEMO_REMOTE_CSV_PY` declarado en `install/backend-python.json` como `providedReaderTypes`.
- handlers gRPC `READER_READ:<readerType>`.
- descarga por `artifactRef` GET.
- paginacion por cursor usando `Range: bytes=<cursor>-`.

Validaciones ejecutadas:

```powershell
mvn -q -f ejemplos/plugin-demo/backend-grpc-java/pom.xml test
```

Resultado: PASS.

Cobertura: logica pura del reader, HTTP Range local y enrutamiento del servicio gRPC
`READER_READ:DEMO_REMOTE_CSV`.

```powershell
cmd.exe /c npm run build
```

Resultado: PASS en `ejemplos/plugin-demo/frontend-widget`.

```powershell
node --test test/transform.test.js test/demo-remote-csv-reader.test.js
```

Resultado: PASS en `ejemplos/plugin-demo/backend-grpc-node`.

Cobertura Node: logica pura de transform, descarga por HTTP Range local, cursor y rechazo
de `artifactRef.method` no GET.

Python queda implementado con la misma semantica (`DEMO_REMOTE_CSV_PY`). No se ejecuto la
unidad Python local porque `python`/`py` no estan disponibles en PATH.
