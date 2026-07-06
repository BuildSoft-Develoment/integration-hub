# Análisis de PROYECTO — streaming de readers/sources remotos (#3)

Fecha: 2026-07-05
Tipo: **análisis de proyecto** (scoping + arquitectura; sin implementar).
Naturaleza: escalabilidad/madurez de plataforma. **Fuera del money-path** (los flujos SWIFT/PAY usan readers/sources
**locales**; los remotos no deben usarse en flujos financieros ni recibir secretos). No es correctitud: el guard v58 ya
impide el mal comportamiento silencioso. Continúa el [análisis previo](2026-07-05-analisis-streaming-plugins-remotos.md).

## Estado real (verificado en código)

- **Ambas direcciones materializan el archivo completo en memoria**:
  - Reader (envío): `RemoteReaderProvider.bytes()=stream.readAllBytes()` → Base64 → dentro de `configuration_json`.
    Además `readInBatches` toma **toda** la lista de `outputs.records` y la rebana en memoria (batching **cosmético**).
  - Source (recepción): `RemoteSourceProvider.openFile()` → `outputs.contentBase64` → `Base64.decode` → bytes en memoria
    (`SourcePayload.fromBytes`).
- **Protocolo unary sin campo binario**: `remote_plugin.proto` → `rpc Execute (GrpcRemoteTaskRequest) returns
  (GrpcRemoteTaskResult)`. El contenido viaja como Base64 embebido en strings JSON (`configuration_json` /
  `outputs_json`) — aún menos eficiente que un campo `bytes` dedicado.
- **Dos transportes**: `GrpcRemotePluginTransport` (unary, cap por `maxInboundMessageSize` ~16 MB) y
  `BrokerRemotePluginTransport` (publica el request como envelope + **callback HTTP/HMAC + resume**; **sin** semántica de
  streaming).
- **Object store: integración YA presente** (corregido en el doble-check): el pom tiene `quarkus-amazon-s3` +
  `quarkus-azure-storage-blob` y existen `S3SourceProvider`/`AzureBlobSourceProvider` funcionando. Lo que falta para
  "artefacto-por-referencia" es un **bucket + credenciales efímeras** y, para dev, un contenedor MinIO en docker-compose
  (no una capacidad nueva). Ver §doble-check.
- **Sí hay SDK/plugin de referencia**: módulo Maven `ejemplos/backend-plugin-sidecar` (`ReferencePluginSidecar`,
  `PluginTaskHandler`, `EchoPluginTaskHandler`) — el lado del **autor del plugin**, que cualquier rediseño debe
  actualizar.
- **Guard v58 ya presente**: pre-chequea el tamaño Base64 estimado y rechaza con mensaje accionable (usa reader local).

## Módulos que toca el proyecto (dimensionamiento)

El repo Maven: `platform-contract` (contrato/SPI + proto), `ejemplos/backend-plugin-sidecar` (SDK de referencia),
`platform-app` (transportes + providers), `audit-consumer`. Un rediseño de streaming toca **los tres primeros** más el
contrato de datos — no es un cambio localizado.

## Diseño (opciones de arquitectura)

### Opción A — gRPC streaming RPC
Añadir RPCs de streaming al proto: **client-streaming** para que el reader empuje chunks al plugin; **server-streaming**
para que el source entregue chunks a la plataforma (o bidi). Requiere:
- proto + regenerar stubs; transporte gRPC con back-pressure por chunks;
- `RemoteReaderProvider`/`RemoteSourceProvider` que produzcan/consuman por chunks (no `readAllBytes`/`decode` completo);
- **el SDK/sidecar de referencia** que implemente el nuevo contrato de streaming;
- el **`BrokerRemotePluginTransport` queda fuera** (no hay streaming sobre publish/callback) → o solo-gRPC para archivos
  grandes, o un protocolo de chunking propio sobre el broker (mayor).
- **Pro**: sin infra nueva. **Contra**: acopla al transporte gRPC; el camino broker se queda sin la mejora.

### Opción B — artefacto por referencia (recomendada a futuro)
La plataforma **no transfiere bytes**: pasa una **URI** (a un object store compartido: MinIO/S3/SFTP + credencial
efímera de corta vida); el plugin hace stream **desde/hacia** ese store; el mensaje gRPC/broker solo lleva la
**referencia** (pequeña). Requiere:
- **object store nuevo** (MinIO/S3) en el stack + operación (retención/limpieza/cuotas);
- contrato de referencia + emisión de credenciales efímeras (seguridad: alcance mínimo, expiración corta);
- SDK/sidecar que sepa leer/escribir del store por referencia.
- **Pro**: desacopla datos del canal de control; **funciona igual para gRPC y broker** (ambos llevan solo la referencia);
  escalas arbitrarias. **Contra**: infra + operación nuevas; superficie de credenciales.

### Transversal a A y B — paginación/cursor + checkpoint para readers
Aun con streaming de transporte, hay que rehacer la **acumulación de records** (hoy O(respuesta) en memoria): el reader
remoto debe devolver **páginas** con cursor durable + checkpoint (como el reader local de alto volumen), o el límite de
memoria de la plataforma sigue vigente aunque el transporte sea streaming. **Es parte imprescindible del proyecto**, no
un extra.

