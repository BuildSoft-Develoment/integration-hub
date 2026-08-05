# ADR-006 Fuentes de almacenamiento cloud (object stores: S3, GCS, Azure Blob)

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR-005 Unificacion de la peticion HTTP (REST_CALL + webhook)](ADR-005-unificacion-peticion-http.md)
- Siguiente: [Indice docs](../../README.md)
<!-- nav-guided:end -->

## Estado

Propuesto (decisiones de direccion confirmadas; pendiente del gate de arquitectura + seguridad).
Fase 1 = este ADR + actualizacion de specs 001 (solo documentacion). La implementacion arranca por
S3 (ver Plan de ejecucion).

## Contexto

El catalogo de fuentes (feature `001-catalogo-fuentes`) soporta hoy `filesystem`, `ftp`, `sftp` y
`rest`. Se requiere **descargar archivos desde almacenamiento de objetos en la nube**: AWS **S3**,
Google **Cloud Storage (GCS)** y Azure **Blob Storage**, seleccionando explicitamente el proveedor
y la ubicacion (bucket/contenedor + prefijo/key).

La fuente `rest` generica **no alcanza**: cada nube exige su **firma/credenciales propias** (AWS
SigV4, GCP service-account/OAuth, Azure SAS/account-key/Managed Identity) y un modelo de
**listado + descarga por bucket/contenedor + key** que `rest` no puede expresar (no puede firmar ni
listar objetos).

El SPI de fuentes encaja exactamente con un object store:

```java
interface SourceProvider {
  String type();
  List<SelectedSourceFile> selectFiles(Map config); // ≈ ListObjects(prefix)
  SourcePayload openFile(SelectedSourceFile f, Map config); // ≈ GetObject(key)
}
```

Cada provider es `@ApplicationScoped` y se auto-registra en `SourceProviderRegistry`. Añadir cloud =
nuevos providers que implementan el SPI + sus formularios; **sin tocar el motor de ejecucion**
(igual que se añadieron FTP/SFTP/REST). Ver [ADR-001](ADR-001-platform-architecture.md) (providers +
registries) y [ADR-002](ADR-002-principios-diseno.md) (secretos `${secret:...}`).

## Decision

### 1. Tres tipos explicitos de fuente
`s3`, `gcs`, `azure-blob`. Seleccion explicita en la UI (formulario y validacion por proveedor),
coherente con el patron actual por tipo. **No** se usa un unico tipo `cloud` con selector interno.

### 2. Bloque comun "object store" + reuso del bloque de seleccion
Los tres reutilizan el bloque de seleccion ya existente (`fileNameTemplate`, `selectionMode`
`latestModified`/`single`/`all`, `fileErrorPolicy`, `templateVariables`, `mediaType`); el `prefix`
cumple el rol de `remotePath`. Listado = `ListObjects(prefix)` filtrado por la regla de nombre y el
`selectionMode`. En el frontend se extrae un sub-form compartido `source-object-store`
(bucket/contenedor + prefijo + bloque de seleccion) + un bloque de auth especifico por proveedor.

### 3. Credenciales: nativas primero, secretos como fallback
`authMode` por defecto usa los **credential chains nativos** (sin secreto almacenado): IAM
role/instance-profile (AWS), Application Default Credentials / Workload Identity (GCP), Managed
Identity (Azure). Las claves explicitas (`accessKeyId`/`secretAccessKey`, `serviceAccountJson`,
`accountKey`/`sasToken`/`connectionString`) se referencian con `${secret:...}` y **nunca** en claro.

### 4. Descarga por streaming
`SourcePayload` se extiende para soportar una variante **por `InputStream`**; los providers cloud
**transmiten** la descarga (`GetObject` → stream) sin cargar el archivo completo en memoria. Habilita
objetos grandes y se alinea con la linea de alto volumen ([ADR-004](ADR-004-motor-input-output-tareas.md)).
El retrofit de streaming a FTP/SFTP queda como mejora aparte (no bloquea cloud).

### 5. Transporte HTTP "lean-native" + extensiones Quarkiverse
El proyecto compila a **native-image** (perfil `native`, `--initialize-at-run-time` para jsch/POI).
Por eso se usan **extensiones Quarkiverse** (que traen el registro de reflexion/sustituciones nativo),
no SDKs planos, y en los tres se elige el **transporte HTTP basado en JDK**, evitando Netty/gRPC/CRT:

