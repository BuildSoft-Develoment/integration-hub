# Evidencia E2E: SFTP (jsch) en binario NATIVO — 2026-07-12

## Objetivo

Homologar que jsch funciona en runtime nativo (GraalVM) antes de confiar el money-path
MT101 (SFTP) al binario nativo. El riesgo especifico: el handshake criptografico de jsch
(KEX/ciphers/MACs) se carga por reflexion y podia fallar solo en nativo.

## Escenario

- Binario: `integration-hub:native` (Quarkus 3.37.2, runner nativo de 318 MB, perfil `prod`).
- SFTP real: contenedor `atmoz/sftp` (`bank:bankpass`, chroot `/home/bank`, fixture
  `/in/datos.csv` con 3 registros `codigo;nombre;total`).
- Flujo por API (token OIDC Keycloak, usuario `admin`, client `integration-hub-ui` con
  direct grant habilitado SOLO durante la prueba y revertido despues):
  1. `POST /api/source-definitions` — source `SFTP` (host `ih-sftp-test`, password auth,
     `strictHostKeyChecking:false`).
  2. `POST /api/reader-definitions` — reader `CSV` (delimitador `;`, 3 campos).
  3. `POST /api/process-definitions` — `FILE_READ` (SFTP+CSV) -> `DB_WRITE` (`staging_record`).
  4. `POST /api/process-executions/{id}` + poll hasta estado terminal.
- Driver: `sftp-native-e2e.mjs` ejecutado dentro de la red Docker (`node:22-alpine`) para
  que el issuer del token coincida con el `auth-server-url` del contenedor.

## Resultado: PASS

```
status final: COMPLETED
tasks: FILE_READ=COMPLETED, DB_WRITE=COMPLETED
registros procesados: 3
```

- Handshake jsch (KEX/cipher por reflexion) OK en nativo; list + get del CSV OK.
- Sin errores `No serializer found` / `Cannot serialize` en logs; el spool de auditoria
  siguio fluyendo (audit_spool con eventos nuevos de la ejecucion).

## Bug de nativo cazado y corregido por esta prueba

El primer intento fallo ANTES de tocar SFTP: `POST /api/process-executions` devolvio 500
`Cannot serialize configuration` — Jackson en nativo no encontraba propiedades de
`QueuedProcessExecutionPayload` (record serializado fuera de la capa REST, sin registro de
reflexion). El barrido posterior encontro el mismo patron latente en: `AuditEnvelope` (+
`AuditLevel`) — CRITICO porque `audit.fail-business-on-error=false` lo hacia fallar en
silencio —, `AsyncTaskEnvelope`/`AsyncSliceWorkItem`/`AsyncPageWorkItem` (backbone async),
`Mt101Message` y sus 6 records anidados (routing MT101), y `PluginMarketplaceCatalog`.

Fix: `NativeReflectionRegistrations` en `platform-app/.../service/` con
`@RegisterForReflection(targets = {...})` (15 tipos). Los tipos de `platform-contract` se
registran por `targets` porque ese modulo no depende de Quarkus.

## Cobertura y limites

- Cubierto: conexion/auth/canal SFTP (misma maquinaria `Session`/`ChannelSftp` que usa
  `SftpPaymentTransport`), lectura de archivo remoto, pipeline completo hasta Postgres.
- NO cubierto aun: el flujo MT101_PAY completo (put + rename sobre SFTP del banco) — el
  riesgo criptografico ya quedo descartado, pero conviene un smoke de dispatch antes de
  produccion; POI/XLSX, plugins gRPC remotos y sources Azure/GCS/S3 en nativo.

## Reproducir

```bash
docker run -d --name ih-sftp-test --network quarkus_default atmoz/sftp bank:bankpass:::in
# copiar fixture y correr el driver (ver scratchpad/sftp-native-e2e.mjs de la sesion o
# reconstruirlo con los pasos de arriba)
```
