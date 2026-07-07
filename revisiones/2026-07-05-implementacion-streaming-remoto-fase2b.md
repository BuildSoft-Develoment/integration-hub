# Implementación — streaming remoto FASE 2b: `RemoteSourceProvider` por referencia (#3)

Fecha: 2026-07-05
Alcance: migra el **source remoto** de `contentBase64` a artefacto-por-referencia, sobre el ladrillo `ArtifactStaging`
verificado en [Fase 2a](2026-07-05-implementacion-streaming-remoto-fase2a-staging.md). Aplica los refinamientos del
[doble-check de Fase 2b](2026-07-05-analisis-streaming-remoto-fase2b.md). Fuera del money-path.

## Cambios (SOLID)

- **`ArtifactStagingProducer`** (NUEVO, `@Produces @ApplicationScoped`): construye `S3ArtifactStaging` desde
  `@ConfigProperty` (`integrationhub.plugin.remote.staging.*`); si el bucket no está configurado, produce
  **`UnconfiguredArtifactStaging`** (null-object) → el app **arranca sin staging** y el source remoto **falla-fast** con
  mensaje claro al usarse. Credenciales por config (en prod `${secret:...}` de Vault, no en claro).
- **`RemoteSourceProvider.openFile` migrado**: **negocia por `spiVersion`** (mayor ≥ 2, comparación robusta — fail-fast,
  no ruptura silenciosa) → `staging.presignUpload` → incluye `artifactRef` (PUT) en el payload OPEN → el plugin sube a
  la URL → la plataforma lee por **streaming** con `openAndDeleteOnClose` (cleanup delete-on-close). **Se retira
  `contentBase64`** (sin ruta dual).
- **`SourceProviderRegistry`**: inyecta `ArtifactStaging` (constructor `@Inject` de 4 args) y lo pasa al provider; el
  constructor de test conserva un null-object.

## Pruebas (evidenciadas, 4 capas)

- **Unit `SourceProviderRegistryRemoteTest`** (2, migrado de `contentBase64` a `artifactRef`): con un `FakeArtifactStaging`
  + invoker-stub que "sube" al fake — `openFile` presigna, incluye `artifactRef`, lee por streaming lo subido y **borra
  el objeto tras consumir** (`deleted.size()==1`); y `spiVersion=1` → **fail-fast** con mensaje de negociación.
  `StreamingPipelineServiceTest` (7) sigue verde (constructor de test intacto).
- **E2E `RemoteSourceArtifactRefMinioIT`** (Testcontainers **MinIO real**, 2 tests): `RemoteSourceProvider` real +
  `S3ArtifactStaging` real + un invoker-stub que **sube por HTTP a la URL presignada** (rol del plugin) → `openFile` lee
  por streaming ~6 KB exactos del staging; **(doble-check) verifica el cleanup** en el flujo completo (0 objetos bajo el
  prefijo de staging tras cerrar el payload — delete-on-close real, no solo el fake); y **(doble-check) el plugin que
  MIENTE** (reporta success sin subir) → la lectura perezosa falla (`NoSuchKey`). BUILD SUCCESS ~9 s. Valida el flujo
  completo sin extender el sidecar (patrón invoker-stub).
- **Regresión amplia (doble-check)**: 18 tests de `*Source*`/`*RemoteReader*`/`*Artifact*` verdes — en particular
  `RemoteReaderProviderTest` **sigue usando `contentBase64` intacto**: retirar el Base64 del **source** no rompió el
  **reader** (que migra en Fase 3).
- **Wiring CDI (lección de #4)**: el app **bootea** (`/q/health/ready` 200, ~50 s) → el producer `ArtifactStaging` y el
  `SourceProviderRegistry` de 4 args resuelven sin `UnsatisfiedResolution`/`Ambiguous`. Los unit tests (construcción
  directa) no lo validaban.

## Infra

- **docker-compose**: servicio **MinIO** en host **9100** (API) + 9101 (consola) — **no 9000** (ocupado por ClickHouse
  `9000:9000` y el gRPC del app, el conflicto que detectó el doble-check) + un **`minio-init`** (mc) que crea el bucket
  `remote-plugin-staging`.
- **application.properties**: config `%dev.integrationhub.plugin.remote.staging.*` apuntando al MinIO del compose; prod
  por Vault.

## Estado del proyecto #3

- Fase 1 (contrato + SDK): ✅ · Fase 2a (staging + MinIO): ✅ · **Fase 2b (source por referencia): ✅ HECHA** (este doc).
- Fase 3 (reader por referencia + paginación), Fase 4 (broker), Fase 5 (retirar guard v58): pendientes.

## Conclusión

El source remoto ya no materializa el archivo en Base64: la plataforma presigna, el plugin sube a S3/MinIO, y la
plataforma lee por streaming con cleanup delete-on-close. La migración retira el Base64 (negociada por `spiVersion`,
fail-fast) y está validada en 4 capas: unit, E2E MinIO real, wiring CDI (boot), e infra. Reusa el ladrillo 2a. Sigue
fuera del money-path.
