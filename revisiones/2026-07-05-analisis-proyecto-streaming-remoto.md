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

## Doble-check PROFUNDO — retando las propias correcciones (self-review²)

Fui más a fondo, retando incluso las correcciones anteriores. Resultado: **una validada, un insight nuevo, y un
walk-back parcial de mi propia corrección #1**.

### Validado (más fuerte) — la fuente streaming ya está probada
`S3SourceProvider.openFile` → `new SourcePayload(selectedFile, () -> client.getObject(request))`: **GetObject perezoso
→ `ResponseInputStream`, sin cargar en memoria** (idem el `SourcePayload.fromPath`). Es decir, el camino
"source por streaming" **ya funciona hoy** para S3 (y por diseño para Azure/GCS/FTP/SFTP/FS). La corrección #2 no solo
se sostiene: la mitad "plataforma recibe por streaming" está **implementada y probada** — reusable tal cual.

### Insight NUEVO — el NEED es aún más estrecho de lo dicho
Existen **7 source providers LOCALES** que ya streamean: `FILESYSTEM, FTP, SFTP, S3, GCS, AZURE_BLOB, REST`. Cubren
prácticamente **todas** las fuentes comunes de archivos grandes. → El caso "reader/source REMOTO con archivo grande"
solo aplica a una fuente **que ninguno de los 7 cubre** (un sistema propietario/bespoke) **y** que además sea masiva:
una intersección **muy angosta**. El valor del proyecto es **aún menor** de lo que estimé → refuerza diferir con más
confianza.

### Walk-back PARCIAL de mi corrección #1 — el "reuse S3" es solo del lado PLATAFORMA
Mi corrección #1 dijo que la opción B "reusa la integración S3/Azure existente". Cierto, pero **solo del lado de la
plataforma** (stagear/leer el artefacto). El punto entero de "remoto" es que el **plugin es un proceso externo**, y para
la opción B el plugin debe **leer/escribir el object store** — capacidad que **NO existe** hoy en el SDK/sidecar
(`ejemplos/backend-plugin-sidecar` no tiene cliente S3/Azure; grep vacío). Además, entregar acceso al store a un plugin
externo exige **emisión de credenciales efímeras/URLs presignadas con alcance mínimo** — mecanismo que **tampoco existe**
(no hay presign/STS para terceros). → El **coste y el riesgo reales de la opción B son el lado plugin (SDK con cliente
de object store) + la emisión segura de credenciales**, no la integración de la plataforma (que sí se reusa). Mi
corrección #1 fue **demasiado optimista** sobre cuánto se reusa.

### Síntesis del doble-check profundo
- **Barato/probado**: la mitad "plataforma recibe por streaming" (source) — ya existe.
- **Estrecho**: el need es un nicho (7 providers locales cubren lo común).
- **Caro/sensible**: lo nuevo real = SDK del plugin con acceso a object store + emisión de credenciales efímeras a un
  externo (seguridad). Eso, no la integración de la plataforma, domina el esfuerzo/riesgo.

## Veredicto (revisado)

Es un **proyecto real y multi-módulo**. El destino sigue siendo la **opción B (artefacto por referencia)** —desacopla
datos del control y sirve a gRPC y broker por igual—, pero el doble-check profundo afina el cuadro: la mitad
**plataforma-recibe-por-streaming ya existe y está probada** (`S3SourceProvider` + `SourcePayload`), el **need es un
nicho angosto** (7 source providers locales ya cubren las fuentes grandes comunes), y el **coste/riesgo reales viven en
el lado plugin** (SDK con cliente de object store, hoy inexistente) **+ la emisión segura de credenciales efímeras a un
proceso externo** (seguridad, sin mecanismo hoy). → **Diferir con confianza**: fuera del money-path, need de nicho, y el
guard v58 ya contiene el riesgo. Si algún día se prioriza, entrar por la **Fase 2 (source)** —la mitad barata/probada—
sabiendo que el trabajo pesado no es la plataforma sino **el SDK del plugin y la seguridad de credenciales**. Antes que
este proyecto, si aparece un caso de fuente grande, la respuesta correcta suele ser **un provider local** (S3/Azure/SFTP/
GCS/FTP), no un plugin remoto.
