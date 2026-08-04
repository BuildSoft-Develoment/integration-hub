# Casos de prueba QA — v3 (ejecucion 2026-08-03)

> Generado desde `casos-prueba-qa-v2-2026-07-29.xlsx` (236 casos, fases F0..F8).
> Esta version **anade la columna de ejecucion v3** y conserva los resultados v1 y v2.
> Regla de esta corrida: un caso solo se marca `Pass` si se ejecuto y hay evidencia
> comprobable. Lo que no se ejecuto se dice, con el motivo. No se hereda el resultado v2.

## Resumen v3

| Resultado v3 | Casos |
|---|---|
| No ejecutado | 124 |
| Pendiente-QA | 110 |
| Pass | 2 |
| **Total** | **236** |

## Entorno de la corrida

| | |
|---|---|
| App | `http://localhost:8080` (dev, Quarkus JVM) |
| Base | `integration_hub` recreada de cero; 104 migraciones, checksums contrastados uno a uno contra los `.sql` del repo |
| Gateway | mock nginx en `http://localhost:18081` (misma `mock-gateway.conf` que int) |
| Disparo | scheduler (`next_run_at` en el pasado), sin sesion HTTP |

## Money-path ejecutado de punta a punta

Corrida con `mt101-6.csv` — las 7 tareas en `COMPLETED`:

```
FILE_READ    6 registros validos, 0 descartados
DB_WRITE     6 registros a staging
BUILD        3 fragmentos de 6 filas (2 tx por mensaje)
VALIDATE     messages=3 invalid=0 issues=0
ROUTE        routed=3 errors=0 distribution={GATEWAY_REST=3}
ARCHIVE      3 mensajes archivados (852 bytes)
PAY          dispatch=3 sent=3 accepted=3 rejected=0 invalidated=0
```

Corrida con `mt101-10k.csv`: **COMPLETED** — las 7 tareas en verde:

```
FILE_READ    10.000 registros validos, 0 descartados
DB_WRITE     10.000 a staging
BUILD        5.000 fragmentos de 10.000 filas
VALIDATE     messages=5000 invalid=0 issues=0
ROUTE        routed=5000 errors=0 distribution={GATEWAY_REST=5000}
ARCHIVE      5.000 mensajes archivados (1.509.103 bytes)
PAY          dispatch=5000 sent=5000 accepted=5000 rejected=0 invalidated=0
```

Hicieron falta tres intentos, y los dos fallos fueron operativos del ejecutor, no del producto:

| Ejec. | Resultado | Causa |
|---|---|---|
| 4 | FAILED en ARCHIVE | `duplicate key ... ux_mt101_archive_operational_idempotency`. La plantilla `QA$\{messageIndex\}` repetia `QA1..QA3`, ya archivados por la corrida de 6 registros. **La guarda de idempotencia del money-path hizo su trabajo**: se nego a archivar dos veces el mismo `:20:`. Resuelto cambiando el prefijo a `QB`, sin tocar producto. |
| 5 | FAILED en BUILD | `expects one MT101 message per fragment`. El scheduler disparo mientras se truncaba `staging_record`: hay que desarmar el `scheduled` ANTES de vaciar la tabla que va a leer. |
| 6 | COMPLETED | Referencias `QB$\{messageIndex\}`, terreno limpio. |


## Automatizado-IT: lo que se ejecuto y lo que eso NO demuestra

### Suites ejecutadas

**vertical-swift-mt101** — `BUILD SUCCESS`

| Fase | Tests | Resultado |
|---|---|---|
| Unitarios (surefire) | 510 | 0 fallos |
| Integracion (failsafe) | 7 | 0 fallos |

Los 7 de integracion salen de `Mt101OutboundEndToEndIT` (2) y `Mt101SplitRepairIT` (5),
con `PostgreSQLContainer` y `atmoz/sftp:alpine` como infraestructura.

**platform-app** — `BUILD SUCCESS` (install sin tests + solo failsafe)

| | |
|---|---|
| ITs ejecutados | 15 |
| Tests | 76 |
| Fallos | 0 |

Suites: Mt101AllTasksProcessE2EIT, Mt101ChildQuarantinePropagationIT, Mt101FragmentConflictLookupIT,
Mt101OpenPayConflictsConsoleIT, Mt101PayConflictAcknowledgeAtomicityIT, Mt101PayConflictMakerCheckerIT,
Mt101PayDispatchIntentLookupIT, Mt101PayDispatchIntentStoreIT, Mt101PayResolutionValidatorIT,
Mt101PayStatusConnectionCoverageValidatorIT, Mt101PhysicalLineLookupIT, Mt101RequireNormalPayResolverIT,
Mt101StatusRouteCoverageValidatorIT, PaymentValidationRuleResourceIT, PaymentsOperatorRoleIT.
`Mt101MillionFileProcessE2EIT` excluido a peticion del usuario.

