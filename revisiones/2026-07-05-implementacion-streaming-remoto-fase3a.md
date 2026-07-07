# Implementación — streaming remoto FASE 3a: reader input por referencia (#3)

Fecha: 2026-07-05
Alcance: migra el **input del reader remoto** de `contentBase64` a artefacto-por-referencia (la plataforma stagea el
archivo y presigna un GET; el plugin lo descarga). **Retira el guard v58**. Aplica los refinamientos del
[doble-check de Fase 3](2026-07-05-analisis-streaming-remoto-fase3.md). La **paginación de records queda para 3b**.
Fuera del money-path.

## Cambios (SOLID)

- **`ArtifactStaging` extendido** (contrato a ambos sentidos): `stageForDownload(InputStream, mediaType, size, ttl) →
  StagedDownload(ArtifactReference GET, key)` (la plataforma sube por streaming + presigna GET) + `deleteStaged(key)`
  (cleanup tras el READ — aquí el consumidor es el plugin, no la plataforma → no delete-on-close).
- **`S3ArtifactStaging`**: `stageForDownload` = `putObject` **por streaming** (`RequestBody.fromInputStream(content,
  size)`, sin materializar; fallback a bytes si el size es desconocido) + `presignGetObject`. `deleteStaged` =
  `deleteObject`. `UnconfiguredArtifactStaging`/`FakeArtifactStaging` implementan los métodos nuevos.
- **`RemoteReaderProvider.readInBatches` migrado**: **negocia `spiVersion`** (mayor ≥ 2, fail-fast) → `stage(payload)`
  (upload por streaming + presign GET) → incluye `artifactRef(GET)` en el READ → el plugin descarga y devuelve records →
  `deleteStaged` en `finally` (cleanup). **Retira `contentBase64` y el guard v58** (el input ya no va por gRPC).
- **`ReaderProviderRegistry`**: inyecta `ArtifactStaging` (constructor 4-arg); retira `max-content-bytes`.

## Pruebas (evidenciadas, 4 capas)

- **Unit `RemoteReaderProviderTest`** (2, reescrito del guard v58): con `FakeArtifactStaging` + invoker-stub que
  **descarga** el staged — `readInBatches` stagea, pasa `artifactRef(GET)`, el plugin recibe el input por referencia,
  devuelve records, y el input se limpia (`deleted.size()==1`); `spiVersion=1` → **fail-fast**.
- **Unit `ReaderProviderRegistryRemoteTest`** (migrado a `artifactRef`), `SourceProviderRegistryRemoteTest` (2) y
  `StreamingPipelineServiceTest` (7) siguen verdes.
- **E2E `RemoteReaderArtifactRefMinioIT`** (Testcontainers **MinIO real**, 2 tests): la plataforma stagea el input, el
  invoker-stub (plugin) lo **descarga por la URL GET presignada** (valida el `presignGetObject` nuevo, no solo el PUT de
  2a) y devuelve records → `readInBatches` retorna los counts y el **input staged se limpia** (0 objetos); y
  **(doble-check) leak-on-failure**: si el plugin **falla** el READ, el `finally { deleteStaged }` limpia el input igual
  (0 objetos, sin leak). BUILD SUCCESS ~9 s.
- **Doble-check (B)**: `SourcePayload.fromBytes` fija el `size` (`content.length`) → `stage()` pasa `size > 0` → se
  ejercita el **upload por streaming** (`RequestBody.fromInputStream`), no el fallback.
- **Regresión amplia**: 26 tests unit de reader/source/artifact/pipeline verdes.
- **Wiring CDI**: el app **bootea** (`/q/health/ready` 200, ~75 s) → `ReaderProviderRegistry` de 4 args + el producer
  `ArtifactStaging` resuelven sin `UnsatisfiedResolution`.

## Estado del proyecto #3

- Fase 1 (contrato+SDK): ✅ · 2a (staging+MinIO): ✅ · 2b (source por ref): ✅ · **3a (reader input por ref): ✅ HECHA**.
- **3b (paginación de records)**: siguiente — el plugin devuelve páginas con cursor; bounded para el streaming pipeline
  (`collectReadResult` materializa igual, preexistente). Fase 4 (broker), Fase 5 (retirar guard v58 — **ya hecho para el
  reader**): pendientes.

## Conclusión

El reader remoto ya no recibe el archivo en Base64: la plataforma lo stagea (upload por streaming), el plugin lo descarga
de una URL GET presignada de corta vida, y la plataforma limpia el input tras el READ. Retira el guard v58 (el input va
por S3, no por gRPC). Reusa `ArtifactStaging`, ahora bidireccional. La paginación de records (3b) queda pendiente.
