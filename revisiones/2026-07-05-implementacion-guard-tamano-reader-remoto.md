# Implementación — guard explícito de tamaño en el reader remoto (v58-fix, paso bounded del análisis de streaming)

Fecha: 2026-07-05
Alcance: implementa el **paso bounded** recomendado en el
[análisis de streaming de plugins remotos](2026-07-05-analisis-streaming-plugins-remotos.md). NO es el rediseño de
streaming (diferido); es una mejora de **operabilidad**: el reader remoto rechaza archivos que exceden un umbral
**antes** de invocar, con un mensaje accionable, en vez de un `RESOURCE_EXHAUSTED` gRPC crudo del server del plugin.

## Contexto (del análisis + doble-check)

El `RemoteReaderProvider` empuja el archivo COMPLETO (`readAllBytes` + Base64, embebido en `configuration_json`) en un
request gRPC **unary**. El límite real del reader lo impone el **server del plugin** (gRPC-Java default ~4 MB inbound),
no la plataforma → el fallo es un `RESOURCE_EXHAUSTED` críptico. Este guard lo hace explícito y accionable.

## Cambios

- **`RemoteReaderProvider`**: nuevo `maxContentBytes` (default `DEFAULT_MAX_CONTENT_BYTES = 4 MB`, conservador). En
  `request(...)`, antes de Base64+invocar, si el tamaño Base64 estimado (`content.length / 3 * 4`) excede el umbral →
  `degraded(...)` con mensaje accionable: *"el archivo '…' (~N B en Base64) excede el maximo del reader remoto (M B).
  Los plugins remotos transfieren el archivo completo en un mensaje gRPC (sin streaming); usa un reader LOCAL para
  archivos masivos o sube el limite del plugin y de integrationhub.plugin.remote.reader.max-content-bytes"*. **No se
  invoca** al plugin cuando el guard rechaza.
- **`ReaderProviderRegistry`**: inyecta `@ConfigProperty
  integrationhub.plugin.remote.reader.max-content-bytes` (default `4194304` = 4 MB) y lo pasa al provider. Se añade un
  constructor de compat (3 args) que usa el default.

## Alcance / decisiones

- **Solo el reader** (dirección outbound, controlada por la plataforma). El **source** recibe el contenido en la
  respuesta, capado por `maxInboundMessageSize` (16 MB) del canal cliente **antes** de que el provider procese → el
  provider no puede pre-chequear ahí; su fallo (RESOURCE_EXHAUSTED) es del transporte. Un wrap friendly del error del
  source queda fuera de alcance.
- No es streaming ni cambia el contrato; es un guard de tamaño configurable. El rediseño de streaming
  (gRPC streaming / artefacto-por-referencia) sigue diferido (ver el análisis).

## Pruebas (evidenciadas)

- `RemoteReaderProviderTest` (NUEVO, 2): `rejectsOversizedContentWithActionableMessageWithoutInvokingThePlugin`
  (100 B con umbral 10 → rechaza con mensaje accionable, **0 invocaciones** al plugin) y
  `allowsContentUnderTheThresholdAndInvokesThePlugin` (100 B con umbral 4 MB → invoca y devuelve records).
- `ReaderProviderRegistryRemoteTest`: sigue verde con el constructor de compat.
- **Validación amplia: 19 tests, 0 fallos** — reader/plugin (`RemoteReaderProviderTest` 2, `StreamingPipelineServiceTest`
  7, `GrpcRemotePluginTransportTest` 4, `ReaderProviderRegistryRemoteTest` 1) + E2E con arranque CDI real
  (`Mt101AllTasksProcessE2EIT` 2, `AsyncTaskExecutionE2EIT` 3), que validan el nuevo `@ConfigProperty` del registry.

## Revisión SOLID

- **SRP**: el guard es una pre-condición del provider, ubicada donde están los bytes crudos (antes del Base64); el
  invoker recibiría el mapa ya codificado (medición imprecisa) → el provider es la ubicación correcta.
- **OCP**: umbral configurable (`@ConfigProperty`) sin tocar código. La lógica del guard hardcodeada; extraer una
  `ContentSizePolicy` sería YAGNI para un guard único (trade-off explícito).
- **LSP**: `IllegalStateException` vía `degraded(...)`, consistente con el contrato existente (que ya lanza para plugin
  no-confiable/fallido).
- **DIP**: umbral por constructor injection (registry→config), no un `ConfigProvider` estático dentro del provider →
  testeable con cualquier umbral (10L / 4 MB en el test).

## Conclusión

Mejora de operabilidad bounded: un archivo demasiado grande para un reader remoto ahora produce un error **accionable**
(usar reader local o subir límites) en vez de un `RESOURCE_EXHAUSTED` gRPC opaco, sin abordar el rediseño de streaming
(diferido). Fuera del money-path (los flujos financieros usan readers locales).
