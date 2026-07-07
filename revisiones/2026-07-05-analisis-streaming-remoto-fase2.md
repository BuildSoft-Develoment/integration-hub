# Análisis — streaming remoto FASE 2 (source por referencia) — #3

Fecha: 2026-07-05
Tipo: **análisis** (validación contra código real; sin implementar). Planifica la **Fase 2** del
[proyecto #3](2026-07-05-analisis-proyecto-streaming-remoto.md) **antes** de tocar infra (MinIO) — el chunk pesado.
Construye sobre la [Fase 1](2026-07-05-implementacion-streaming-remoto-fase1.md) (contrato `ArtifactReference` + SDK
`ArtifactTransfer`). Fuera del money-path.

## Objetivo de la Fase 2

Migrar el **source remoto** (plugin→plataforma) de "el plugin devuelve el archivo completo en `outputs.contentBase64`"
a "el plugin **sube** el archivo a una URL presignada y la plataforma lo **lee por streaming**". Retira el Base64 del
source (sin ruta dual — directiva "no legacy").

## Estado real (verificado)

- **`RemoteSourceProvider.openFile`** hoy: `invoke("OPEN", {configuration, file})` → `outputs.contentBase64` →
  `Base64.decode` → `SourcePayload.fromBytes` (materializa todo).
- **Presigning disponible sin dep nueva**: `S3Presigner`, `PresignedPutObjectRequest`, `PresignedGetObjectRequest`
  están en `s3-2.44.6.jar` (ya en el classpath por `quarkus-amazon-s3`).
- **Patrón S3 + MinIO ya existe**: `S3SourceProvider` construye `S3Client` con modos de credencial
  (default-chain / access-key), `region`, `endpoint` **compatible MinIO** (anticipado en el código), path-style, y
  **lee por streaming** (`getObject` perezoso → `SourcePayload`). Reusable para el staging + read-back.
- **`SourcePayload` es stream-backed** (`Content{ InputStream open() }`) → el read-back no cambia el contrato del
  consumidor.

## Diseño propuesto (bounded dentro de la fase, SOLID)

1. **`ArtifactStaging` (interfaz, platform)** — abstracción del object store de staging (DIP; testeable con fake/MinIO):
   - `StagedTarget presignPut(mediaType, ttl)` → `ArtifactReference(PUT)` + un `handle` (bucket/key) para leer/limpiar.
   - `InputStream openStaged(handle)` → stream del objeto subido (read-back por streaming).
   - `void cleanup(handle)` → borra el objeto de staging (o lifecycle del bucket).
2. **`S3ArtifactStaging` (impl)** — usa `S3Presigner` (PUT presignado, expiración corta) + `S3Client.getObject`
   (read-back streaming) + `deleteObject` (cleanup). Reusa el patrón de credenciales/endpoint de `S3SourceProvider`
   (config: bucket de staging, region, endpoint MinIO, credenciales). **SRP**: solo staging de artefactos.
3. **`RemoteSourceProvider.openFile` migrado**:
   - `presignPut` → incluir `ArtifactReference(PUT)` (bajo `artifactRef`) en el payload OPEN (en vez de esperar
     `contentBase64`).
   - El plugin sube el archivo a la URL (vía `ArtifactTransfer.upload` del SDK, Fase 1) y devuelve solo `mediaType`
     (+ éxito). **Se retira `contentBase64`.**
   - La plataforma `openStaged(handle)` → `SourcePayload` respaldado por ese stream (no `fromBytes`).
   - `cleanup(handle)` tras consumir (o al cerrar el payload).
4. **SDK/sidecar de referencia**: actualizar `ReferencePluginSidecar`/handler para el caso source: leer el
   `artifactRef` del payload y **subir** (usa `ArtifactTransfer` de la Fase 1). Retira el camino Base64 del ejemplo.

## Seguridad (acotada — refina el doble-check profundo)

El doble-check profundo marcó "emisión de credenciales efímeras a un externo" como el riesgo caro. **La URL presignada
ES ese mecanismo, y es estándar/acotado**: firmada con las credenciales S3 **de la plataforma**, da acceso **de un solo
objeto + un solo método (PUT) + expiración corta** (p.ej. 5 min). **No** requiere STS/AssumeRole ni un servicio de
credenciales bespoke. Requisitos: TTL corto, scope a un key único por operación, y **cleanup** del objeto tras leer (o
lifecycle del bucket). Los plugins remotos siguen fuera de flujos financieros (disciplina de config, sin cambio).

## Infra (nueva, dev + test)

- **docker-compose**: añadir un servicio **MinIO** (endpoint S3-compatible) + bucket de staging. Config del app apuntando
  al endpoint MinIO en dev.
- **Test**: **MinIO Testcontainer** para el E2E (la plataforma presigna → el sidecar de referencia sube → la plataforma
  lee por streaming). `S3SourceProvider` ya soporta el endpoint MinIO, así que el read-back funciona igual.

## Pruebas (plan)

- **Unit**: `S3ArtifactStaging` contra **MinIO Testcontainer** — `presignPut` produce una URL usable; subir por esa URL
  y `openStaged` devuelve los bytes por streaming; `cleanup` borra.
- **E2E**: `RemoteSourceProvider` + MinIO + el sidecar de referencia — el plugin sube el archivo a la URL presignada; la
  plataforma lo lee por streaming; se asevera contenido + que **no** se materializa (stream) + `cleanup`. Contraparte:
  fallo de subida → source degradado con mensaje accionable.
- **Regresión**: retirar `contentBase64` no debe romper otros providers (es específico del remoto).

## Alcance / riesgo / decisiones abiertas

- **Bounded dentro de la fase** pero es la fase **grande**: nuevo servicio de staging + presigner + **infra MinIO** +
  reescritura del source + actualización del SDK + E2E con contenedor.
- **Decisión**: ¿bucket de staging único compartido con lifecycle-expiry, o key por-ejecución con cleanup explícito?
  → Recomiendo **key por-operación + cleanup explícito** (control determinista) **y** lifecycle como red de seguridad.
- **Reader (Fase 3)** reusará `ArtifactStaging` en sentido inverso (presignGet de un archivo staged por la plataforma).
- Riesgo: **no** money-path ni correctitud; el riesgo es de infra/operación (MinIO) y de manejo de credenciales
  presignadas (acotado si TTL corto + scope + cleanup).

## Doble-check — refinamientos (self-review, fundamentado en código)

Reté los supuestos de integración (lección de #4). **Cinco refinamientos reales** que el análisis inicial no cubría:

1. **El presigner necesita `endpointOverride(MinIO)` + path-style — y es un builder SEPARADO del `S3Client`.**
   `S3SourceProvider` configura el cliente con `endpointOverride(URI.create(endpoint))` +
   `S3Configuration.pathStyleAccessEnabled(true)` (líneas 147/150). **El `S3Presigner` NO reusa esa config
   automáticamente**: hay que construirlo con el MISMO endpoint + path-style, o la URL presignada apuntaría a
   `amazonaws.com`, no a MinIO. Requisito concreto para `S3ArtifactStaging`.
2. **Gotcha PUT presignado + PUT HTTP plano (firma).** El `ArtifactTransfer` (Fase 1) hace un PUT plano con
   `Content-Type` solo si `mediaType` no es vacío. Si el presigner firma cabeceras (p.ej. `Content-Type`), el PUT debe
   enviar EXACTAMENTE lo firmado o S3/MinIO responde `SignatureDoesNotMatch`. **Es justo el supuesto de integración que
   #4 enseñó a verificar empíricamente**: el **primer** test MinIO de `S3ArtifactStaging` debe subir por la URL
   presignada y confirmar 2xx **antes** de construir el resto. (Mitigación: presignar sin firmar `Content-Type`, o que
   `ArtifactTransfer` envíe exactamente el firmado.)
3. **Cleanup = delete-on-close, NO `cleanup(handle)` eager.** `openFile` devuelve un `SourcePayload` con
   `StreamSupplier{ open() }` **perezoso**: el reader lo consume DESPUÉS. Un `cleanup(handle)` síncrono en `openFile`
   **borraría el objeto antes de leerlo**. Correcto: `openStaged` devuelve un `InputStream` cuyo `close()` borra el
   objeto de staging (wrapper), y una **lifecycle-expiry del bucket** como red de seguridad ante fallo/leak. Mi
   "cleanup tras consumir" estaba mal especificado.
4. **Retirar `contentBase64` es BREAKING → negociar por `spiVersion` (que YA existe).** `RemotePluginDescriptor` tiene
   `version` y **`spiVersion`**. La migración debe **bump**ear el spiVersion del contrato y la plataforma **validar**
   que el plugin soporta `artifactRef`, fallando **fail-fast con mensaje accionable** si no — en vez de romper en
   silencio. "No legacy" sí, pero **no ruptura silenciosa**: negociación por versión.
5. **El `OPEN` síncrono ahora engloba la duración de la subida.** `invoke("OPEN")` es unary y rechaza `suspended`; el
   plugin sube el archivo a S3 **dentro** de esa llamada. Para archivos muy grandes, la subida puede acercarse al
   deadline gRPC/broker. Sigue siendo mucho mejor que Base64-por-gRPC (la subida va directa a S3), pero conviene un
   timeout holgado y, a futuro, considerar el path async para masivos extremos.

**Neto**: sin bug fatal; la Fase 2 sigue factible, pero con estos requisitos concretos. Lo más importante: **verificar
empíricamente el PUT presignado (punto 2) como PRIMER paso** (test MinIO), antes de construir el resto — o `artifactRef`
sería otra integración asumida que puede fallar en runtime.

## Veredicto (revisado)

Fase 2 es **factible y concreta**, y el doble-check la **de-riesga con requisitos precisos**: presigner con
endpoint/path-style propios (1), verificar el PUT presignado empíricamente primero (2), cleanup delete-on-close +
lifecycle (3), negociación por `spiVersion` para no romper en silencio (4), y timeout holgado en el OPEN (5). El
presigning está disponible sin deps nuevas y la seguridad se resuelve con URLs presignadas estándar (no STS/bespoke).
Recomiendo entrar por **`ArtifactStaging` + `S3ArtifactStaging` con su unit test MinIO que ejercite el PUT presignado
end-to-end** (el ladrillo reusable **y** la verificación del supuesto crítico), luego migrar `RemoteSourceProvider`
(con `spiVersion` + delete-on-close) y cerrar con el E2E. Sigue fuera del money-path → la prioridad general no cambia.
