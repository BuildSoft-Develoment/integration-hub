# Análisis — streaming remoto FASE 3 (reader por referencia + paginación) — #3

Fecha: 2026-07-05
Tipo: **análisis** (validación contra código real; sin implementar). Planifica la **Fase 3**: migrar el **reader**
remoto. Fuera del money-path. Construye sobre `ArtifactStaging` (2a) y el patrón de 2b.

## Dirección (inversa al source)

El **reader** lee records de un archivo que **la plataforma tiene** (un `SourcePayload`) y se lo envía al plugin para
que lo parsee. Hoy: `RemoteReaderProvider` hace `readAllBytes` → Base64 → dentro de `configuration_json`, y el plugin
devuelve `outputs.records` (TODA la lista) → batching cosmético. Dos problemas: (i) el **envío** (input) es Base64 (no
escala), (ii) la **respuesta** (records) es O(todos) en memoria.

## Dos partes

### 3a — input por referencia (bounded, análogo a 2b)
La plataforma **stagea el archivo de entrada** (sube el `SourcePayload` a S3/MinIO), **presigna un GET**, y pasa
`artifactRef(GET)` en el payload READ; el plugin **descarga** por streaming (vía `ArtifactTransfer` de Fase 1). Retira el
`contentBase64` del envío. Requiere extender `ArtifactStaging` con un método inverso:
`stageForDownload(InputStream) → StagedDownload(ArtifactReference GET, key)` (la plataforma sube + presigna GET) +
cleanup delete-after-use. Reusa el `S3Client`/`S3Presigner` (presignGetObject).

### 3b — paginación de records (dimensión nueva, HABILITADA por el consumer model)
**Hallazgo clave (verificado, con matiz del doble-check)**: el **streaming pipeline** (`StreamingPipelineWorker`/
`Service`) procesa cada batch en el **callback `ReadBatchConsumer.accept`** y del `ReadResult` devuelto usa **solo
`recordCount()`/`skippedCount()`/`skippedRows()`, NO `records()`** → el remote reader puede **streamear páginas** por el
consumer y devolver un `ReadResult` con **records vacíos**, y ese path queda **bounded**. **PERO** (ver §doble-check) hay
un segundo path, `collectReadResult` (`ProcessTaskRuntimeService`), que **acumula todos los records** — la paginación no
lo acota (aunque el `ReadResult` vacío tampoco lo rompe). El beneficio de memoria de la paginación aplica al **streaming
pipeline**.

Protocolo paginado: `READ(cursor)` → el plugin devuelve una **página** de records + `nextCursor` (+ skips); la plataforma
hace `consumer.accept(batch)` y repite con `nextCursor` hasta agotar (**cursor + checkpoint**, como el reader local de
alto volumen). Acota la memoria de la plataforma a **una página**.

## Diseño (SOLID)

- **`ArtifactStaging.stageForDownload(InputStream, mediaType, ttl)`** (nuevo método) + impl S3 (`putObject` del stream +
  `presignGetObject`) + `deleteStaged(key)` (cleanup tras el READ, ya no delete-on-close porque el consumidor es el
  plugin, no la plataforma).
- **`RemoteReaderProvider.readInBatches` migrado**: negocia `spiVersion` (reader por referencia) → `stageForDownload` del
  payload → `artifactRef(GET)` en el READ → **loop de páginas** con cursor: `invoke(READ, {artifactRef, cursor})` →
  `consumer.accept(page)` → hasta `nextCursor` vacío → `deleteStaged` → `ReadResult(List.of(), total, skipped, skips)`.
  Retira `contentBase64` del envío y la acumulación total de records.
- **`ReaderProviderRegistry`** inyecta `ArtifactStaging` (constructor) y lo pasa al provider (junto al `maxContentBytes`
  del guard v58).
- **Guard v58**: tras 3a, el cap de tamaño del input ya no aplica (el input va por S3, no por gRPC) → **retirar/subir**
  (parte de Fase 5, o aquí para el reader).

## Pruebas (plan)

- **Unit** `RemoteReaderProviderTest` (migrar de `contentBase64`): con `FakeArtifactStaging` (extendido con
  `stageForDownload`) + invoker-stub que **descarga** el staged y devuelve **páginas** con cursor → asevera que el
  consumer recibe todos los batches, el `ReadResult` trae totales con `records()` vacío, y el cleanup ocurre.
  Negociación `spiVersion` incompatible → fail-fast.
