# Análisis — streaming real de readers/sources remotos (madurez de plataforma, app_htoh 55)

Fecha: 2026-07-05
Tipo: **análisis** (validación contra código real; sin implementar).
Contexto: los readers/sources REMOTOS (plugins vía gRPC/broker) transfieren el archivo COMPLETO en un solo mensaje
Base64, incompatible con archivos masivos (el flujo local sí escala a 1M por streaming/paginado).

## Limitación (verificada en código)

- **`RemoteReaderProvider`** (envío al plugin): `bytes(payload) = payload.openStream().readAllBytes()` — lee el
  archivo **completo** a memoria; `request.contentBase64 = Base64.encode(bytes)` — lo mete Base64 en **un solo
  request** (~+33% de tamaño).
- **`RemoteSourceProvider`** (recepción del plugin): el plugin devuelve `outputs.contentBase64` con el archivo
  **completo** → `Base64.decode(...)` a memoria.
- **Protocolo**: `remote_plugin.proto` es **unary** (`rpc Execute (GrpcRemoteTaskRequest) returns
  (GrpcRemoteTaskResult)`) — no hay RPC de streaming.
- **Cap de tamaño**: `GrpcRemotePluginTransport.maxMessageBytes` default **16 MB** (`maxInboundMessageSize`, min
  64 KB). Un archivo > ~12 MB (tras Base64) **excede el límite** → la llamada gRPC falla (RESOURCE_EXHAUSTED).

**Efecto:** los readers/sources remotos funcionan para archivos **pequeños** (< ~12 MB) y **fallan duro** para
grandes. El cap de 16 MB es un guard implícito que impide procesar masivos por plugin remoto, pero el fallo es un
error gRPC crudo, no un streaming graceful ni un mensaje accionable. **No hay P0 de correctitud** (no corrompe ni
duplica; simplemente no escala y falla).

## Diseño (redesign del contrato de datos remoto)

Es un cambio arquitectónico grande. Opciones:

1. **gRPC streaming RPC**: añadir variantes de streaming al proto (client-streaming para que el reader empuje
   chunks; server-streaming para que el source entregue chunks; o bidi). Requiere: proto + regenerar stubs +
   transporte con streaming + providers que consuman/produzcan por chunks + el SDK del plugin remoto. El broker
   transport (`BrokerRemotePluginTransport`) no tiene semántica de streaming → quedaría solo para gRPC o requeriría
   su propio protocolo de chunking.
2. **Artefacto por referencia (recomendado a futuro)**: la plataforma NO transfiere bytes; pasa una **referencia**
   (URI a MinIO/S3/SFTP/volumen compartido + credenciales de corta vida); el plugin remoto hace stream desde/hacia
   ese store. El mensaje gRPC solo lleva la referencia (pequeño). Desacopla el transporte de datos del canal de
   control. Requiere: un object store compartido (MinIO/S3), contrato de referencia + credenciales efímeras, y
   manejo de limpieza/retención del artefacto.
3. **Paginación/cursor + checkpoint + back-pressure para readers**: en cualquiera de los dos, el reader debe
   devolver **páginas** de records (no todo), con cursor durable y checkpoint, para acotar la memoria de la
   plataforma (como ya hace el reader local de alto volumen).

## Consideración de seguridad (money-path adyacente)

app_htoh(55) también señaló: **no habilitar plugins remotos en flujos financieros ni pasarles secretos**. El envío del
archivo completo + config a un proceso remoto es superficie de exposición. Un rediseño de streaming debe mantener esa
restricción (los flujos SWIFT/PAY masivos usan readers/sources LOCALES, no remotos).

## Recomendación

- **No es un P0** (no correctitud; hay un cap que impide el mal comportamiento silencioso). Es madurez de plataforma
  para habilitar plugins remotos a escala — **fuera del money-path** (los flujos financieros usan local).
- El rediseño completo (streaming RPC o artefacto-por-referencia + paginación/checkpoint) es un **proyecto en sí**
  (protocolo + SDK + posiblemente infra MinIO). **Recomiendo diferirlo** salvo que haya un requisito concreto de
  plugins remotos para archivos masivos.
- **Paso bounded intermedio (opcional)**: convertir el fallo de tamaño en un **guard explícito y accionable** —
  antes de invocar, si `bytes.length` (o el contentBase64 estimado) excede `maxMessageBytes`, rechazar con un error
  claro ("remote reader/source no soporta archivos > N MB; usa un reader/source local o el contrato de streaming (no
  disponible aún)") en vez de un RESOURCE_EXHAUSTED gRPC crudo. Mejora la operabilidad sin el rediseño.

## Veredicto

Limitación **REAL de escalabilidad** (no de correctitud), **fuera del money-path**. El rediseño de streaming es grande
(protocolo + SDK + posible infra). Recomendado **diferir** el rediseño; opcionalmente un guard explícito de tamaño
como mejora de operabilidad de bajo costo.
