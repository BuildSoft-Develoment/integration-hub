# Implementación — streaming remoto por artefacto-por-referencia, FASE 1 (contrato + SDK)

Fecha: 2026-07-05
Alcance: **Fase 1** del [proyecto #3](2026-07-05-analisis-proyecto-streaming-remoto.md) (opción B, autorizado "proyecto
completo por fases"). Establece el **contrato de artefacto-por-referencia** y la **capacidad de transferencia del lado
plugin**. Aditivo: **no toca aún los providers** ni el flujo productivo (la migración que retira Base64 es Fase 2–3, sin
ruta dual permanente). Fuera del money-path.

## Diseño (opción B — recordatorio)

En vez de transferir el archivo completo como Base64 en el payload, la plataforma pasará una **referencia** a un object
store (URL presignada de corta vida + método); el plugin remoto hace stream **desde/hacia** ese store:
- **Reader** (plataforma→plugin): la plataforma stagea el archivo y presigna un **GET**; el plugin descarga.
- **Source** (plugin→plataforma): la plataforma presigna un **PUT**; el plugin sube y la plataforma lee por streaming.

Reusa la integración S3/Azure ya existente en el lado plataforma (`S3SourceProvider` streamea con `getObject` perezoso);
lo nuevo de este proyecto es el **contrato**, el **lado plugin** (este Fase 1) y —en fases próximas— el **presigning** +
la **emisión de credenciales efímeras**.

## Cambios de la Fase 1

- **`platform-contract` → `ArtifactReference`** (NUEVO record): el contrato compartido de la referencia
  (`uri`, `method` GET/PUT, `mediaType`, `sizeBytes`, `expiresAtEpochMs`). Serializable a/desde `Map<String,Object>` de
  primitivos (para viajar en el payload JSON del plugin, igual que el resto del contrato). Constante
  `ARTIFACT_REF = "artifactRef"` (la clave que **reemplazará** a `contentBase64` cuando migren los providers). Factories
  `get(...)`/`put(...)` + validación (uri no vacía, method ∈ {GET,PUT}). Vive en `platform-contract` para que
  plataforma **y** SDK del plugin lo compartan sin arrastrar runtime.
- **`ejemplos/backend-plugin-sidecar` → `ArtifactTransfer`** (NUEVO, SDK): utilidad que el plugin usa para
  **descargar** (referencia GET → `openDownload` stream / `download` bytes) o **subir** (referencia PUT → `upload`) el
  artefacto por HTTP contra la URL presignada, con el `HttpClient` del JDK (sin dependencias nuevas). Falla si el método
  no coincide o el status no es 2xx.
- **`platform-contract/pom.xml`**: añade `junit-jupiter` (test scope) — el módulo no tenía dependencias de test.

## Pruebas (evidenciadas)

- **`ArtifactReferenceTest`** (5): round-trip `asMap`/`fromMap` (tolera números como String, caso JSON); factories
  `get`/`put`; rechazo de uri vacía y de método desconocido; default a GET.
- **`ArtifactTransferTest`** (4): contra un **`HttpServer` en-JVM real** (no mocks) — `download` trae los bytes de una
  referencia GET; `upload` entrega bytes + `Content-Type` a una referencia PUT; status no-2xx → `IOException`;
  `download` rechaza una referencia PUT.
- **Regresión**: `ReferencePluginSidecarTest` (4) sigue verde. **Total módulos Fase 1: 13 tests, BUILD SUCCESS.**

## Estado del proyecto (fases)

- **Fase 1 — contrato + SDK: HECHA** (este doc).
- **Fase 2 — source por referencia**: presigning en la plataforma (reusar S3/MinIO) + emisión de credencial efímera +
  `RemoteSourceProvider` que reciba una `ArtifactReference` (PUT) y lea el resultado por streaming; MinIO en
  docker-compose + Testcontainers. **Retira** el `contentBase64` del source (sin ruta dual).
- **Fase 3 — reader por referencia + paginación**: `RemoteReaderProvider` presigna GET + pagina records con checkpoint.
- **Fase 4 — broker transport**: llevar solo la referencia sobre el broker.
- **Fase 5 — retirar/subir el guard v58** cuando el streaming cubra el caso.

## Conclusión

Fase 1 entrega la base honesta del proyecto: el **contrato** de artefacto-por-referencia (compartido plataforma↔plugin)
y la **capacidad de transferencia del lado plugin**, ambos probados contra HTTP real. No cambia el flujo productivo aún
(aditivo). Las fases siguientes migran los providers (retirando Base64) y añaden el presigning + credenciales efímeras +
MinIO — el trabajo pesado que el doble-check profundo identificó (lado plugin + seguridad de credenciales).
