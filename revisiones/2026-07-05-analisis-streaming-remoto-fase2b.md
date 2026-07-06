# Análisis — streaming remoto FASE 2b (migrar `RemoteSourceProvider`) — #3

Fecha: 2026-07-05
Tipo: **análisis** (validación contra código real; sin implementar). Planifica la **Fase 2b**: migrar el source remoto
de `contentBase64` a artefacto-por-referencia, sobre el ladrillo ya verificado en
[Fase 2a](2026-07-05-implementacion-streaming-remoto-fase2a-staging.md). Fuera del money-path.

## Estado real (verificado)

- **Construcción**: `RemoteSourceProvider` se instancia en `SourceProviderRegistry:52`
  (`new RemoteSourceProvider(type, remote.get(), invoker, remotePlugins)`). Ahí se inyectaría `ArtifactStaging`.
- **`openFile` hoy**: pone `{configuration, file}` en el payload, invoca `SOURCE_OPEN`, y espera
  `outputs.contentBase64` → `Base64.decode` → `SourcePayload.fromBytes` (materializa). `selectFiles` (SELECT) **no**
  transfiere contenido → **no cambia**; solo migra `openFile`.
- **`spiVersion` se ALMACENA pero NO se valida en runtime** (`PluginDescriptorVersion.spiVersion`, install/diagnostics)
  → la negociación que pide el doble-check es **lógica nueva**.
- **Harness de test disponible**: `SourceProviderRegistryRemoteTest` stubea el plugin con un `RemotePluginInvoker`
  **lambda** que devuelve `TaskResult.success("opened", Map.of("contentBase64", ...))`. → el E2E de 2b puede usar un
  invoker-stub que **juega el rol del plugin** (lee `artifactRef`, sube a la URL presignada, devuelve éxito) — **sin
  extender el sidecar** (que es task-oriented, no implementa SOURCE). Ese test **asevera `contentBase64`** → es la
  regresión a migrar.
- **No hay config de S3/staging** en `application.properties` todavía.

## Diseño propuesto (SOLID)

1. **Producer CDI de `ArtifactStaging`** (`@ApplicationScoped @Produces`): construye `S3ArtifactStaging` desde
   `@ConfigProperty` (`integrationhub.plugin.remote.staging.{bucket,region,endpoint,accessKeyId,secretAccessKey,
   pathStyle,ttl}`). **Opcional**: si el bucket no está configurado, no se produce → el source remoto con contenido
   falla-fast con un mensaje accionable ("configura el staging S3/MinIO para sources remotos").
2. **`SourceProviderRegistry`** inyecta `ArtifactStaging` y lo pasa al constructor de `RemoteSourceProvider`.
3. **`RemoteSourceProvider.openFile` migrado**:
   - **Negociación `spiVersion`**: si `descriptor.spiVersion()` no soporta el contrato `artifactRef`, **falla-fast** con
     mensaje claro (no ruptura silenciosa; retira Base64 sin dejar ruta dual).
   - `staging.presignUpload(mediaType, ttl)` → incluir `artifactRef` (la referencia PUT) en el payload OPEN.
   - `invoke("OPEN")` (el plugin sube a la URL y devuelve `mediaType` + éxito; **se retira `contentBase64`**).
   - `staging.openAndDeleteOnClose(key)` → `SourcePayload` respaldado por ese stream (no `fromBytes`) → **streaming +
     cleanup delete-on-close**.
4. **Actualizar `SourceProviderRegistryRemoteTest`**: del contrato `contentBase64` al `artifactRef` (con staging fake o
   MinIO).

## Infra / config (nueva)

- **`application.properties`**: claves `integrationhub.plugin.remote.staging.*` (sin secretos en claro; los secretos
  como `${secret:...}` re-resueltos de Vault, según la directiva permanente).
- **docker-compose**: servicio **MinIO** + bucket de staging (dev). Config del app apuntando al endpoint MinIO en dev.
- **Test**: perfil con MinIO Testcontainer (reusa el patrón del IT de Fase 2a).

## Pruebas (plan)

- **Unit** `RemoteSourceProviderTest`: con un `ArtifactStaging` fake + invoker-stub que sube al fake — `openFile`
  presigna, incluye `artifactRef`, y devuelve un `SourcePayload` que streamea el contenido subido. Negociación
  `spiVersion` incompatible → degradado con mensaje. Plugin no sube → degradado (NoSuchKey traducido).
