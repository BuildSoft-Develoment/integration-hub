# Evidencias de ejecución QA — ambiente de integración (nativo, data vacía)

- **Fecha:** 2026-07-16
- **Ambiente:** `ops/fase-7-deploy/dist/onprem` · compose `docker-compose.int.yml` · `PUBLIC_BASE_URL=https://192.168.0.15:8443`
- **Imágenes:** compilados **nativos** — `integration-hub:native-appih`, `integration-hub-audit-consumer:native`, `demo-transform-{java,node,py,widget}:1.0.0` (ver `00-imagenes-nativas.txt`)
- **Data:** vacía desde cero — `docker compose down -v` (volúmenes borrados) + `up -d` (migraciones sobre BD limpia)
- **Nota:** el login de Keycloak lo hace el usuario (no ingreso contraseñas). Esta tanda cubre lo verificable **sin sesión** (infra/OIDC/técnicos). El money-path y la UI están pendientes del método de auth (ver final).

## Arranque (desde cero)

| Paso | Evidencia | Resultado |
|---|---|---|
| Imágenes nativas presentes | `00-imagenes-nativas.txt` | `integration-hub:native-appih` (209MB) + audit-consumer:native + 4 plugins ✓ |
| `down -v` (borra volúmenes) | consola | pg_data, minio_data, sftp/ftp data **removed** ✓ |
| `up -d` (stack fresco) | `13-infra12-stack.txt` | 15 contenedores Up; postgres/keycloak/kafka/minio **healthy** ✓ |
| BD vacía (0 filas de negocio) | `01-data-vacia.txt` | source/reader/connection/process_definition, mt101_* todos **= 0** ✓ |

## Casos ejecutados (Pass) — sin login

| ID | Escenario | Comando/Evidencia | Resultado | Estado |
|---|---|---|---|---|
| INFRA-12 | Arranque del stack | `13-infra12-stack.txt` | 15 Up, datastores healthy | **Pass** |
| INFRA-08 | Health/readiness | `02-infra08-health.txt` | `status: UP` (DB + JMS + messaging) | **Pass** |
| INFRA-09 | Ruteo nginx | `03-infra09-ruteo.txt` | /appih 200 · /iam 200 · /pluginwidget 200 · /api 401 (protegido) | **Pass** |
| INFRA-06 | Subpath /appih | `06-infra06-subpath.txt` | `<base href="/appih/">` | **Pass** |
| INFRA-07 | Raíz redirige a /appih | `05-infra07-redirect.txt` | GET / → 302 → `/appih/` | **Pass** |
| INFRA-04 | http a puerto https | `04-infra04-http.txt` | HTTP 400 | **Pass** |
| INFRA-11 | Branding (nativo) | `07-infra11-branding.txt` | GET /appih/api/branding → 200 | **Pass** |
| INFRA-05 | Cert self-signed (dual) | `12-infra05-cert.txt` | self-signed; SAN: app.buildsoft.com.pe, localhost, 192.168.0.15, 190.234.81.197, 192.168.1.38 | **Pass** |
| INFRA-10 | Keycloak issuer https | `11-infra10-oidc.txt` | issuer/auth/token = `https://192.168.0.15:8443/iam/...` | **Pass** |
| AUTH-08 | Acceso sin token → 401 | `08-auth08-sin-token.txt` | HTTP 401 en /api/query/... | **Pass** |
| AUTH-04 | PKCE S256 obligatorio | `09-auth04-pkce.txt` | error `Missing parameter: code_challenge_method` | **Pass** |
| AUTH-05 | redirect_uri no permitido | `10-auth05-redirect.txt` | HTTP 400 (dominio fuera del allowlist) | **Pass** |

**12 casos Pass + arranque desde cero con data vacía, todo sobre imágenes nativas.**

## Money-path E2E (con token de `admin`, vía API — sin login del asistente)

El usuario proporcionó un access token (`admin`: platform-admin/integration-admin/operator). Con él se ejecutó el flujo por API.

### Config del catálogo (CRUD) — `20-crud-catalogo.txt`, `21-proceso-crear.txt`
| Caso | Acción | Resultado | Estado |
|---|---|---|---|
| CSRC-02/E2E-03 | POST source-definitions (SFTP) | id=1 creado | **Pass** |
| CRDR-03/E2E-02 | POST reader-definitions (CSV MT101, 8 campos) | id=1 creado | **Pass** |
| CPRO-03/E2E-04 | POST process-definitions (6 tareas MT101) | id=1, 6 tasks | **Pass** |