## Fases sugeridas (para hacerlo shippable por incrementos)

1. **Contrato + SDK** (`platform-contract` + `ejemplos/backend-plugin-sidecar`): definir el contrato de streaming (proto
   streaming **o** referencia) y actualizar el plugin de referencia. Sin tocar el flujo productivo aún.
2. **Source (recepción) server-streaming / por-referencia**: `RemoteSourceProvider` consume por chunks/URI → un
   `SourcePayload` respaldado por stream (no `fromBytes`). Es el lado de mayor valor (archivos grandes entrantes).
3. **Reader (envío) client-streaming / por-referencia + paginación**: `RemoteReaderProvider` empuja por chunks/URI y
   pagina records con checkpoint.
4. **Broker transport**: decidir (solo-gRPC para grandes, o chunking/referencia sobre broker).
5. **Retirar el guard v58** (o subir su umbral) cuando el streaming cubra el caso.

## Consideraciones de seguridad
- Los plugins remotos **no** deben habilitarse en flujos financieros ni recibir secretos. El rediseño **debe preservar**
  esa restricción; la opción B añade superficie (credenciales efímeras al store) → alcance mínimo + expiración corta +
  auditoría.

## Esfuerzo / riesgo / prioridad
- **Esfuerzo: grande** (proyecto multi-módulo: contrato + SDK + 2 providers + transporte + posible infra MinIO +
  paginación/checkpoint). Parte **acotada** (proto/SDK/providers) y parte de **infra/operación** (object store) en la
  opción B.
- **Riesgo: medio** (contrato nuevo + back-pressure + credenciales); **no** money-path ni correctitud.
- **Prioridad: baja** — el guard v58 ya evita el fallo silencioso; solo aporta si hay un **requisito concreto** de
  plugins remotos a escala. Los flujos financieros no lo necesitan (usan local).

## Doble-check — correcciones (self-review)

Reté los claims factuales contra el código. Sin bug, pero **tres correcciones materiales** que **abaratan el proyecto
(sobre todo la opción B) y refuerzan recomendarla**:

1. **"La opción B requiere infra/integración NUEVA de object store" → FALSO.** El pom ya tiene `quarkus-amazon-s3`,
   `software.amazon.awssdk` y `quarkus-azure-storage-blob`, y **existen providers funcionando**: `S3SourceProvider`
   (type `"S3"`) y `AzureBlobSourceProvider` (type `"AZURE_BLOB"`), más manejo de credenciales AWS
   (`SdkAwsSecretClient`). → La plataforma **ya lee de object stores**. La opción B no es "construir integración de object
   store" sino **reusar la existente como canal de datos del plugin** (stagear el archivo a S3/Azure con los providers
   ya presentes y pasar al plugin una **referencia** + credencial efímera). Lo único "nuevo" es un **bucket + emisión de
   credenciales de corta vida** y, para dev local, un contenedor MinIO en docker-compose (trivial). Coste **mucho menor**
   del que estimé.
2. **"El source materializa por el contrato" → FALSO; `SourcePayload` YA es stream-backed.** Tiene
   `Content{ InputStream open() }`, `fromPath` (streamea de disco) y `openStream()`. El contrato del **consumidor** ya
   streamea; **solo `RemoteSourceProvider` materializa** (usa `fromBytes`). → El rediseño del source es **más fácil**: un
   `SourcePayload` respaldado por el stream del object store (o del gRPC chunked) encaja **sin cambiar el contrato**.
3. **"El rediseño debe preservar la restricción 'remoto fuera del money-path'" → matiz: esa restricción NO está
   enforced en código** (grep no halla barrera; los flujos SWIFT/PAY simplemente se configuran con providers locales).
   Es disciplina de config/operación. Si se quisiera enforcement real (que un proceso SWIFT no pueda cablear un provider
   remoto) sería un gap **aparte y pequeño**, independiente del streaming.

**Neto**: el proyecto sigue siendo multi-módulo (contrato/SDK + providers + transporte), pero **la opción B es bastante
más barata** de lo que dije —reusa S3/Azure ya integrados y el `SourcePayload` ya streamea— así que la recomiendo con
más fuerza. El único "infra nuevo" real es bucket + credenciales efímeras + MinIO para dev.

## Veredicto (revisado)

Es un **proyecto real y multi-módulo**, no un cambio incremental: streaming/referencia de transporte **+**
paginación/checkpoint de records **+** SDK/sidecar. **Recomiendo la opción B (artefacto por referencia)** como destino
—desacopla datos del control, sirve a gRPC y broker por igual, y **reusa la integración S3/Azure ya existente** (coste de
infra bajo: bucket + credenciales efímeras + MinIO dev)— **por fases** (contrato/SDK → source → reader → broker). Aun
así, **diferir el arranque** salvo requisito concreto de plugins remotos masivos: está **fuera del money-path** y el
guard v58 ya contiene el riesgo. Si se prioriza, la **Fase 2 (source por referencia a S3/Azure)** es el primer
incremento de mayor valor y, con las correcciones, el **más barato** (reusa `S3SourceProvider` + `SourcePayload`
stream-backed).
