# Cierre — proyecto #3: streaming de plugins remotos (artefacto por referencia)

Fecha: 2026-07-05
Estado: **COMPLETO**. Fuera del money-path (los flujos financieros usan providers locales). Autorizado como "proyecto
completo por fases".

## Qué resolvía

Los readers/sources **remotos** (plugins) transferían el archivo **completo** en Base64 dentro del mensaje gRPC → no
escalaban (cap ~4-16 MB, fallo `RESOURCE_EXHAUSTED` crudo). El proyecto lo migró a **artefacto por referencia**
(opción B): el archivo va por un **object store** (S3/MinIO) vía URL presignada de corta vida; el mensaje solo lleva la
**referencia** (pequeña). Desacopla el dato del canal de control.

## Fases entregadas

| Fase | Entregable | Validación |
|---|---|---|
| **1** contrato + SDK | `ArtifactReference` (platform-contract) + `ArtifactTransfer` (SDK sidecar) | unit + e2e wire JSON real |
| **2a** staging | `ArtifactStaging`/`S3ArtifactStaging` (presignPut + delete-on-close) | **MinIO real**: PUT presignado + TTL expiry + delete |
| **2b** source por ref | `RemoteSourceProvider` (presignUpload → plugin sube → streaming) + producer CDI + negociación `spiVersion` | unit + **E2E MinIO** + boot CDI + cleanup/leak |
| **3a** reader input por ref | `stageForDownload` (upload streaming + presignGet) + `RemoteReaderProvider` + retira guard v58 | unit + **E2E MinIO** (presignGet) + boot + leak-on-failure |
| **3b** paginación | loop con cursor + `ReadResult` vacío + guard no-progreso + `openRange` (Range GET) | unit multi-página + **E2E MinIO** Range GET + collectReadResult |
| **4** broker | **no-op** (transport-agnostic) + test de blindaje `artifactRef` sobre el envelope | unit round-trip |
| **5** retirar guard v58 | hecho en 3a (reader); el source nunca tuvo guard | — |

## Propiedades verificadas (contra MinIO real, no supuestos)

- **Presigning** PUT y GET funcionan contra MinIO (endpoint/path-style propios del presigner; sin gotcha de firma).
- **Seguridad**: la URL presignada **expira** de verdad tras el TTL (probado) — credencial efímera, un objeto, un método,
  firmada con las creds de la plataforma.
- **Streaming**: upload (`RequestBody.fromInputStream`) y read-back (`getObject` perezoso / `SourcePayload`) sin
  materializar; paginación por Range GET (offset).
- **Cleanup**: delete-on-close (source) y delete-after-read (reader), incluido **leak-on-failure** (finally).
- **Negociación**: `spiVersion >= 2` fail-fast (no ruptura silenciosa); paginación backward-compatible sin bump.
- **Transport-agnostic**: el `artifactRef` sobrevive el envelope del broker (round-trip).

## Límites documentados (fuera de alcance, honestos)

- **Paginación eficiente = responsabilidad del plugin** (cursor=offset + Range GET; el naïve es O(N²)). La plataforma
  provee el mecanismo + el SDK (`openRange`).
- **`collectReadResult`** (`ProcessTaskRuntimeService`) materializa via callback — preexistente, el beneficio de memoria
  aplica al **streaming pipeline**.
- **Infra**: MinIO en docker-compose (host 9100); en prod, bucket/endpoint por config + credenciales `${secret:...}`
  (Vault). Falta **enganchar MinIO/el bucket en el entorno prod real** (operación de despliegue).
- **Outputs grandes de tasks async** (canal resume/HTTP) NO cubiertos — extensión separada si alguna vez se necesita.
- **Brokers no-Kafka de cliente crudo** (JMS/RabbitMQ/Redis) para el health async (#4b) — no relacionado con #3.

## Conclusión

El streaming de plugins remotos quedó **implementado y verificado end-to-end contra MinIO real**, con el diseño
transport-agnostic de la opción B: contrato + SDK, staging con presigning y credenciales efímeras, source y reader por
referencia (streaming, cleanup robusto, negociación de versión), paginación con cursor + Range GET. Fuera del money-path;
la prioridad general del sistema no cambió.