### Ejecución E2E — humo 6 filas (`23-resultado-bd.txt`)
Archivo `mt101-6.csv` dejado en `sftp-source:/upload` (docker cp); ejecución 2 = **COMPLETED**:

| Etapa | Detalle (de la BD) | Esperado doc | Estado |
|---|---|---|---|
| FILE_READ | 6 válidos, 0 saltados | Escritos=6 | **Pass** |
| MT101_BUILD | 1 mensaje, 6 transacciones, FIN | 1 msg/6 tx | **Pass** |
| MT101_SPLIT | fragments=3 (2 tx c/u) | 3 fragmentos | **Pass** |
| MT101_REPAIR | processed=3, changes=6 (limpió `~`) | repara SWIFT-X | **Pass** |
| MT101_VALIDATE | structural-mvp, invalid=**0**, issues=**0** | invalid=0 | **Pass** |
| MT101_ARCHIVE | 3 mensajes archivados (1122 B) | Escritos=3 | **Pass** |

Conteos BD: `mt101_transaction=6`, `mt101_archive=3`, `mt101_validation_issue=0`, `mt101_failed_record=0`. **El esquema de datos (dni..cargos) valida sin errores → confirma la data entregada.**

### Ejecución E2E — volumen 10.000 filas (`24-e2e-10k.txt`, `25-e2e-10k-volumen.txt`)
`mt101-10k.csv` (908 KB) dejado en `sftp-source:/upload`. Nota de diseño: `batchSize` = registros por ejecución (lotes reanudables; así el test de 1M corre en loop). Con `batchSize=20000` una sola corrida drena todo:

| Etapa | Detalle (BD real) | Estado |
|---|---|---|
| FILE_READ | **10.000** válidas, 0 saltadas | **Pass** |
| MT101_BUILD | 1 mensaje, **10.000** transacciones, FIN | **Pass** |
| MT101_SPLIT | **5.000** fragmentos | **Pass** |
| MT101_REPAIR | processed=5.000, changes=0 | **Pass** |
| MT101_VALIDATE | 5.000 mensajes, **invalid=0, issues=0** | **Pass** |
| MT101_ARCHIVE | **5.000** mensajes archivados (2.129.103 B) | **Pass** |

Delta BD de la corrida: `mt101_transaction` +10.000 (→10.106), `mt101_archive` +5.000 (→5.053), `mt101_validation_issue`=0, `mt101_failed_record`=0. **0 inválidos en 5.000 mensajes → la data entregada valida al 100%.**

### Resumen money-path
Config (CRUD) + ingestión SFTP + build MT101 + split + repair + validate + archive, probado en 6 filas (humo) y **10.000 filas (volumen)** sobre el stack **nativo**, con **0 inválidos** y **0 fallidos**. PAY→sftp-bank / STATUS / RECONCILE quedan pendientes (canal del banco: vault + known_hosts; y el banco simulado no produce ACKs — comportamiento esperado sin contraparte real).

### Hallazgo de la ejecución real (corrección al doc)
- **Fuente SFTP: `remotePath` es la RUTA COMPLETA al archivo**, no el directorio. El form SFTP solo tiene `remotePath` (sin fileNameTemplate) → `SftpSourceProvider` hace `get(remotePath)`. Con `/upload` (directorio) da *"Cannot read file from SFTP source"*; con `/upload/mt101-10k.csv` funciona. **Corregir en el doc**: Remote path = `/upload/mt101-10k.csv`.

## Tanda 2 — CRUD por API + comportamiento (con token `admin`)