- **E2E** `RemoteReaderArtifactRefMinioIT` (MinIO real): la plataforma stagea un archivo grande, el invoker-stub lo
  **descarga por la URL presignada** y devuelve páginas → el consumer procesa todos los records por streaming, con
  cleanup. Contraparte: descarga fallida → reader degradado.
- **Regresión**: retirar el `contentBase64` del reader no debe romper otros readers locales (Csv/Json/Xls...).

## Alcance / riesgo

- **3a acotada** (reusa el ladrillo 2a + presign GET); **3b es la parte nueva** (protocolo paginado + cursor), pero
  **habilitada** por el consumer model (no usa `ReadResult.records()`). Recomiendo **3a primero** (input por
  referencia), luego **3b** (paginación).
- **Breaking (spiVersion-gated)** como 2b: retira el `contentBase64` del reader; negociación fail-fast.
- **Extiende `ArtifactStaging`** con `stageForDownload` (GET) — el contrato de staging crece a ambos sentidos.
- **No** money-path ni correctitud.

## Doble-check — correcciones (self-review, fundamentado en código)

1. **CORRECCIÓN al claim de paginación: hay DOS paths de consumo del reader, y uno SÍ materializa.**
   - **Streaming pipeline** (`StreamingPipelineWorker`/`Service`): procesa por batch en el callback y usa solo
     `recordCount()`/`skipped` → **bounded**; la paginación realiza su beneficio aquí. ✓
   - **`FileReadRuntimeSupport.collectReadResult`** (lo usa `ProcessTaskRuntimeService` para leer un archivo):
     **acumula TODOS los records** en una lista via el callback (`records.addAll(...)`, con `batchSize=Integer.MAX_VALUE`)
     → **O(todos)**. La paginación **NO** acota memoria en este path (es el caller quien acumula).
   - **Matiz clave**: devolver `ReadResult` con **records vacíos** es **seguro para AMBOS** (collectReadResult construye
     su propia lista desde los batches del consumer; el streaming usa counts) → el diseño del remote reader (streamear
     páginas por el consumer + ReadResult vacío) **funciona sin romper** ninguno. Pero el **beneficio de memoria de la
     paginación se limita al streaming pipeline**; `collectReadResult` materializa igual (característica **preexistente**,
     no la introduce 3b). → "acotar del todo el reader" exige que las lecturas grandes vayan por el **streaming
     pipeline**, no por `collectReadResult` (fuera del alcance de 3b).
2. **CONFIRMADO: `ReadResult` permite `records` vacío con `recordCount` ≠ 0.** El constructor de 4 args fija
   `recordCount` independiente (no valida `records.size()==recordCount`) → `new ReadResult(List.of(), total, skipped,
   skips)` es válido.
3. **Refinamientos de diseño**:
   - **`stageForDownload` debe SUBIR por streaming** (`RequestBody.fromInputStream(payload.openStream(), size)`, con
     `size` del `SelectedSourceFile`) — si no, la plataforma materializaría el archivo al stagearlo, anulando el punto.
     Si el `size` es desconocido, usar multipart o rechazar.
   - **Doble-staging cuando source+reader son AMBOS remotos**: el archivo iría source-plugin→S3→plataforma→S3→
     reader-plugin (dos round-trips). Es un caso de borde (normalmente uno es local); no bloquea, pero se documenta.
   - **Los records siguen viajando por gRPC** (paginados): 3a saca el **archivo** de gRPC (va por S3); 3b acota la
     **memoria de records** a una página (los records estructurados aún transitan gRPC, pero de a una página).

## Veredicto (revisado)

Fase 3 es **factible**. La paginación es viable y **segura** (ReadResult vacío no rompe ningún caller), pero su
**beneficio de memoria se limita al streaming pipeline** — `collectReadResult` materializa igual (preexistente, fuera de
alcance). El trabajo: extender `ArtifactStaging` (`stageForDownload` con **upload por streaming**) + reescribir
`readInBatches` (input por referencia + loop de páginas con cursor + cleanup + gate spiVersion) + tests (unit + E2E
MinIO) + retirar el guard v58 del reader. Recomiendo **3a primero** (input por referencia, análoga a 2b, bajo riesgo),
luego **3b** (paginación), documentando que su beneficio aplica al path streaming. Sigue fuera del money-path.
