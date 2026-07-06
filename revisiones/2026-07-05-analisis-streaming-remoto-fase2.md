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

## Veredicto

Fase 2 es **factible y concreta**: el presigning está disponible sin deps nuevas, `S3SourceProvider`/`SourcePayload` ya
streamean y soportan MinIO, y la seguridad se resuelve con **URLs presignadas estándar** (no un servicio de credenciales
bespoke) — lo que **acota** el riesgo que el doble-check profundo señalaba. El coste real es la **infra MinIO** + el
nuevo **`ArtifactStaging`** + la reescritura del source + el E2E con contenedor. Recomiendo, si se procede, entrar por
**`ArtifactStaging` + `S3ArtifactStaging` con su unit test MinIO** (el ladrillo reusable), luego migrar
`RemoteSourceProvider`, y cerrar con el E2E. Sigue fuera del money-path → la prioridad general del proyecto no cambia.