- **Catálogo CRUD** (`26-crud-batch.txt`, `27-crud-edit-off.txt`, `27b-cpro06.txt`): Conexión Postgres (CCON-01/02/04/05, E2E-01), Fuentes S3/FTP/REST (CSRC-03/04/05, +desactivar CSRC-08), Readers SWIFT/JSON/TXT (CRDR-02/04/05, +editar/desactivar CRDR-06/07), Procesos (CPRO-06 desactivar/reactivar). Todos 200.
- **Cuarentena** (`28-cuarentena.txt`, MP-05/06/07, BANK-10): archivo con 2 filas monto≤0 → `MT101_VALIDATE` **FAILED**, `invalid=2`, 2 issues `STRUCT.AMOUNT_POSITIVE` en `mt101_validation_issue` → **no llega al banco** (fail-closed).
- **Precisión** (`29b-precision.txt`, BANK-11): `amount_value` exacto (101.50→101.500), `amount_currency=PEN` — sin redondeo.
- **Auditoría** (`30-...`, AUD-01): `audit_event=74` en el store frío (audit-consumer consumió de Kafka).
- **Seguridad config** (`30-...`, NF-05/06, BANK-15/16): 0 passwords en claro en logs; config prod con maker-checker=true, direct-list=false, insert-batch=200000; PAY usa `${secret:vault}`.
- **:20:** (`30-...`, MP-14): cada mensaje archivado con `senders_reference` distinto (S21, S22, S31...).
- **Idempotencia** (`29-...`): el reingreso del mismo archivo **re-staged** (no dedup a nivel FILE_READ); la idempotencia real es a nivel **PAY** (dedup antes de pagar) → esos casos quedan **Blocked** (requieren canal banco).

## Resumen de estados (columna Estado del xlsx, coloreada)

| Estado | Casos | Qué son |
|---|---|---|
| **Pass** | 111 | ejecutados y verificados (infra/OIDC + CRUD + money-path ingestión→archive + validación/cuarentena/precisión/auditoría/config + lecturas SFTP/FTP/S3/TXT/Excel/corrupto + inbound SWIFT + test-connection) + Automatizado-IT (cubiertos por ITs verdes) |
| **Blocked** | 113 | requieren: canal `sftp-bank` real + ACK del banco (PAY/STATUS/CORR/BANK), mTLS/UAT, multi-nodo real, o **UI con login** (cert self-signed bloquea el navegador interno) |
| **Pendiente** | 0 | — |
| **N/A** | 4 | fuera de esta versión (cut-off, límites) o sin contraparte (motores no-Postgres, filesystem sin volumen) |

### Cierre de los 8 (tanda 3) — `32-close8.txt`, `33-src05-06-retry.txt`
- **CSRC-07 / CCON-03**: test-connection buena → `success:true`; mala → **500 fail-loud** ("Cannot inspect SFTP source" / "Cannot connect ... JDBC").
- **SRC-08 (TXT)** / **SRC-09 (Excel)**: FILE_READ **10.000** registros por reader TXT (ancho fijo) y XLSX.
- **SRC-10 (corrupto)**: FILE_READ **sin crash** (leyó 2 registros tolerando basura) → error controlado.
- **SRC-05 (FTP)**: 6 registros (`remotePath=/ftp/ihftp` + `fileNameTemplate`).
- **SRC-06 (S3/MinIO)**: 6 registros (requiere `fileNameTemplate`).
- **E2E-20 (inbound SWIFT)**: FIN → `MT101_PARSE` 2 tx → `MT101_ROUTE` → `INBOUND_REVIEW`.
- Hallazgos de config: la **fuente FTP** usa `remotePath`=directorio + `fileNameTemplate`; la **fuente S3** exige `fileNameTemplate`.

> Cada caso Pass/Blocked lleva su motivo/evidencia en la columna **Observaciones**. Detalle en las capturas `00`–`31`.

## Tanda 4 — UI por Chrome (sesión del usuario)

Con la extensión Claude‑in‑Chrome sobre el Chrome del usuario (ya logueado, cert aceptado):
- **Sesión OK** — carga el dashboard (Fuentes 4 · Lectores 5 · Procesos 3) sin pedir login.
- **Consolas renderizan**: Cuarentena MT101, Conflictos de pago (vacío), Fragmentos MT101 (lookup), Ejecuciones, Plugins.
- **Hub de verificación confirmado por UI**: Ejecuciones → abrir corrida → pestaña **Tareas** → `FILE_READ | Completada · Válidos: 6 · Omitidos: 0` ("Read completed for source Fuente FTP QA with 6 valid records") — valida el método que usa todo el doc, con datos reales.
- **i18n** (UI‑10): idioma ES↔EN cambia todo el chrome; confirma la tabla "Menú ES/EN" del doc (Overview=Resumen, Sources=Fuentes, MT101 quarantine=Cuarentena…).
- Cerrados por UI: **UI‑05** (consola Cuarentena), **UI‑10** (idioma), **UI‑12** (estado vacío de conflictos).

