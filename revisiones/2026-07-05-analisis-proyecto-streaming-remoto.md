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
- **No hay object store** en el stack (`docker-compose.yml` no tiene MinIO/S3) → la opción "artefacto-por-referencia"
  requiere **infra nueva**.
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

## Veredicto

Es un **proyecto real y multi-módulo**, no un cambio incremental: streaming de transporte **+** paginación/checkpoint de
records **+** SDK/sidecar **+** (en la opción B) infra de object store. **Recomiendo la opción B (artefacto por
referencia)** como destino arquitectónico —desacopla datos del control y sirve a gRPC y broker por igual— **por fases**
(contrato/SDK → source → reader → broker), pero **diferir el arranque** salvo requisito concreto de plugins remotos
masivos: está fuera del money-path y el guard v58 ya contiene el riesgo. Si se prioriza, la **Fase 2 (source
server-streaming/por-referencia)** es el primer incremento de mayor valor.
