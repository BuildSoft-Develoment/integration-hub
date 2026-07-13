# Evidencia: smokes E2E del binario NATIVO — 2026-07-13

Batch de homologación nativa posterior al E2E SFTP (`sftp-native-e2e-20260712.md`).
Binario: `integration-hub:native` (Quarkus 3.37.2, perfil `prod`), API real con token OIDC
(admin, direct grant temporal), infra docker del stack + emuladores.

## Resultados

| Smoke | Resultado | Detalle |
|---|---|---|
| **MT101_PAY via SFTP** (money-path) | ✅ PASS | Cadena `FILE_READ(SFTP csv)→MT101_BUILD→SPLIT→REPAIR→ARCHIVE→PAY` con transporte SFTP. `dispatch=1 sent=1 accepted=1 rejected=0`. Archivo `S43.fin` (MT101 FIN valido, 2 transacciones) entregado en el SFTP del "banco" (`atmoz/sftp`) **renombrado** (upload-with-rename, sin `.part`). |
| **S3 (MinIO)** | ✅ PASS | Source `S3` con `endpoint` override + `pathStyleAccess` + `authMode=access-key` → 3 registros a `staging_record`. Valida quarkus-amazon-s3/UrlConnectionHttpClient en nativo. |
| **Azure Blob (Azurite)** | ✅ PASS | Source `AZURE_BLOB` `authMode=connection-string` contra Azurite (`--skipApiVersionCheck` requerido por el SDK 12.31) → 3 registros. |
| **POI / XLSX** | ✅ PASS | Reader `XLSX` (streaming) desde source `FILESYSTEM` → 3 registros. Valida POI+xmlbeans en nativo. |
| **Plugin gRPC remoto** | ✅ PASS (tras fix) | Plugin demo Java (`DEMO_TRANSFORM_JAVA`) instalado **trusted** (integrity SRI + firma ECDSA P-256 verificada en nativo), canary 3/3, activado, e invocado por gRPC: `transformed 'hola nativo grpc' with op=upper`. |
| GCS | ⏸ N/A local | `GcsSourceProvider` no soporta endpoint override → no es testeable contra emulador; requiere GCP real. |
| XLSX desde SFTP | ✅ **corregido mismo dia** | Era bug de app (no nativo, fallaba identico en JVM): `TempFileSourcePayload.selfDeletingStream` borra el temp cuando el reader cierra el stream consumido, y `SourceFingerprintService.fileHash` re-abria un archivo inexistente (XLSX consume el zip completo y cierra antes del hash de staging; CSV sobrevivia por semantica POSIX de unlink). Fix: el SHA-256 se precomputa al descargar y viaja en `SourcePayload.contentSha256`; el servicio lo prefiere. Re-verificado E2E: SFTP+XLSX `COMPLETED records=3`; +2 tests de regresion (`TempFileSourcePayloadTest`), 26/26 tests relacionados en verde. |

## Bugs de runtime NATIVO cazados y corregidos en este batch

1. **`ReadResult` sin reflexion Jackson** — `Grpc/BrokerRemotePluginTransport` serializa
   `TaskContext.attributes` completo (el motor mete `readResult` SIEMPRE, incluso sin FILE_READ)
   → `No serializer found for class ...ReadResult` solo en nativo (JVM PASS como control).
   Fix: `ReadResult`, `ReadRecord`, `ReadSkip`, `SourcePosition` agregados a
   `NativeReflectionRegistrations`.
2. **Causa tragada en los transports de plugins** — el catch convertia el error en
   `TaskResult.failure("...cannot be serialized")` sin la causa; indiagnosticable. Fix: mensaje
   incluye `error.getMessage()` en `GrpcRemotePluginTransport` y `BrokerRemotePluginTransport`.

## Notas operativas del smoke gRPC

- El endpoint `http://` de un plugin solo se acepta con host local (`PluginDescriptorTrustPolicy`);
  el smoke comparte el network namespace del contenedor nativo (`--network container:...`) para
  que el plugin sea `localhost:50061` — en despliegue real: HTTPS + allowlist de origen.
- Ejecutar el task remoto exige `trusted=true`: integrity SRI + firma `SHA256withECDSA` del
  payload canonico `id@version:integrity` con clave en
  `integrationhub.plugins.backend.trusted-public-keys` (se genero keypair P-256 efimero).
- La gobernanza canary bloquea la activacion si hay fallos registrados
  (`failure ratio > 0.0`): las metricas viven en `plugin_invocation_metric` y los intentos
  fallidos previos cuentan — en dev se limpian con DELETE.