| Proveedor | Extension | Transporte elegido | Riesgo native |
|---|---|---|---|
| AWS S3 | `io.quarkiverse.amazonservices:quarkus-amazon-s3` | `url-connection-client` (excluir Apache) | Bajo |
| GCS | `io.quarkiverse.googlecloudservices:quarkus-google-cloud-storage` | HTTP/JSON (`NetHttpTransport`), no gRPC | Medio |
| Azure Blob | Quarkiverse Azure Services (`quarkus-azure-storage-blob`) | `azure-core-http-jdk-httpclient`, no Netty | **Alto** |

`aws-crt-client` (multipart paralelo, HTTP/2) queda **diferido**: solo si aparece necesidad real de
throughput, con un spike native propio (bundlea binarios JNI por plataforma).

### 6. Cliente programatico por fuente + cache
Como las credenciales/region/bucket son **dinamicos por `configuration_json`** (no un cliente
estatico por `application.properties`), el cliente se construye programaticamente por fuente
(`S3Client.builder()…`) usando las clases del SDK que la extension registra para native. El cliente
se **cachea por hash de config** (region+creds+endpoint) para no recrear pools por ejecucion
(mismo patron que el cache de token de [ADR-005](ADR-005-unificacion-peticion-http.md)).

## Contrato `configuration_json` por nuevo tipo

```jsonc
// type "s3"  (AWS S3 o compatible MinIO via endpoint)
{ "region": "us-east-1", "bucket": "ventas-raw", "prefix": "incoming/",
  "fileNameTemplate": "ventas_*.csv", "selectionMode": "latestModified",
  "authMode": "default|access-key|assume-role",
  "accessKeyId": "${secret:aws/key}", "secretAccessKey": "${secret:aws/secret}",
  "roleArn": "arn:aws:iam::...:role/x", "endpoint": "", "pathStyleAccess": false, "mediaType": "text/csv" }

// type "gcs"  (Google Cloud Storage)
{ "bucket": "ventas-raw", "prefix": "incoming/", "fileNameTemplate": "ventas_*.csv",
  "authMode": "service-account-json|adc", "serviceAccountJson": "${secret:gcp/sa}", "mediaType": "text/csv" }

// type "azure-blob"  (Azure Blob Storage)
{ "accountName": "ventasstg", "container": "raw", "prefix": "incoming/", "fileNameTemplate": "ventas_*.csv",
  "authMode": "account-key|sas-token|connection-string|managed-identity",
  "accountKey": "${secret:az/key}", "sasToken": "${secret:az/sas}", "mediaType": "text/csv" }
```

## Alternativas consideradas

1. **Un unico tipo `cloud` + selector de proveedor**: menos tipos pero un formulario cargado y
   validacion condicional; rechazada por menor claridad (la peticion fue seleccion explicita).
2. **SDKs planos (sin extension Quarkiverse)**: obligan a mantener a mano reflection-config,
   resources e `--initialize-at-run-time` para native; rechazada por costo y por divergir del
   patron jsch/POI del proyecto.
3. **Fuente `rest` generica para cloud**: no puede firmar (SigV4/SAS) ni listar buckets; insuficiente.
4. **`aws-crt-client` / gRPC / Netty**: mejor throughput pero peor native; diferidos a spike por
   necesidad real.

## Consecuencias

**A favor**
- Descarga directa desde S3/GCS/Azure como fuente de primera clase, con seleccion explicita.
- Reuso del SPI y del bloque de seleccion → sin cambios en el motor; baja superficie.
- Credenciales nativas → menos secretos almacenados; streaming → soporta archivos grandes.

**En contra / riesgos**
- Peso de SDKs cloud (tiempo de build native + tamaño de binario). Mitigacion: SDK modular (solo
  `s3`), transporte JDK, excluir Apache/Netty.
- **Azure es el de mayor riesgo en native** (Reactor + extension menos madura). Como la app es un
  **unico binario native**, no hay "Azure en JVM y el resto en native" en una misma ejecucion: si
  Azure no compila en native hay que invertir la config necesaria o **diferir** ese proveedor.
- `SourcePayload` por stream toca una pieza compartida (cuidar compatibilidad con FILE_READ/readers).

## Plan de ejecucion (por fases, independientes por el SPI)

1. **Fase 1 (este ADR + specs)** — *en curso*: congelar tipos, `authMode`, bloque object-store,
   contrato de streaming en `SourcePayload`, transporte por proveedor. Actualizar `spec-funcional`/
   `spec-tecnica`/`traceability` de 001. Solo documentacion.