- **E2E** `RemoteSourceArtifactRefMinioIT`: **MinIO real** + `S3ArtifactStaging` real + invoker-stub que **sube por la
  URL presignada** (vía `ArtifactTransfer`/HTTP) → `RemoteSourceProvider.openFile` lee por streaming → asevera contenido
  + cleanup (objeto borrado tras cerrar el payload).
- **Regresión**: `SourceProviderRegistryRemoteTest` migrado al `artifactRef`.

## Alcance / riesgo / decisiones

- **Breaking (spiVersion-gated)**: retirar `contentBase64` rompe plugins viejos; la negociación por `spiVersion` lo hace
  **explícito y fail-fast**, no silencioso (directiva "no legacy" pero "no ruptura silenciosa").
- **docker-compose toca el stack de dev** (añade MinIO) — decisión de infra, primera del proyecto que afecta el entorno
  local.
- **El OPEN síncrono engloba la subida** (refinamiento #5 del doble-check de Fase 2): timeout holgado.
- **Reusable**: la Fase 3 (reader) reusará `ArtifactStaging` en sentido inverso (presignGet de un archivo staged por la
  plataforma) — pero eso es otra fase.
- **No** money-path ni correctitud.

## Doble-check — refinamientos (self-review, fundamentado en código)

1. **CONFLICTO DE PUERTO de MinIO (concreto, lo omití).** `docker-compose.yml` ya mapea **ClickHouse en `"9000:9000"`**,
   y el puerto 9000 ya está disputado (el gRPC del app también). El puerto **API de MinIO es 9000** → añadirlo naïve
   **choca**. MinIO debe mapearse a un **host-port distinto** (p.ej. `"9100:9000"` API + `"9101:9001"` consola), y el
   endpoint del app apuntar a ese host-port en dev. Requisito concreto para el docker-compose.
2. **`spiVersion` es un `"1"` pelado (no semver rico).** Los fixtures/entidad muestran `spiVersion="1"` (columna
   `length=40`). Implicaciones: (a) la negociación no es "comparar semver" sino "¿es una versión que soporta
   `artifactRef`?" → introducir una **constante** (p.ej. contrato `artifactRef` = spiVersion **"2"**) y comparar de
   forma robusta (no `<` de String, que ordena mal `"10"` vs `"2"`); (b) **todos los plugins existentes son `"1"`** → el
   gate es un **cutover duro**: cada source remoto debe re-declarar la versión nueva + implementar la subida (el sidecar
   de referencia declara la nueva). Alternativa más fina: un **flag de capacidad** (`supportsArtifactRef`) en el
   descriptor en vez de bumpear el spiVersion global (que es coarse: cualquier cambio de SPI lo movería). **Recomiendo**
   la constante de versión por simplicidad en este feature de madurez, documentando el cutover; el flag de capacidad si
   se quiere granularidad.
3. **La inyección `Instance<>` opcional encaja (confirmado).** `SourceProviderRegistry` ya inyecta sus deps como
   `Instance<SourceProvider>` / `Instance<RemotePluginInvoker>` y tiene un segundo constructor para tests. → inyectar
   `Instance<ArtifactStaging>` (opcional: `isResolvable()`) es consistente y permite que el app **arranque sin staging
   configurado**; el source remoto con contenido **falla-fast** solo cuando se usa sin staging. Valida el enfoque del
   producer opcional.

## Veredicto (revisado)

Fase 2b es **factible y bien acotada** sobre el ladrillo 2a verificado, con estos requisitos concretos del doble-check:
**mapear MinIO a un host-port ≠ 9000** (evitar el choque con ClickHouse), **negociar con una constante de versión
robusta** (no `<` de String) asumiendo el cutover duro (o un flag de capacidad), e **inyectar `Instance<ArtifactStaging>`
opcional** (arranque sin staging). El patrón invoker-stub habilita el E2E sin extender el sidecar. Recomiendo entrar por
el **producer opcional + la reescritura de `openFile` con su unit test (staging fake + negociación)**, luego el **E2E
MinIO con invoker-stub**, y cerrar con **docker-compose MinIO (host-port libre)**. Sigue fuera del money-path.