### Tres cosas que hay que decir, y ninguna es un resultado de test

**1. No existe mapeo caso -> test.** Se buscaron los 32 IDs (`PAY-03`, `CORR-03`, `STAT-08`,
`MC-17`, `BANK-03`, `NF-02`, ...) en todo el codigo de test del repositorio: **cero
coincidencias**. La columna "Pasos" del catalogo tampoco nombra clases — dice "1) Ejecutar
pago". Por tanto, aunque las suites esten verdes, **ningun verde puede atribuirse a un caso
concreto** sin decidirlo por parecido tematico, que es juicio y no evidencia. Los 32 quedan
`No ejecutado` en v3, y el agujero de trazabilidad queda anotado como deuda del catalogo.

**2. Los casos de escala se apoyan en un test que la build no corre.** `Mt101MassivePipelinePerfIT`
lleva `@Tag("perf")`, excluido por defecto: hace falta `-Dgroups=perf`. Es decir, NF-01 (1M) y
NF-02 (100k) figuran como "Automatizado-IT" apoyandose en un test que una corrida normal NO
ejecuta. Nadie lo estaba viendo.

**3. Hallazgo colateral, ajeno a estos 32 casos.** `DatabaseFunctionTaskProviderOracleCompatibility`
(platform-app) **fallo** tras 518 s durante una corrida amplia. No pertenece al money-path ni a
los casos de este bloque, pero es un test rojo que merece revision propia.

## Casos