2. **S3 end-to-end** — *en curso*: front (tipo `S3`, `source-s3-form`, provider/draft/(de)serializacion,
   alta en host/union, i18n) **hecho** y verde (`nx build`/`nx test`); back `S3SourceProvider`
   (`selectFiles`=ListObjectsV2 paginado + regla nombre/selectionMode; `openFile`=GetObject por stream
   reutilizando `SourcePayload.StreamSupplier`; auth `default`/`access-key`; cliente
   `url-connection-client` cacheado por hash; endpoint/path-style para MinIO) **compila** (JVM) con
   `quarkus-amazon-s3` 3.19.0 (+ BOM, Apache excluido); auth `default`/`access-key`/`assume-role`
   (STS). **Pendiente**: prueba de integracion (S3/MinIO), **build native** y gate humano.
   `SourcePayload` ya era streaming (no requirio cambio).
3. **GCS** — *hecho* (JVM): `GcsSourceProvider` (list por prefix + GetBlob por stream via ReadChannel);
   auth `adc`/`service-account-json`; `quarkus-google-cloud-storage` 2.22.0 (transporte HTTP/JSON);
   front (tipo `GCS`, `source-gcs-form`, provider). Pendiente: integracion, native, gate.
4. **Azure Blob** — *hecho* (JVM): `AzureBlobSourceProvider` (listBlobs por prefix +
   `openInputStream` por stream); auth `account-key`/`sas-token`/`connection-string`;
   `quarkus-azure-storage-blob` 1.2.4; front (tipo `AZURE_BLOB`, `source-azure-blob-form`, provider).
   **Pendiente**: `managed-identity` (requiere `azure-identity`), transporte `jdk-httpclient` +
   exclusion de Netty (**spike native adelantado** — Azure es el de mayor riesgo native), integracion,
   gate.

### Seguimiento del plan (2026-08-05)

Lo de arriba se escribio el 2026-06-05 y no se ha vuelto a tocar; parte ya esta resuelto. No se
reescribe -describia bien lo pendiente ENTONCES-, se anota lo medido despues:

- **S3 y Azure Blob**: lo "pendiente" de integracion y de **build native** esta HECHO. Smoke sobre el
  binario NATIVO en verde el 2026-07-13: S3 contra MinIO y Azure Blob contra Azurite, 3 registros
  cada uno. Evidencia: `qa/fase-6-qa/evidencias/native-smokes-20260713.md`; estado consolidado en
  `ops/fase-7-deploy/dist/NATIVE-STATUS.md`. Con eso, la duda de este ADR sobre Azure en GraalVM
  ("el de mayor riesgo native") queda resuelta a favor.
- **GCS**: sigue pendiente de verdad, y por un motivo estructural, no por falta de tiempo:
  `GcsSourceProvider` no admite endpoint override, asi que no es homologable contra emulador y
  necesita GCP real. Recogido como limite conocido en `NATIVE-STATUS.md`.
- **Azure `managed-identity`**: sigue pendiente. `AzureBlobSourceProvider` lo rechaza fail-loud y no
  hay `azure-identity` en el pom.
- **Gate humano**: sin acta. Sigue pendiente para los cuatro.

Lo que este seguimiento NO arregla, y conviene no perder: el estado de estas fuentes vivia copiado a
mano en varios sitios y caduco en todos a la vez. Por eso el modelo `likec4` ya no lo lleva en el
titulo de los nodos y apunta aqui y a `NATIVE-STATUS.md`.

## Gate

Cambio de modelo de extensibilidad + seguridad (credenciales/secretos) → revision y firma humana
(arquitectura + seguridad). El agente no auto-aprueba.

## Referencias

- [Spec 001 - Catalogo de fuentes](../../../specs/001-catalogo-fuentes/spec-tecnica.md)
- [ADR-001 Platform Architecture](ADR-001-platform-architecture.md) (providers + registries)
- [ADR-002 Principios de diseno](ADR-002-principios-diseno.md) (secretos `${secret:...}`)
- [ADR-004 Motor de tareas con inputs y outputs tipados](ADR-004-motor-input-output-tareas.md) (alto volumen)
- [ADR-005 Unificacion de la peticion HTTP](ADR-005-unificacion-peticion-http.md) (cache por hash de config)
