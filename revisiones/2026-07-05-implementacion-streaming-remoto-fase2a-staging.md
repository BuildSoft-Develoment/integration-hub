# Implementación — streaming remoto FASE 2a: `ArtifactStaging` + verificación MinIO (#3)

Fecha: 2026-07-05
Alcance: primer incremento de la **Fase 2** del [proyecto #3](2026-07-05-analisis-streaming-remoto-fase2.md): el
**ladrillo reusable de staging** (`ArtifactStaging` + `S3ArtifactStaging`) **y la verificación empírica del supuesto
crítico** (PUT presignado contra MinIO real) que el doble-check exigió hacer PRIMERO. **No migra aún** el
`RemoteSourceProvider` (eso es la 2b) — este incremento aísla y prueba la pieza de mayor riesgo. Fuera del money-path.

## Por qué este orden (disciplina de #4)

El doble-check de Fase 2 marcó como riesgo #1 el supuesto "el PUT presignado + PUT HTTP plano funciona contra MinIO"
(gotcha de firma `SignatureDoesNotMatch`). La lección de #4: **verificar la integración asumida ANTES de construir sobre
ella**. Por eso este incremento entrega el servicio de staging **y** su IT contra MinIO real, antes de tocar el source.

## Cambios (SOLID)

- **`ArtifactStaging`** (interfaz, DIP): abstrae el object store de staging. `presignUpload(mediaType, ttl)` →
  `StagedUpload` (referencia PUT + key interna); `openAndDeleteOnClose(key)` → stream con **delete-on-close**.
- **`StagedUpload`** (record): `ArtifactReference` (PUT, para el plugin) + `key` (interna, para read-back/cleanup).
- **`S3StagingConfig`** (record): bucket/region/endpoint/credenciales/pathStyle — por constructor, para testear con
  valores de un contenedor MinIO sin CDI.
- **`S3ArtifactStaging`** (impl): aplica los **tres refinamientos** del doble-check:
  - **#1** el `S3Presigner` se construye con su **propio** `endpointOverride(MinIO)` + path-style (no los hereda del
    cliente) — si no, presignaría contra AWS real.
  - **#2** **no** fija `Content-Type` en el `PutObjectRequest` → no se firma → el PUT plano del plugin (con o sin
    Content-Type) no rompe la firma.
  - **#3** `openAndDeleteOnClose` envuelve el `getObject` en un `FilterInputStream` que **borra el objeto en `close()`**
    (cleanup cuando el reader terminó, no antes). Prefijo `remote-plugin-staging/` para lifecycle-expiry por prefijo.

## Pruebas (la verificación crítica, evidenciada)

- **`S3ArtifactStagingMinioIT`** (Testcontainers **MinIO real**, `GenericContainer` con `minio/minio`): end-to-end —
  1) `presignUpload` presigna un PUT contra el endpoint MinIO; 2) un **PUT HTTP plano** (java.net.http, como
  `ArtifactTransfer`) sube los bytes → **2xx, no `SignatureDoesNotMatch`**; 3) `openAndDeleteOnClose` lee por streaming
  los bytes exactos; 4) tras el `close`, el objeto **ya no existe** (`NoSuchKeyException`). **1 test, BUILD SUCCESS,
  ~26 s.**
- Confirma empíricamente los tres refinamientos (#1 endpoint, #2 gotcha de firma, #3 delete-on-close) — el supuesto que
  más podía fallar en runtime.

## Estado del proyecto

- Fase 1 (contrato + SDK): ✅ hecha.
- **Fase 2a (staging + verificación MinIO): ✅ HECHA** (este doc).
- **Fase 2b (migrar `RemoteSourceProvider`)**: siguiente — pasar `ArtifactReference(PUT)` en el OPEN, retirar
  `contentBase64`, leer por streaming con `openAndDeleteOnClose`, **negociar por `spiVersion`** (fail-fast, no ruptura
  silenciosa), actualizar el sidecar de referencia, + MinIO en docker-compose + E2E.
- Fases 3–5 (reader + paginación, broker, retirar guard v58): pendientes.

## Conclusión

El ladrillo de staging existe y —lo más importante— su **integración crítica está verificada contra MinIO real** antes
de construir el resto (disciplina de #4). El presigning funciona sin deps nuevas, la seguridad es una URL presignada
estándar (un objeto, un método, TTL corto, firmada con las credenciales de la plataforma), y el cleanup es
delete-on-close. La Fase 2b (migración del source) puede construir con confianza sobre esta pieza.