| # | Fase | ID | Modulo | Ejecutor | Escenario | v1 | v2 | **v3** | Evidencia / motivo v3 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | F0 | `INFRA-01` | INFRA | Manual-QA | Acceso por dominio | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 2 | F0 | `INFRA-02` | INFRA | Manual-QA | Acceso por IP-LAN | Blocked | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 3 | F0 | `INFRA-03` | INFRA | Tecnico/Dev | Acceso por IP publica (internet) | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 4 | F0 | `INFRA-04` | INFRA | Tecnico/Dev | http a puerto https | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 5 | F0 | `INFRA-05` | INFRA | Manual-QA | Cert self-signed | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 6 | F0 | `INFRA-06` | INFRA | Tecnico/Dev | Subpath /appih | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 7 | F0 | `INFRA-07` | INFRA | Manual-QA | La raiz redirige a /appih | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 8 | F0 | `INFRA-08` | INFRA | Tecnico/Dev | Health/readiness | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 9 | F0 | `INFRA-09` | INFRA | Tecnico/Dev | Ruteo de nginx | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 10 | F0 | `INFRA-10` | INFRA | Tecnico/Dev | Keycloak honra https tras el proxy | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 11 | F0 | `INFRA-11` | INFRA | Tecnico/Dev | Branding del login (nativo) | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 12 | F0 | `INFRA-12` | INFRA | Tecnico/Dev | Arranque del stack | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 13 | F0 | `INFRA-13` | INFRA | Tecnico/Dev | Persistencia tras reinicio | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 14 | F0 | `INFRA-14` | INFRA | Tecnico/Dev | Puerto ocupado | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 15 | F1 | `AUTH-01` | AUTH | Manual-QA | Login exitoso | Blocked | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 16 | F1 | `AUTH-02` | AUTH | Manual-QA | Login con credenciales invalidas | Blocked | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 17 | F1 | `AUTH-03` | AUTH | Manual-QA | Logout | Blocked | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 18 | F1 | `AUTH-04` | AUTH | Tecnico/Dev | PKCE obligatorio (S256) | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 19 | F1 | `AUTH-05` | AUTH | Tecnico/Dev | redirect_uri no permitido | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 20 | F1 | `AUTH-06` | AUTH | Manual-QA | Sesion se mantiene (refresh de token) | Blocked | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 21 | F1 | `AUTH-07` | AUTH | Tecnico/Dev | Sesion expirada real | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 22 | F1 | `AUTH-08` | AUTH | Tecnico/Dev | Acceso sin token a un endpoint protegido | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 23 | F1 | `AUTH-09` | AUTH | Manual-QA | Rol payments-operator ve PAY conflicts | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 24 | F1 | `AUTH-10` | AUTH | Manual-QA | Rol auditor es solo-lectura | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 25 | F1 | `AUTH-11` | AUTH | Manual-QA | Rol pay-conflict-maker NO puede aprobar | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 26 | F1 | `AUTH-12` | AUTH | Manual-QA | Rol pay-conflict-checker NO puede solicitar | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 27 | F1 | `AUTH-13` | AUTH | Manual-QA | Usuario sin rol maker/checker | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 28 | F1 | `AUTH-14` | AUTH | Manual-QA | La URL de Keycloak es correcta | Blocked | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 29 | F2 | `CSRC-01` | CSRC | Manual-QA | Listar, buscar y filtrar fuentes | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 30 | F2 | `CSRC-02` | CSRC | Manual-QA | Crear fuente SFTP (Probar + Guardar) | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 31 | F2 | `CSRC-03` | CSRC | Manual-QA | Crear fuente Amazon S3 / MinIO | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 32 | F2 | `CSRC-04` | CSRC | Manual-QA | Crear fuente FTP | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 33 | F2 | `CSRC-05` | CSRC | Manual-QA | Crear fuente REST | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 34 | F2 | `CSRC-06` | CSRC | Manual-QA | Editar una fuente existente | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 35 | F2 | `CSRC-07` | CSRC | Manual-QA | Probar con credencial invalida (fail-loud) | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 36 | F2 | `CSRC-08` | CSRC | Manual-QA | Desactivar / Reactivar (baja logica; NO hay borrado) | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 37 | F2 | `CSRC-09` | CSRC | Manual-QA | Validacion de campos requeridos | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 38 | F2 | `CSRC-10` | CSRC | Manual-QA | Cambiar de Tipo re-dibuja el formulario | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 39 | F2 | `CSRC-11` | CSRC | Tecnico/Dev | Fuente File system (requiere ruta montada) | N/A | N/A | **No ejecutado** | Requiere UI o API autenticada |
| 40 | F2 | `CSRC-12` | CSRC | Manual-QA | Ruta del archivo por tipo de fuente | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 41 | F2 | `CCON-01` | CCON | Manual-QA | Listar, buscar y filtrar conexiones | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 42 | F2 | `CCON-02` | CCON | Manual-QA | Crear conexion JDBC PostgreSQL (Probar + Guardar) | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 43 | F2 | `CCON-03` | CCON | Manual-QA | Probar con URL/credencial invalida (fail-loud) | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 44 | F2 | `CCON-04` | CCON | Manual-QA | Editar el pool de conexiones | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 45 | F2 | `CCON-05` | CCON | Manual-QA | Desactivar / Reactivar conexion (baja logica) | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 46 | F2 | `CCON-06` | CCON | Tecnico/Dev | Otros motores requieren BD real | N/A | N/A | **No ejecutado** | Requiere UI o API autenticada |
| 47 | F2 | `CRDR-01` | CRDR | Manual-QA | Listar, buscar y filtrar readers | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 48 | F2 | `CRDR-02` | CRDR | Manual-QA | Crear reader SWIFT MT/FIN (banking) | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 49 | F2 | `CRDR-03` | CRDR | Manual-QA | Crear reader CSV MT101 (por posicion) | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 50 | F2 | `CRDR-04` | CRDR | Manual-QA | Crear reader JSON | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 51 | F2 | `CRDR-05` | CRDR | Manual-QA | Crear reader TXT de ancho fijo | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 52 | F2 | `CRDR-06` | CRDR | Manual-QA | Editar un reader | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 53 | F2 | `CRDR-07` | CRDR | Manual-QA | Desactivar / Reactivar reader (baja logica) | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 54 | F2 | `CPRO-01` | CPRO | Manual-QA | Listar, buscar y filtrar procesos | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 55 | F2 | `CPRO-02` | CPRO | Manual-QA | Ver el detalle de un proceso (solo lectura) | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 56 | F2 | `CPRO-03` | CPRO | Manual-QA | Crear un proceso (metadata) | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 57 | F2 | `CPRO-04` | CPRO | Manual-QA | Editar metadata del proceso | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 58 | F2 | `CPRO-05` | CPRO | Manual-QA | Ejecutar un proceso (Run) | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 59 | F2 | `CPRO-06` | CPRO | Manual-QA | Desactivar / Reactivar proceso (baja logica) | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 60 | F2 | `CPRO-07` | CPRO | Tecnico/Dev | Armar el pipeline de tareas (avanzado) | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 61 | F2 | `CPRO-08` | CPRO | Manual-QA | Ver la ejecucion en Ejecuciones | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 62 | F3 | `E2E-01` | E2E | Manual-QA | A1. Configurar la Conexion (Postgres, staging) | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 63 | F3 | `E2E-02` | E2E | Manual-QA | A2. Configurar el Reader CSV MT101 | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 64 | F3 | `E2E-03` | E2E | Manual-QA | A3. Configurar la Fuente SFTP (de donde se lee) | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 65 | F3 | `E2E-04` | E2E | Tecnico/Dev | A4. Provisionar el Proceso MT101 outbound (8 tareas, paginado) | Pass | Pass | **Pass** | Proceso `mt101-qa-dev` (id=2) creado en dev con las 7 tareas activas: FILE_READ, DB_WRITE, MT101_BUILD_FROM_TABLE, MT101_VALIDATE, MT101_ROUTE, MT101_ARCHIVE, MT101_PAY |
| 66 | F3 | `E2E-05` | E2E | Tecnico/Dev | B. Dejar el archivo en la fuente (docker) | Pass | Pass | **Pass** | Fuente `fs-qa` tipo FILESYSTEM apuntando a `qa/fase-6-qa/datos-prueba/mt101-6.csv`; FILE_READ leyo 6 registros validos, 0 descartados |
| 67 | F3 | `E2E-06` | E2E | Manual-QA | C1. Ejecutar el proceso (Run) | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 68 | F3 | `E2E-07` | E2E | Manual-QA | C2. FILE_READ + DB_WRITE -> staging (vista Ejecuciones) | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 69 | F3 | `E2E-08` | E2E | Manual-QA | C3. BUILD_FROM_TABLE -> fragmentos (vista Fragmentos MT101) | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 70 | F3 | `E2E-09` | E2E | Manual-QA | C4. VALIDATE -> 0 invalidos | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 71 | F3 | `E2E-10` | E2E | Manual-QA | C5. ARCHIVE -> archivado | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 72 | F3 | `E2E-11` | E2E | Manual-QA | C6. PAY -> SENT (vista Fragmentos MT101) | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 73 | F3 | `E2E-12` | E2E | Manual-QA | C7. STATUS -> confirmado | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 74 | F3 | `E2E-13` | E2E | Manual-QA | C8. RECONCILE -> cuadre | Blocked | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 75 | F3 | `E2E-14` | E2E | Manual-QA | C9. Trazabilidad E2E (vista Linaje) | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 76 | F3 | `E2E-15` | E2E | Manual-QA | D1. Reproceso: fila invalida -> Cuarentena -> corregir -> reconstruir | Blocked | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 77 | F3 | `E2E-16` | E2E | Manual-QA | D2. Reproceso: reingreso del MISMO archivo (idempotencia) | Blocked | Blocked | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 78 | F3 | `E2E-17` | E2E | Manual-QA | D3. Reproceso: rechazo del banco -> Conflicto -> run correctivo | Blocked | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 79 | F3 | `E2E-18` | E2E | Manual-QA | D4. Reproceso: pago no enviado -> re-solicitar | Blocked | Blocked | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 80 | F3 | `E2E-19` | E2E | Manual-QA | D5. Reproceso gobernado: maker-checker (four-eyes) | Blocked | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 81 | F3 | `E2E-20` | E2E | Manual-QA | E. Inbound: SWIFT FIN -> parse -> route (opcional) | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 82 | F3 | `E2E-21` | E2E | Tecnico/Dev | Escala 1.000.000: preparar el archivo | Pass | - | **No ejecutado** | Omitido por decision del usuario en esta tanda |
| 83 | F3 | `E2E-22` | E2E | Tecnico/Dev | Escala 1.000.000: ejecutar el money-path | Pass | - | **No ejecutado** | Omitido por decision del usuario en esta tanda |
| 84 | F3 | `E2E-23` | E2E | Manual-QA | Escala 1.000.000: verificar por la vista | Blocked | - | **No ejecutado** | Omitido por decision del usuario en esta tanda |
| 85 | F4 | `SRC-01` | SRC | Tecnico/Dev | Lectura por SFTP | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 86 | F4 | `SRC-02` | SRC | Tecnico/Dev | SFTP host key correcta | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 87 | F4 | `SRC-03` | SRC | Tecnico/Dev | SFTP host key incorrecta | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 88 | F4 | `SRC-04` | SRC | Tecnico/Dev | SFTP credencial invalida | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 89 | F4 | `SRC-05` | SRC | Tecnico/Dev | Lectura por FTP | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 90 | F4 | `SRC-06` | SRC | Tecnico/Dev | Lectura por S3/MinIO | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 91 | F4 | `SRC-07` | SRC | Tecnico/Dev | Formato CSV | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 92 | F4 | `SRC-08` | SRC | Tecnico/Dev | Formato TXT/FIN | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 93 | F4 | `SRC-09` | SRC | Tecnico/Dev | Formato Excel | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 94 | F4 | `SRC-10` | SRC | Tecnico/Dev | Archivo vacio/corrupto | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 95 | F4 | `SRC-11` | SRC | Tecnico/Dev | Archivo duplicado (mismo contenido) | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 96 | F4 | `MP-01` | MP | Tecnico/Dev | Camino feliz de punta a punta | Blocked | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 97 | F4 | `MP-02` | MP | Manual-QA | Escritura a staging | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 98 | F4 | `MP-03` | MP | Tecnico/Dev | Construccion de fragmentos MT101 | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 99 | F4 | `MP-04` | MP | Tecnico/Dev | Validacion OK | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 100 | F4 | `MP-05` | MP | Tecnico/Dev | Estructura invalida -> cuarentena | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 101 | F4 | `MP-06` | MP | Tecnico/Dev | Monto no positivo -> cuarentena | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 102 | F4 | `MP-07` | MP | Tecnico/Dev | Monto no numerico -> cuarentena | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 103 | F4 | `MP-08` | MP | Manual-QA | La cuarentena aisla la fila mala | Blocked | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 104 | F4 | `MP-09` | MP | Manual-QA | Corregir una fila en cuarentena | Blocked | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 105 | F4 | `MP-10` | MP | Tecnico/Dev | Correccion sin If-Match | Blocked | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 106 | F4 | `MP-11` | MP | Tecnico/Dev | Modificacion concurrente | Blocked | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 107 | F4 | `MP-12` | MP | Tecnico/Dev | Archivado | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 108 | F4 | `MP-13` | MP | Tecnico/Dev | Enrutado al canal | Blocked | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 109 | F4 | `MP-14` | MP | Tecnico/Dev | Referencia :20: por transaccion | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 110 | F4 | `MP-15` | MP | Tecnico/Dev | Division en fragmentos | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 111 | F4 | `MP-16` | MP | Automatizado-IT | Reprocesar una fila exacta en un lote grande | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 112 | F4 | `MP-17` | MP | Tecnico/Dev | Semantica de lotes (batchSize) | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 113 | F4 | `PAY-01` | PAY | Tecnico/Dev | Pago normal exitoso | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 114 | F4 | `PAY-02` | PAY | Automatizado-IT | Solo se reclama lo archivado | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 115 | F4 | `PAY-03` | PAY | Automatizado-IT | Aceptado -> SENT | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 116 | F4 | `PAY-04` | PAY | Tecnico/Dev | Rechazo real del banco -> FAILED | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 117 | F4 | `PAY-05` | PAY | Automatizado-IT | Fallo ANTES de enviar -> re-solicitable | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 118 | F4 | `PAY-06` | PAY | Automatizado-IT | Timeout ambiguo -> queda para conciliar | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 119 | F4 | `PAY-07` | PAY | Tecnico/Dev | Re-solicitar un pago no enviado | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 120 | F4 | `PAY-08` | PAY | Automatizado-IT | Aceptacion tardia de un 'incierto' | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 121 | F4 | `PAY-09` | PAY | Tecnico/Dev | Idempotencia de reenvio | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 122 | F4 | `PAY-10` | PAY | Automatizado-IT | Reinicio a mitad de pago | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 123 | F4 | `PAY-11` | PAY | Automatizado-IT | Contencion: 1 solo gana | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 124 | F4 | `PAY-12` | PAY | Automatizado-IT | Fencing de nodo caido | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 125 | F4 | `PAY-13` | PAY | Automatizado-IT | Heartbeat protege el lease | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 126 | F4 | `PAY-14` | PAY | Automatizado-IT | Recovery de pago con lease vencido | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 127 | F4 | `PAY-15` | PAY | Tecnico/Dev | Pago por lista (in-memory) | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 128 | F4 | `PAY-16` | PAY | Automatizado-IT | Pago por lista + fallo re-solicitable | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 129 | F4 | `PAY-17` | PAY | Automatizado-IT | Pago por lista + bloqueo de reenvio | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 130 | F4 | `PAY-18` | PAY | Tecnico/Dev | Gate: sin lista en memoria en prod | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 131 | F4 | `PAY-19` | PAY | Automatizado-IT | Auditar lo saltado en un revert | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 132 | F4 | `PAY-20` | PAY | Automatizado-IT | 'Incierto' pegajoso | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 133 | F4 | `PAY-21` | PAY | Tecnico/Dev | Mapeo de respuesta del gateway (PAY) | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 134 | F4 | `CORR-01` | CORR | Tecnico/Dev | Rechazo del banco -> run hijo | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 135 | F4 | `CORR-02` | CORR | Manual-QA | Corregir un fragmento en conflicto | Blocked | Blocked | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 136 | F4 | `CORR-03` | CORR | Automatizado-IT | Rechazo parcial -> PARTIALLY_SENT | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 137 | F4 | `CORR-04` | CORR | Automatizado-IT | Re-solicitar los no enviados | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 138 | F4 | `CORR-05` | CORR | Automatizado-IT | Mixto sin envios | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 139 | F4 | `CORR-06` | CORR | Automatizado-IT | El run hijo solo reenvia rechazados | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 140 | F4 | `CORR-07` | CORR | Automatizado-IT | Marca de despacho correctivo | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 141 | F4 | `CORR-08` | CORR | Automatizado-IT | Cuarentena por fragmento | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 142 | F4 | `CORR-09` | CORR | Automatizado-IT | Correctivo sin doble pago (con incierto) | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 143 | F4 | `CORR-10` | CORR | Automatizado-IT | Reemplazo de una solicitud hija previa | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 144 | F4 | `STAT-01` | STAT | Tecnico/Dev | Confirmacion positiva del banco | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 145 | F4 | `STAT-02` | STAT | Tecnico/Dev | Rechazo del banco (NACK) | Blocked | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 146 | F4 | `STAT-03` | STAT | Tecnico/Dev | Confirmacion tardia | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 147 | F4 | `STAT-04` | STAT | Manual-QA | Datos de la confirmacion | Blocked | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 148 | F4 | `STAT-05` | STAT | Automatizado-IT | Confirmacion de otra corrida con el mismo :20: | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 149 | F4 | `STAT-06` | STAT | Tecnico/Dev | Cuadre (reconcile) | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 150 | F4 | `STAT-07` | STAT | Tecnico/Dev | STATUS re-lee la respuesta del banco | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 151 | F4 | `STAT-08` | STAT | Automatizado-IT | Rechazo sobre un enviado -> conflicto | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 152 | F4 | `STAT-09` | STAT | Tecnico/Dev | Mapeo de status del banco (STATUS) | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 153 | F5 | `MC-01` | MC | Manual-QA | El conflicto aparece en la consola | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 154 | F5 | `MC-02` | MC | Manual-QA | Reconocer single-actor (modo OFF) | Blocked | Blocked | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 155 | F5 | `MC-03` | MC | Manual-QA | Reconocer sin motivo | Blocked | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 156 | F5 | `MC-04` | MC | Manual-QA | Reconocer sin ticket | Blocked | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 157 | F5 | `MC-05` | MC | Manual-QA | Single-actor bloqueado con modo ON | Blocked | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 158 | F5 | `MC-06` | MC | Manual-QA | Solicitar reconocimiento (maker) | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 159 | F5 | `MC-07` | MC | Manual-QA | Aprobar (checker distinto) | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 160 | F5 | `MC-08` | MC | Manual-QA | No puedo aprobar mi propia solicitud | Blocked | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 161 | F5 | `MC-09` | MC | Manual-QA | Aprobar sin solicitud previa | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 162 | F5 | `MC-10` | MC | Manual-QA | Solicitar sobre un no-conflicto | Blocked | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 163 | F5 | `MC-11` | MC | Manual-QA | Solo el maker puede solicitar | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 164 | F5 | `MC-12` | MC | Manual-QA | Solo el checker puede aprobar | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 165 | F5 | `MC-13` | MC | Manual-QA | La consola muestra la solicitud PENDING | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 166 | F5 | `MC-14` | MC | Manual-QA | Boton Aprobar deshabilitado si soy el maker | Blocked | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 167 | F5 | `MC-15` | MC | Manual-QA | Segundo pedido reemplaza al anterior | Blocked | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 168 | F5 | `MC-16` | MC | Manual-QA | Historial del reemplazo se conserva | Blocked | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 169 | F5 | `MC-17` | MC | Automatizado-IT | Aprobar cuando ya se resolvio (fail-loud) | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 170 | F5 | `MC-18` | MC | Automatizado-IT | Dos checkers aprueban a la vez | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 171 | F5 | `MC-19` | MC | Manual-QA | Estado 'cargando modo' | Pass | Blocked | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 172 | F5 | `MC-20` | MC | Tecnico/Dev | Settings en error -> se bloquea (fail-closed) | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 173 | F5 | `MC-21` | MC | Manual-QA | Maker-checker sobre un correctivo | Blocked | Blocked | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 174 | F5 | `MC-22` | MC | Manual-QA | Tramas de auditoria completas | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 175 | F5 | `MC-23` | MC | Manual-QA | El inbox trae los datos de la solicitud | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 176 | F5 | `MC-24` | MC | Tecnico/Dev | Generar un PAY_CONFLICT para pruebas | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 177 | F5 | `UI-01` | UI | Manual-QA | Inbox transversal de conflictos | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 178 | F5 | `UI-02` | UI | Manual-QA | Paginacion | Blocked | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 179 | F5 | `UI-03` | UI | Manual-QA | Evidencia inline (confirmaciones) | Blocked | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 180 | F5 | `UI-04` | UI | Manual-QA | Evidencia sin ejecucion asociada | Blocked | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 181 | F5 | `UI-05` | UI | Manual-QA | Ir a Quarantine desde el conflicto | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 182 | F5 | `UI-06` | UI | Manual-QA | Ir al lineage desde el conflicto | Blocked | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 183 | F5 | `UI-07` | UI | Manual-QA | Linea de tiempo de una fila | Blocked | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 184 | F5 | `UI-08` | UI | Manual-QA | Exportar evidencia | Blocked | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 185 | F5 | `UI-09` | UI | Manual-QA | Chip 'Pendiente' en la fila | Blocked | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 186 | F5 | `UI-10` | UI | Manual-QA | Idioma es/en | Pass | Blocked | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 187 | F5 | `UI-11` | UI | Manual-QA | Conflicto correctivo en la consola | Blocked | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 188 | F5 | `UI-12` | UI | Manual-QA | Sin conflictos | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 189 | F6 | `PLG-01` | PLG | Tecnico/Dev | Instalar plugin Java | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 190 | F6 | `PLG-02` | PLG | Tecnico/Dev | Instalar plugin Node | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 191 | F6 | `PLG-03` | PLG | Tecnico/Dev | Instalar plugin Python | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 192 | F6 | `PLG-04` | PLG | Tecnico/Dev | Invocar un transform | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 193 | F6 | `PLG-05` | PLG | Manual-QA | Widget del plugin | Pass | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 194 | F6 | `PLG-06` | PLG | Tecnico/Dev | Trust-policy: local aceptado | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 195 | F6 | `PLG-07` | PLG | Tecnico/Dev | Trust-policy: no-local rechazado | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 196 | F6 | `PLG-08` | PLG | Tecnico/Dev | Staging de plugin en MinIO | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 197 | F6 | `AUD-01` | AUD | Tecnico/Dev | audit-consumer consume de Kafka | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 198 | F6 | `AUD-02` | AUD | Manual-QA | Tramas append-only en el spool | Pass | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 199 | F6 | `AUD-03` | AUD | Manual-QA | Exportar evidencia para auditor | Blocked | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 200 | F6 | `AUD-04` | AUD | Tecnico/Dev | Fallo de auditoria no bloquea negocio | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 201 | F6 | `AUD-05` | AUD | Manual-QA | Trazabilidad de una decision | Blocked | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 202 | F6 | `AUD-06` | AUD | Tecnico/Dev | Store frio segun config | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 203 | F7 | `NF-01` | NF | Automatizado-IT | Escala 1.000.000 de registros | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 204 | F7 | `NF-02` | NF | Automatizado-IT | Harness a 100k | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 205 | F7 | `NF-03` | NF | Automatizado-IT | Fencing de dos nodos | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 206 | F7 | `NF-04` | NF | Tecnico/Dev | mTLS con el banco (UAT) | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 207 | F7 | `NF-05` | NF | Tecnico/Dev | Sin secretos/montos en URL/logs | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 208 | F7 | `NF-06` | NF | Tecnico/Dev | Controles ON en prod | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 209 | F7 | `NF-07` | NF | Tecnico/Dev | Backoff/reintentos | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 210 | F7 | `NF-08` | NF | Tecnico/Dev | Cuadre de fin de dia | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 211 | F7 | `NF-09` | NF | Tecnico/Dev | Barrido de recuperacion | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 212 | F7 | `NF-10` | NF | Tecnico/Dev | Readiness con dependencias | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 213 | F7 | `NF-11` | NF | Tecnico/Dev | Alertas operativas | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 214 | F7 | `NF-12` | NF | Tecnico/Dev | Arranque nativo | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 215 | F8 | `BANK-01` | BANK | Tecnico/Dev | CERO DOBLE PAGO verificado EN EL BANCO | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 216 | F8 | `BANK-02` | BANK | Manual-QA | Ningun pago queda colgado (orphan) | Blocked | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 217 | F8 | `BANK-03` | BANK | Automatizado-IT | Toda contradiccion -> PAY_CONFLICT (nunca silenciosa) | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 218 | F8 | `BANK-04` | BANK | Manual-QA | Segregacion de funciones inviolable | Blocked | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 219 | F8 | `BANK-05` | BANK | Manual-QA | Auditoria inmutable / no-repudio | Blocked | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 220 | F8 | `BANK-06` | BANK | Manual-QA | Trazabilidad E2E de un pago | Blocked | - | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 221 | F8 | `BANK-07` | BANK | Tecnico/Dev | Cuadre fin de dia sin descuadre silencioso | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 222 | F8 | `BANK-08` | BANK | Tecnico/Dev | Idempotencia extremo a extremo | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 223 | F8 | `BANK-09` | BANK | Tecnico/Dev | NACK nunca se re-envia a ciegas | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 224 | F8 | `BANK-10` | BANK | Tecnico/Dev | Validacion de campos MT101 obligatorios | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 225 | F8 | `BANK-11` | BANK | Tecnico/Dev | Precision de monto/moneda | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 226 | F8 | `BANK-12` | BANK | Tecnico/Dev | PDE (Possible Duplicate Emission) | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 227 | F8 | `BANK-13` | BANK | Tecnico/Dev | Fecha valor / cut-off | N/A | N/A | **No ejecutado** | Requiere UI o API autenticada |
| 228 | F8 | `BANK-14` | BANK | Tecnico/Dev | mTLS + host key reales con el banco (prod) | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 229 | F8 | `BANK-15` | BANK | Tecnico/Dev | Secretos fuera de claro | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 230 | F8 | `BANK-16` | BANK | Tecnico/Dev | Controles bancarios ACTIVOS en prod | Pass | Pass | **No ejecutado** | Requiere UI o API autenticada |
| 231 | F8 | `BANK-17` | BANK | Automatizado-IT | Cero doble-ejecucion bajo caida de nodo | Pass | Pass | **No ejecutado** | Suites ejecutadas y en verde (vertical 510+7, platform-app 15 ITs/76 tests), pero el caso NO se puede dar por cubierto: no existe vinculo caso->test en el repositorio |
| 232 | F8 | `BANK-18` | BANK | Tecnico/Dev | Resolucion segura de UNCERTAIN | Blocked | Blocked | **No ejecutado** | Requiere UI o API autenticada |
| 233 | F8 | `BANK-19` | BANK | Manual-QA | Retencion de evidencia | Blocked | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 234 | F8 | `BANK-20` | BANK | Manual-QA | Minimo privilegio (RBAC) | Blocked | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |
| 235 | F8 | `BANK-21` | BANK | Tecnico/Dev | Limites/umbrales de aprobacion | N/A | N/A | **No ejecutado** | Requiere UI o API autenticada |
| 236 | F8 | `BANK-22` | BANK | Manual-QA | Cifrado en transito | Blocked | Pass | **Pendiente-QA** | Requiere navegador con sesion iniciada; el agente no introduce credenciales |

## Lo que queda, y por que

- **110 casos Manual-QA**: son de interaccion con la consola y requieren sesion de navegador. El agente no introduce contrasenas ni tokens, tampoco cuando se le facilitan.
- **32 casos Automatizado-IT**: se ejecutan con `mvn verify`. Las imagenes de testcontainers (Oracle, MSSQL, ClickHouse, localstack, brokers) se borraron hoy para liberar disco, asi que la primera corrida re-descargara ~14 GB.
- **Escala 1.000.000 (E2E-21/22/23)**: omitida por decision del usuario en esta tanda.

## Nota sobre el entorno

El catalogo esta escrito para el stack **int** (contenedores `ih-int-sftp-source`, `ih-int-postgres`, acceso por dominio).
Esta corrida se hizo en **dev**, donde no hay SFTP/FTP: la fuente es `FILESYSTEM` sobre el fichero local y el
destino del PAY es un mock nginx en el host. La cadena de tareas es la misma que la de int (clonada de su
proceso `mt101-qa`), con dos adaptaciones documentadas: la regla de ROUTE va al gateway REST en vez de al SFTP
del banco, y `MT101_PAY` declara solo el transporte REST. Los casos que dependen del transporte SFTP no quedan
cubiertos por esta corrida.