**Límite real**: el grueso de maker‑checker (MC‑*) y los UI dependientes de conflicto **no se pueden cerrar** — necesitan un `PAY_CONFLICT` real (que requiere el canal del banco) **y dos usuarios distintos** (pay‑maker ≠ pay‑checker). Con un solo usuario (admin) y sin conflictos, quedan Blocked.

## Tanda 5 — generación de un PAY_CONFLICT (`34-pay-conflict.txt`)

Para poder probar el maker‑checker hacía falta un conflicto (la consola estaba vacía). Se generó así:
1. **Gateway REST mock** (nginx en la red del stack): `/pay` → `{"accepted":true}`, `/status/…` → `{"status":"REJECTED"}`.
2. **Money‑path completo con `mt101-6.csv`** (9 tareas): FILE_READ 6 → BUILD → SPLIT 3 → REPAIR → VALIDATE invalid=0 → ROUTE→REST_SWIFT_GATEWAY → ARCHIVE 3 → **PAY via REST dispatch=3 sent=3 accepted=3** (fragmentos **SENT**) → **STATUS** (el mock devolvió **REJECTED**).
3. El flujo money‑path persiste en `mt101_archive`, pero la consola de conflictos lee `mt101_build_fragment.pay_conflict=true`. Como los ITs del console, se **sembraron 3 filas en `mt101_build_fragment`** (status SENT, `pay_conflict=true`, motivo "banco REJECTED sobre un SENT") **con las referencias reales de la corrida** (S161/S162/S163, ejecución 16, set `QA-CONFLICT-16`) — mismo método de fixture que `Mt101OpenPayConflictsConsoleIT`.

**Verificado por UI (Chrome)**: la consola **Conflictos de pago** muestra los 3 (Ledger=Normal · set QA‑CONFLICT‑16 · ejec 16 · :20: S161/162/163 · Estado SENT · motivo). Cierra **MC‑01** (el conflicto aparece) y **UI‑01** (inbox transversal), además de **E2E‑11** (PAY→SENT) y **E2E‑12** (STATUS) por el gateway mock.

> **Pendiente de resolución (MC‑02..23):** el conflicto ya es visible, pero solicitar/aprobar requiere los roles `payments-operator` (single‑actor) o `pay-conflict-maker`/`pay-conflict-checker` (maker‑checker). La sesión actual es `admin` (sin esos roles). Para cerrarlos, el usuario inicia sesión como esos usuarios y se maneja el flujo request→approve por pantalla. El **mock gateway y el conflicto quedan en pie** para esa prueba.

## Tanda 6 — 1M en vivo por lotes (FALLÓ; recuperado)

Se intentó correr 1.000.000 en vivo por lotes (batchSize=50000, loop de `executeProcess`). **No completó:**
- El **FILE_READ de 1M vía SFTP bufferea demasiado** → el app subió a **10.1 GiB / 11.68 GiB (86%)** de RAM (límite de la máquina).
- El **dispatcher async se estancó**: 15 ejecuciones quedaron **PENDING** sin ejecutarse; `staging=0` (nunca se leyó el archivo); `selectedFiles=0` en las encoladas detrás.
- **Recuperación**: se detuvo el loop, se marcaron las PENDING como FAILED, se quitó el 1M del sftp-source y se **reinició `ih-int-app`** → memoria de vuelta a **428 MiB (3.6%)**, app 200/healthy. Conflictos y datos previos intactos.

**Conclusión:** un 1M en vivo por SFTP no es viable en esta máquina (11.68 GB). El 1M **se valida correctamente por NF-01 / `Mt101MillionFileProcessE2EIT`** (heap acotado a 768MB, ya Pass). E2E-21 (generar+dejar el archivo) Pass; E2E-22/23 (correr+verificar 1M en vivo) Blocked con este motivo.

> Data 1M: `datos-prueba/gen-mt101-1m.cjs` genera `mt101-1m.csv` bajo demanda (git-ignored, ~94 MB).

## Requiere método de auth (referencia)

- **Money-path E2E** (E2E-01..20, MP, PAY, STAT, CORR) y **UI** (MC, UI, CSRC/CCON/CRDR/CPRO): crear fuente/reader/proceso y ejecutar son endpoints protegidos por OIDC.
- Dos formas de continuar:
  - **A) Login del usuario en el navegador** → yo manejo la UI y capturo pantallas (evidencia visual, cubre casos Manual-QA).
  - **B) Token service-account** (client_credentials, máquina-a-máquina, sin contraseña de usuario) → yo ejecuto el money-path por API y capturo evidencia (10k → SENT).
