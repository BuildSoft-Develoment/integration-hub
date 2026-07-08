# Evidencia #2: ficheros grandes en Source/Reader remoto — límite de mensaje configurable - 2026-07-02

Aborda el riesgo de "ficheros grandes" sobre el contrato síncrono: el transporte gRPC no
fijaba `maxInboundMessageSize`, cayendo al **límite duro de 4 MiB** de gRPC → un
Source/Reader remoto con un payload > 4 MiB fallaba con `RESOURCE_EXHAUSTED`.

## Alcance (honesto)

- Este incremento entrega la **mitigación acotada y segura**: subir/configurar el techo de
  mensaje gRPC (contrato síncrono). **No** es streaming/chunking completo.
- El **streaming/chunking real** (RPC server-streaming o lectura paginada por chunks sobre
  gRPC + broker + sidecar) es un cambio multi-módulo mayor; queda documentado como follow-up
  con el diseño abajo. La frase base del supuesto ("el contrato síncrono base ya quedó
  habilitado") encaja: esto sube el techo del contrato síncrono para ficheros grandes.

## Cambios

- `GrpcRemotePluginTransport`: nuevo `maxInboundMessageSize(maxMessageBytes)` en el canal;
  configurable via `integrationhub.plugins.grpc.max-message-bytes` (default **16 MiB**,
  clamp mínimo 64 KiB). Constructor `@Inject` con el config + constructor `(ObjectMapper)`
  legacy que usa el default (compat con el test existente).
- `application.properties`: propiedad documentada (`= 16777216`).

## Pruebas backend

```bash
mvn -pl platform-app test -Dtest=GrpcRemotePluginTransportTest
```

- Estado: **BUILD SUCCESS, 4 tests** (+1): default 16 MiB, valor explícito mayor respetado
  (64 MiB), valores absurdamente pequeños clampados al suelo (64 KiB). Los mapeos existentes
  (success/suspended) siguen verdes.
- Arranque en vivo: **health 200** con el transporte configurado.

## e2e

- El transporte remoto no tiene superficie UI; se valida con unit + arranque sano. Un e2e
  real de payload > 4 MiB requiere un sidecar/servidor gRPC que devuelva un payload grande
  (parte del follow-up de streaming).

## Follow-up documentado: streaming/chunking real

> Actualizacion 2026-07-07: el diseno vigente retiro `contentBase64` del flujo
> source/reader remoto. La ruta actual usa `artifactRef` contra staging S3/MinIO,
> `ReaderProvider.supportsStreamingPipeline()` para entrar al fast path y
> `outputs.nextCursor` para paginacion de reader remoto. Ver
> `remote-source-reader-streaming-capability-2026-07-07.md`.

Diseño recomendado para lectura de ficheros grandes sin cargar todo en memoria/mensaje:

1. **Lectura paginada sobre el contrato unario existente** (sin cambiar el proto; funciona en
   gRPC y broker): el `RemoteReaderProvider` pide chunks con atributos `chunkOffset`/`chunkSize`;
   el plugin devuelve la porción + `hasMoreChunks`/`nextChunkOffset`. Backward-compatible
   (un plugin que ignore los atributos devuelve todo = un chunk). Requiere actualizar el
   sidecar de referencia.
2. **(Alternativa)** RPC `server-streaming` en `remote_plugin.proto` (`stream GrpcRemoteChunk`)
   para gRPC; el broker seguiría con paginación por mensajes.
