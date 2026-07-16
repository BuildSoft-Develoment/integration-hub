# Casos de prueba QA — Integration Hub / money-path MT101 — 2026-07-16

Documento de casos de prueba **exhaustivo** para el Equipo de QA. Acompaña al tracker `casos-prueba-qa-2026-07-16.xlsx`.

**Total: 228 casos.** Cada caso indica su **Ejecutor**:

- **Manual-QA** — lo ejecuta un QA humano en la UI con esta guía.
- **Tecnico/Dev** — requiere apoyo de dev/ops (inducir fallos, comandos, backend).
- **Automatizado-IT** — ya cubierto por una prueba automática (se nombra); QA no lo repite manual.

## Preparación (leer antes de ejecutar)

**Acceso:** abrir `https://<host>/appih` (local: `https://192.168.0.15:8443/appih`). El navegador avisa por el **cert self-signed** → Firefox: *Avanzado → Aceptar el riesgo*; Chrome: teclear `thisisunsafe`. Una vez por origen.

**Usuarios de prueba:**

| Usuario | Contraseña | Para qué |
|---|---|---|
| admin | admin123 | acceso completo |
| operator | operator123 | operador de procesos |
| auditor | auditor123 | **solo lectura** (no mueve dinero) |
| payments-operator | payments123 | opera pagos; reconoce single-actor |
| pay-maker | maker123 | rol **MAKER** (solicita) |
| pay-checker | checker123 | rol **CHECKER** (aprueba) |

**Navegación (menú Audit):** PAY Conflicts (inbox de conflictos) · Quarantine (corregir filas) · Record Lineage (rastro de un pago) · Spool (tramas de auditoría) · Fragments.

> **maker-checker:** los casos MC-05..23 y AUTH-11..13 requieren el modo activado (dev: `mt101.pay.conflict.acknowledge.maker-checker.enabled=true` + reiniciar el app).

## Datos de formularios (valores exactos por campo)

Valores listos para copiar en el CRUD de configuración (módulos **CSRC/CCON/CRDR/CPRO**). Los hostnames (`sftp-source`, `minio`, `postgres`, `echo`) son los del stack de integración: el botón **Probar** los resuelve porque el backend corre dentro de la misma red Docker.

### Fuentes — `/appih/#/sources`

| Tipo | Campos (valor) |
|---|---|
| **SFTP** | Host=`sftp-source` · Port=`22` · Username=`ihsource` · Password=`ihsource` · Remote path=`/upload` · Strict host key checking=`OFF` · Timeout(ms)=`10000` · Media type=`text/plain` |
| **Amazon S3** | Region=`us-east-1` · Bucket=`ih-source-inbox` · Endpoint=`http://minio:9000` · Auth mode=`access-key` · Access key ID=`minioadmin` · Secret access key=`minioadmin` · Path-style access=`ON` (obligatorio MinIO) · Selection mode=`all` |
| **FTP** | Host=`ftp-source` · Port=`21` · Username=`ihftp` · Password=`ihftp` · Remote path=`/` · Passive mode=`ON` |
| **REST** | URL=`http://echo` · Method=`GET` · Auth type=`No authentication` · File name=`echo-payload.json` · Timeout(s)=`10` · Media type=`application/json` |
| **File system** | Path=`/data/inbox` — requiere volumen montado (el stack int no lo trae; usar SFTP/S3/FTP) |

### Conexiones — `/appih/#/connections`

| Motor | Campos (valor) |
|---|---|
| **PostgreSQL** | JDBC URL=`jdbc:postgresql://postgres:5432/integration_hub` · Username=`postgres` · Password=`admin` · Min size=`1` · Max size=`10` · Acquisition timeout(s)=`5` · Validation timeout(s)=`5` · Reap timeout(min)=`10` · JDBC properties JSON=`{}` |
| Oracle / SQL Server / MySQL / MongoDB | Requieren una BD real; el stack int solo trae PostgreSQL → `N/A` si no hay instancia |

### Readers — `/appih/#/readers`

| Tipo | Campos (valor) |
|---|---|
| **SWIFT MT/FIN** | Encoding=`UTF-8` · SWIFT-X strict=`marcado` |
| **CSV** | Delimiter=`,` · Encoding=`UTF-8` · Data starts at row=`2` · Campos: `reference`/TEXT, `amount`/NUMBER, `currency`/TEXT (Type: TEXT/NUMBER/DATE) |
| **TXT** (ancho fijo) | Campos con posiciones: `reference` Start=`1` End=`16`; `amount` Start=`17` End=`32` Type=`NUMBER` |
| **JSON** | Field mappings: opcional |
| **Excel** (XLS/XLSX) | Sheet index=`0` · Data starts at row=`2` · Trim values=`ON` |

### Procesos — `/appih/#/processes`

| Acción | Valores |
|---|---|
| **Crear** | Nombre=`Proceso QA demo` · Descripción=`Proceso de prueba QA` · Programado=`OFF` (manual) · Activo=`ON` |
| **Ejecutar** | Botón **Ejecutar (Run)** → la corrida aparece en `/appih/#/executions` |
| **Armar pipeline** | Avanzado (Tecnico/Dev): arrastrar tareas de la paleta (File read → Parse → Validate → Build → Archive → Route → Pay → Status → Reconcile) y conectarlas |

> **Sin borrado físico:** en Fuentes/Conexiones/Readers/Procesos la "D" del CRUD es **Desactivar** (baja lógica, se conserva para auditoría). No hay botón de borrado.

## Flujo E2E — de la configuración al archivo, la ejecución y los reprocesos (módulo E2E)

Recorrido completo, en orden, con **qué configurar en cada paso**. El proceso MT101 es un pipeline de **10 tareas**; crearlo en la UI es avanzado (dev, vía API `POST /api/process-definitions`) — QA configura **Fuente + Reader + Conexión** (formularios simples), deja el archivo en el docker, y ejecuta/verifica/reprocesa.

**Fase A — Configurar el catálogo** (`E2E-01..04`): Conexión Postgres → Reader CSV MT101 (8 columnas por posición) → Fuente SFTP (`sftp-source`) → Proceso MT101 (dev lo provisiona; su `FILE_READ` apunta a la Fuente+Reader).

**Fase B — Dejar el archivo** (`E2E-05`). Los datos **ya están entregados** en `qa/fase-6-qa/datos-prueba/` — el QA no genera nada:

| Archivo | Formato | Filas | Uso |
|---|---|---|---|
| `mt101-10k.csv` | CSV | 10.000 | **el principal** (reader CSV del flujo) |
| `mt101-10k.xlsx` | Excel | 10.000 | inspeccionar / reader Excel |
| `mt101-10k.txt` | TXT ancho fijo | 10.000 | reader TXT |
| `mt101-6.csv` | CSV | 6 | humo rápido |

Config de reader por formato + layout del TXT: ver `datos-prueba/LEEME-datos.md`. Los puertos SFTP/FTP/MinIO **no están expuestos al host**, así que se copia dentro del contenedor:

```bash
docker cp mt101-10k.csv ih-int-sftp-source:/home/ihsource/upload/   # SFTP (recomendado)
# alternativas: ih-int-ftp-source:/ftp/ihftp/  |  MinIO: mc cp ... local/ih-source-inbox/
```

**Esquema de columnas** (el mismo en los 4 archivos; muestra de 6 filas, el `~` en `concepto` lo limpia `MT101_REPAIR`):

```csv
dni,nombre,cuenta,moneda,monto,bic,concepto,cargos
10000001,BENEFICIARIO 1,001000000001,PEN,101.50,BCPLPEPLXXX,PAGO ~ 1,SHA
10000002,BENEFICIARIO 2,001000000002,PEN,102.50,BCPLPEPLXXX,PAGO ~ 2,SHA
10000003,BENEFICIARIO 3,001000000003,PEN,103.50,BCPLPEPLXXX,PAGO ~ 3,SHA
10000004,BENEFICIARIO 4,001000000004,PEN,104.50,BCPLPEPLXXX,PAGO ~ 4,SHA
10000005,BENEFICIARIO 5,001000000005,PEN,105.50,BCPLPEPLXXX,PAGO ~ 5,SHA
10000006,BENEFICIARIO 6,001000000006,PEN,106.50,BCPLPEPLXXX,PAGO ~ 6,SHA
```

**Mapeo BUILD (CSV → MT101):** `moneda`→currency · `monto`→amount · `cuenta`→beneficiary account · `nombre`+`dni`→beneficiary · `bic`→institution BIC · `concepto`→remittance · `cargos`→details of charges. Envelope: `senderLt=SGOBFRPPAXXX` · `receiverLt=BCPLPEPLXXXX`.

**Fase C — Ejecutar y verificar por etapa** (`E2E-06..14`) — **todo por vistas, sin API**. El QA ejecuta con el botón **Ejecutar** (menú Procesos) y verifica en el **hub de verificación**: menú **Ejecuciones → abrir la corrida → pestaña "Tareas"** (columnas **Procesados/Escritos** por tarea):

| Etapa | Dónde mirar | Esperado |
|---|---|---|
| FILE_READ | Ejecuciones → Tareas → FILE_READ | Escritos = 6 (staging) |
| BUILD / SPLIT | Tareas + Auditoría → Fragmentos MT101 | 1 msg / 6 tx → 3 fragmentos |
| VALIDATE | Tareas → MT101_VALIDATE | invalid = 0 |
| ARCHIVE | Tareas → MT101_ARCHIVE | Escritos = 3 |
| PAY | Tareas + Auditoría → Fragmentos MT101 | enviados=3 aceptados=3 → estado **SENT** |
| STATUS | Tareas → MT101_STATUS | confirmados = 3 |
| RECONCILE | Tareas → MT101_RECONCILE | enviado == confirmado |
| Trazabilidad | botón *Ver trazabilidad* / Auditoría → Linaje por `:20:` | recorrido completo |

**Fase D — Reprocesos** (`E2E-15..19`), también por vistas: fila inválida → **Auditoría → Cuarentena MT101** (corregir + reconstruir) · reingreso idempotente (`Tareas → PAY` enviados=0) · rechazo del banco → **Auditoría → Conflictos de pago** → run correctivo visible en **Ejecuciones → Ejecuciones hijas** · pago no enviado → re-solicitar desde **Fragmentos MT101** · maker-checker (tramas en **Auditoría → Spool**). Detalle en la hoja **Flujo-E2E** del xlsx.

> **Menú ES/EN** (la app es bilingüe): Fuentes=Sources · Conexiones=Connections · Lectores=Readers · Procesos=Processes · Ejecuciones=Executions · Auditoría=Audit · Fragmentos MT101=MT101 fragments · Cuarentena MT101=MT101 quarantine · Linaje=Lineage · Conflictos de pago=PAY conflicts.

## Orden de ejecución (fases)

Los casos están **ordenados por secuencia de ejecución** (columna **Orden** y **Fase** en el xlsx). No se puede correr E2E sin configurar antes, ni verificar los controles bancarios sin haber pagado — por eso el orden es:

| Fase | Módulos | Casos |
|---|---|---|
| **F0. Infra / Deploy / Acceso** | INFRA | 14 |
| **F1. Autenticacion / Roles** | AUTH | 14 |
| **F2. Configuracion (catalogo)** | CSRC, CCON, CRDR, CPRO | 32 |
| **F3. Flujo E2E (money-path)** | E2E | 20 |
| **F4. Profundizacion por etapa** | SRC, MP, PAY, CORR, STAT | 65 |
| **F5. Maker-checker / Consolas** | MC, UI | 35 |
| **F6. Plataforma / Auditoria** | PLG, AUD | 14 |
| **F7. No funcionales** | NF | 12 |
| **F8. Aceptacion bancaria (homologacion)** | BANK | 22 |

> La columna **Orden** (1..228) da la secuencia sugerida de punta a punta. Dentro de una fase los casos son en su mayoría independientes; las dependencias fuertes están dentro de **Configuración → E2E**.

## Índice de módulos (en orden de ejecución)

- **INFRA** (F0) — Deploy / Infraestructura / Acceso (nginx, TLS, /appih) (14)
- **AUTH** (F1) — Autenticacion / OIDC / Roles (Keycloak) (14)
- **CSRC** (F2) — Config CRUD: Fuentes (/appih/#/sources) con valores por campo (11)
- **CCON** (F2) — Config CRUD: Conexiones JDBC (/appih/#/connections) (6)
- **CRDR** (F2) — Config CRUD: Readers (/appih/#/readers) (7)
- **CPRO** (F2) — Config CRUD: Procesos + Ejecuciones (/appih/#/processes) (8)
- **E2E** (F3) — Flujo E2E: configurar -> dejar archivo -> ejecutar -> verificar -> reprocesar (20)
- **SRC** (F4) — Fuentes (SFTP / FTP / S3-MinIO) (11)
- **MP** (F4) — MT101 Money-path (lectura -> construccion -> validacion -> archivo) (16)
- **PAY** (F4) — PAY / Anti-doble-pago (money-safety, dos nodos) (20)
- **CORR** (F4) — PAY Correctivo (rechazo, run hijo, parcial) (10)
- **STAT** (F4) — STATUS / RECONCILE / Confirmaciones del banco (8)
- **MC** (F5) — Maker-checker / PAY_CONFLICT (tanda-8/9) (23)
- **UI** (F5) — Consolas de UI (PAY conflicts, quarantine, lineage) (12)
- **PLG** (F6) — Plugins out-of-process (gRPC + widget) (8)
- **AUD** (F6) — Auditoria asincrona (Kafka -> store frio) (6)
- **NF** (F7) — No funcionales (rendimiento, resiliencia, seguridad) (12)
- **BANK** (F8) — Controles criticos bancarios / homologacion (vista consolidada) (22)


## INFRA — Deploy / Infraestructura / Acceso (nginx, TLS, /appih)  ·  F0. Infra / Deploy / Acceso

| ID | Ejecutor | Escenario | Precondición | Pasos | Resultado esperado | Prio | Tipo |
|---|---|---|---|---|---|---|---|
| INFRA-01 | Manual-QA | Acceso por dominio | DNS/hosts resuelve el dominio; stack arriba | 1) Abrir https://<dominio>/appih en el navegador  2) Aceptar el aviso de cert self-signed (ver Preparacion) | Carga la UI de Integration Hub | Alta | Funcional |
| INFRA-02 | Manual-QA | Acceso por IP-LAN | Stack arriba; en la PC cliente el hosts apunta el dominio a la IP | 1) Abrir la URL con el dominio (mapeado a la IP)  2) Aceptar cert | Carga la UI; el login funciona | Alta | Funcional |
| INFRA-03 | Tecnico/Dev | Acceso por IP publica (internet) | Router con port-forward 443 + DNS publico | 1) Desde internet, abrir https://<dominio>/appih | Carga la UI | Media | Funcional |
| INFRA-04 | Tecnico/Dev | http a puerto https | Stack arriba | 1) Abrir http://<host>:443/ (http, no https) | HTTP 400 'plain HTTP request was sent to HTTPS port' | Baja | Negativo |
| INFRA-05 | Manual-QA | Cert self-signed | Stack con cert self-signed | 1) Abrir la URL https | Sale el aviso de seguridad; al aceptar la excepcion (o importar el cert) se puede continuar | Media | Seguridad |
| INFRA-06 | Tecnico/Dev | Subpath /appih | Imagen native-appih | 1) Con curl: GET /appih/  2) Revisar el HTML | El index trae base href /appih/ y los recursos cargan bajo /appih | Alta | Funcional |
| INFRA-07 | Manual-QA | La raiz redirige a /appih | Stack arriba | 1) Abrir la URL sin /appih (solo el host) | Redirige automaticamente a /appih/ | Baja | Funcional |
| INFRA-08 | Tecnico/Dev | Health/readiness | Stack arriba | 1) GET /q/health/ready (curl o navegador) | Devuelve status UP con los chequeos de DB (y mensajeria) en UP | Alta | Funcional |
| INFRA-09 | Tecnico/Dev | Ruteo de nginx | Stack arriba | 1) Probar /appih/ (app), /api/ (API), /iam/ (login), /pluginwidget/ (widget) | Cada ruta responde desde su servicio correcto | Alta | Funcional |
| INFRA-10 | Tecnico/Dev | Keycloak honra https tras el proxy | Stack arriba | 1) GET /iam/realms/integration-hub/.well-known/openid-configuration | Las URLs (auth/token/issuer) son https con el hostname publico | Alta | Funcional |
| INFRA-11 | Tecnico/Dev | Branding del login (nativo) | Imagen nativa | 1) GET /appih/api/branding | HTTP 200 (no 500) -> el logo/marca del login carga bien | Media | Funcional |
| INFRA-12 | Tecnico/Dev | Arranque del stack | Imagenes cargadas (docker load) | 1) docker compose up -d  2) docker compose ps | Todos los contenedores en Up; postgres y keycloak en healthy | Alta | Funcional |
| INFRA-13 | Tecnico/Dev | Persistencia tras reinicio | Stack con datos | 1) docker compose restart  2) Verificar que los datos sigan | Los datos operacionales persisten y la app recupera | Media | Funcional |
| INFRA-14 | Tecnico/Dev | Puerto ocupado | Otro servicio usando el 443/8443 | 1) Levantar el stack | nginx no puede bindear; el error es claro; se resuelve liberando el puerto o cambiando NGINX_PORTS | Baja | Negativo |

## AUTH — Autenticacion / OIDC / Roles (Keycloak)  ·  F1. Autenticacion / Roles

| ID | Ejecutor | Escenario | Precondición | Pasos | Resultado esperado | Prio | Tipo |
|---|---|---|---|---|---|---|---|
| AUTH-01 | Manual-QA | Login exitoso | Usuario valido (ver Preparacion); stack arriba | 1) Abrir la URL /appih  2) Te redirige a la pantalla de login (Keycloak)  3) Ingresar usuario y contrasena  4) Aceptar | Vuelves autenticado a la app; se ve tu nombre de usuario arriba | Alta | Funcional |
| AUTH-02 | Manual-QA | Login con credenciales invalidas | Stack arriba | 1) En el login, ingresar una contrasena incorrecta  2) Aceptar | Keycloak muestra 'credenciales invalidas'; no entras | Alta | Negativo |
| AUTH-03 | Manual-QA | Logout | Sesion iniciada (P) | 1) Click en el menu de usuario > Salir | Se cierra la sesion; vuelve a la pantalla de login | Media | Funcional |
| AUTH-04 | Tecnico/Dev | PKCE obligatorio (S256) | - | 1) Con dev, llamar al endpoint de auth SIN el parametro code_challenge | Keycloak rechaza: error 'Missing parameter: code_challenge_method' (el login normal del navegador SI lo manda) | Alta | Seguridad |
| AUTH-05 | Tecnico/Dev | redirect_uri no permitido | - | 1) Con dev, llamar a auth con redirect_uri de un dominio no listado | HTTP 400: Keycloak rechaza (no esta en el allowlist del cliente) | Alta | Seguridad |
| AUTH-06 | Manual-QA | Sesion se mantiene (refresh de token) | Sesion iniciada (P) | 1) Dejar la app abierta ~5-10 min sin cerrar  2) Hacer una accion (abrir una consola) | La app sigue funcionando sin pedir re-login (el token se refresco solo) | Media | Funcional |
| AUTH-07 | Tecnico/Dev | Sesion expirada real | - | 1) Con dev, invalidar/expirar el refresh-token o la sesion SSO  2) Hacer una accion | La app detecta la sesion expirada y pide re-login | Media | Negativo |
| AUTH-08 | Tecnico/Dev | Acceso sin token a un endpoint protegido | - | 1) Con curl/Postman, GET a /api/query/mt101-fragments/pay-conflicts/open sin cabecera Authorization | HTTP 401 (no autorizado) | Alta | Seguridad |
| AUTH-09 | Manual-QA | Rol payments-operator ve PAY conflicts | Login como payments-operator (P); maker-checker OFF | 1) Ir a Audit > PAY Conflicts  2) En un conflicto: Resolver | Puede ver el inbox y (con maker-checker OFF) reconocer con motivo+ticket | Alta | Funcional |
| AUTH-10 | Manual-QA | Rol auditor es solo-lectura | Login como auditor (P) | 1) Ir a Audit > PAY Conflicts  2) Intentar reconocer/pagar | Puede VER, pero las acciones que mueven dinero le dan error/estan bloqueadas (403) | Alta | Seguridad |
| AUTH-11 | Manual-QA | Rol pay-conflict-maker NO puede aprobar | maker-checker ON; login como pay-maker (P); un PENDING existe | 1) Ver el conflicto con la solicitud pendiente  2) Intentar Aprobar | El boton Aprobar esta deshabilitado (te falta el rol checker); por API daria 403 | Alta | Seguridad |
| AUTH-12 | Manual-QA | Rol pay-conflict-checker NO puede solicitar | maker-checker ON; login como pay-checker (P) | 1) En un conflicto, buscar 'Solicitar reconocimiento' | No se te ofrece Solicitar (te falta el rol maker); por API daria 403 | Alta | Seguridad |
| AUTH-13 | Manual-QA | Usuario sin rol maker/checker | maker-checker ON; login como operator (sin roles dedicados) | 1) Abrir el panel de un conflicto | La UI avisa 'no tienes rol maker/checker' y no ofrece acciones | Media | Seguridad |
| AUTH-14 | Manual-QA | La URL de Keycloak es correcta | Navegador; stack arriba | 1) Iniciar login  2) Mirar la URL de la pantalla de Keycloak | Es la URL publica esperada (dominio/IP con https), la misma con que entraste | Media | Funcional |

## CSRC — Config CRUD: Fuentes (/appih/#/sources) con valores por campo  ·  F2. Configuracion (catalogo)

| ID | Ejecutor | Escenario | Precondición | Pasos | Resultado esperado | Prio | Tipo |
|---|---|---|---|---|---|---|---|
| CSRC-01 | Manual-QA | Listar, buscar y filtrar fuentes | Login como admin (P); menu Fuentes (/appih/#/sources) | 1) Abrir Fuentes  2) Ver la lista (nombre, tipo, estado)  3) Escribir en Buscar un texto  4) Usar el filtro Tipo (SFTP / FTP / Amazon S3 / REST...)  5) Usar el filtro Estado (Activo / Inactivo) | La lista se filtra por texto, por tipo y por estado; cada fila muestra nombre, tipo y si esta activa | Media | Funcional |
| CSRC-02 | Manual-QA | Crear fuente SFTP (Probar + Guardar) | Login admin (P); sftp-source arriba | 1) Fuentes > Nueva fuente  2) Nombre = Fuente SFTP QA  3) Tipo = SFTP  4) Host = sftp-source ; Port = 22 ; Username = ihsource ; Password = ihsource ; Remote path = /upload  5) Media type = text/plain ; Strict host key checking = OFF ; Timeout (ms) = 10000  6) Click Probar (Test)  7) Click Guardar (Save) | Probar devuelve conexion OK; al Guardar la fuente aparece en la lista como Activa | Alta | Funcional |
| CSRC-03 | Manual-QA | Crear fuente Amazon S3 / MinIO | Login admin (P); minio arriba (bucket ih-source-inbox) | 1) Nueva fuente  2) Nombre = Fuente S3 QA ; Tipo = Amazon S3  3) Region = us-east-1 ; Bucket = ih-source-inbox ; Endpoint = http://minio:9000  4) Auth mode = access-key -> Access key ID = minioadmin ; Secret access key = minioadmin  5) Path-style access = ON ; Selection mode = all ; Media type = text/plain  6) Probar  7) Guardar | Probar OK contra MinIO; se guarda como Activa. Nota: MinIO exige Path-style access = ON | Alta | Funcional |
| CSRC-04 | Manual-QA | Crear fuente FTP | Login admin (P); ftp-source arriba | 1) Nueva fuente  2) Nombre = Fuente FTP QA ; Tipo = FTP  3) Host = ftp-source ; Port = 21 ; Username = ihftp ; Password = ihftp ; Remote path = /  4) Passive mode = ON ; Timeout (ms) = 10000 ; Media type = text/plain  5) Probar  6) Guardar | Probar OK; se guarda Activa | Media | Funcional |
| CSRC-05 | Manual-QA | Crear fuente REST | Login admin (P); servicio echo arriba | 1) Nueva fuente  2) Nombre = Fuente REST QA ; Tipo = REST  3) URL = http://echo ; Method = GET ; Auth type = No authentication  4) File name = echo-payload.json ; Timeout (s) = 10 ; Media type = application/json  5) Probar  6) Guardar | Probar OK contra echo (HTTP 200); se guarda Activa | Media | Funcional |
| CSRC-06 | Manual-QA | Editar una fuente existente | Una fuente SFTP guardada (CSRC-02) | 1) Abrir la fuente en la lista  2) Click Editar  3) Cambiar Remote path = /upload/qa  4) Guardar | El cambio se guarda; al reabrir la fuente muestra el valor nuevo | Media | Funcional |
| CSRC-07 | Manual-QA | Probar con credencial invalida (fail-loud) | Login admin (P) | 1) Nueva fuente SFTP con los datos de CSRC-02 pero Password = malo  2) Click Probar | Probar FALLA con mensaje claro de error de conexion/autenticacion; no se cuelga y no da la fuente por buena | Alta | Negativo |
| CSRC-08 | Manual-QA | Desactivar / Reactivar (baja logica; NO hay borrado) | Una fuente Activa guardada | 1) Abrir la fuente  2) Click Desactivar (toggle Activo)  3) En la lista, filtro Estado = Inactivo: confirmar que aparece  4) Reactivar | La fuente pasa a Inactiva (deja de procesarse) y se puede reactivar. NO existe boton de borrado fisico: la baja es logica (se conserva para auditoria) | Media | Seguridad |
| CSRC-09 | Manual-QA | Validacion de campos requeridos | Login admin (P) | 1) Nueva fuente  2) Dejar Nombre vacio y/o Host vacio  3) Intentar Guardar | No deja guardar incompleto: el boton Guardar esta deshabilitado o marca el campo requerido | Media | Negativo |
| CSRC-10 | Manual-QA | Cambiar de Tipo re-dibuja el formulario | Login admin (P) | 1) Nueva fuente  2) Tipo = SFTP (aparecen Host/Port/Username...)  3) Cambiar Tipo = Amazon S3 | El formulario cambia a los campos de S3 (Bucket/Region/Endpoint/Auth mode) sin romperse | Baja | Funcional |
| CSRC-11 | Tecnico/Dev | Fuente File system (requiere ruta montada) | Login admin (P) | 1) Nueva fuente Tipo = File system  2) Path = /data/inbox ; Selection mode = all  3) Guardar / Probar | En el stack int NO hay volumen de archivos montado en el contenedor de la app por defecto; para lectura real montar un volumen o usar SFTP/S3/FTP. Marcar N/A si no aplica en el ambiente | Baja | Funcional |

## CCON — Config CRUD: Conexiones JDBC (/appih/#/connections)  ·  F2. Configuracion (catalogo)

| ID | Ejecutor | Escenario | Precondición | Pasos | Resultado esperado | Prio | Tipo |
|---|---|---|---|---|---|---|---|
| CCON-01 | Manual-QA | Listar, buscar y filtrar conexiones | Login admin (P); menu Conexiones (/appih/#/connections) | 1) Abrir Conexiones  2) Ver la lista  3) Buscar por texto  4) Filtrar por Motor y por Estado | La lista se filtra; cada fila muestra nombre, motor (PostgreSQL/Oracle/...) y estado | Media | Funcional |
| CCON-02 | Manual-QA | Crear conexion JDBC PostgreSQL (Probar + Guardar) | Login admin (P); postgres arriba | 1) Conexiones > Nueva conexion  2) Nombre = Conexion Postgres QA ; Motor (Tipo) = PostgreSQL  3) JDBC URL = jdbc:postgresql://postgres:5432/integration_hub  4) Username = postgres ; Password = admin  5) Min size = 1 ; Max size = 10 ; Acquisition timeout (s) = 5 ; Validation timeout (s) = 5 ; Reap timeout (min) = 10  6) JDBC properties JSON = {}  7) Probar  8) Guardar | Probar conecta a Postgres (int) OK; se guarda como Activa | Alta | Funcional |
| CCON-03 | Manual-QA | Probar con URL/credencial invalida (fail-loud) | Login admin (P) | 1) Nueva conexion con los datos de CCON-02 pero Password = malo  2) Click Probar | Falla con error claro (autenticacion/URL); no se cuelga | Alta | Negativo |
| CCON-04 | Manual-QA | Editar el pool de conexiones | Una conexion guardada (CCON-02) | 1) Abrir la conexion > Editar  2) Max size = 20  3) Guardar | El cambio se guarda; al reabrir muestra Max size = 20 | Media | Funcional |
| CCON-05 | Manual-QA | Desactivar / Reactivar conexion (baja logica) | Una conexion Activa | 1) Abrir la conexion  2) Desactivar (toggle Activo)  3) Filtro Estado = Inactivo: confirmar  4) Reactivar | Pasa a Inactiva y se reactiva; sin borrado fisico (se conserva para auditoria) | Media | Seguridad |
| CCON-06 | Tecnico/Dev | Otros motores requieren BD real | Login admin (P) | 1) Crear conexion Motor = Oracle / SQL Server / MySQL / MongoDB con una URL real | El stack int solo trae PostgreSQL; los demas motores requieren una instancia accesible. Probar solo si existe; si no, marcar N/A | Baja | Funcional |

## CRDR — Config CRUD: Readers (/appih/#/readers)  ·  F2. Configuracion (catalogo)

| ID | Ejecutor | Escenario | Precondición | Pasos | Resultado esperado | Prio | Tipo |
|---|---|---|---|---|---|---|---|
| CRDR-01 | Manual-QA | Listar, buscar y filtrar readers | Login admin (P); menu Readers (/appih/#/readers) | 1) Abrir Readers  2) Ver la lista  3) Buscar  4) Filtrar por Tipo y Estado | La lista se filtra; cada fila muestra nombre, tipo (CSV/TXT/JSON/XML/XLS/SWIFT MT) y estado | Media | Funcional |
| CRDR-02 | Manual-QA | Crear reader SWIFT MT/FIN (banking) | Login admin (P) | 1) Readers > Nuevo reader  2) Nombre = Reader SWIFT MT101 QA ; Tipo = SWIFT MT/FIN  3) Encoding = UTF-8  4) SWIFT-X strict = marcado  5) Guardar | Se guarda; queda disponible para las tareas de parseo MT101 del money-path | Alta | Funcional |
| CRDR-03 | Manual-QA | Crear reader CSV MT101 (por posicion) | Login admin (P) | 1) Nuevo reader  2) Nombre = Reader CSV MT101 QA ; Tipo = CSV  3) Delimiter = , ; Encoding = UTF-8 ; Data starts at row = 2 (hay cabecera)  4) Agregar 8 campos por posicion: dni(1) ; nombre(2) ; cuenta(3) ; moneda(4) ; monto(5) Type=NUMBER ; bic(6) ; concepto(7) ; cargos(8)  5) Guardar | El reader guarda las 8 columnas por posicion; es EXACTAMENTE el que consume el proceso MT101 outbound del flujo E2E. Type del desplegable: TEXT/NUMBER/DATE | Media | Funcional |
| CRDR-04 | Manual-QA | Crear reader JSON | Login admin (P) | 1) Nuevo reader  2) Nombre = Reader JSON QA ; Tipo = JSON  3) Field mappings: opcional (dejar vacio o mapear campos para tareas posteriores)  4) Guardar | Se guarda; los mappings JSON son opcionales | Media | Funcional |
| CRDR-05 | Manual-QA | Crear reader TXT de ancho fijo | Login admin (P) | 1) Nuevo reader  2) Nombre = Reader TXT QA ; Tipo = TXT  3) Agregar campos con Start/End/Size: reference Start = 1 End = 16 ; amount Start = 17 End = 32 Type = NUMBER  4) Guardar | Se guarda la definicion de posiciones fijas por campo | Media | Funcional |
| CRDR-06 | Manual-QA | Editar un reader | Un reader guardado | 1) Abrir el reader > Editar  2) Cambiar Encoding = ISO-8859-1 (o agregar un campo)  3) Guardar | El cambio se guarda | Media | Funcional |
| CRDR-07 | Manual-QA | Desactivar / Reactivar reader (baja logica) | Un reader Activo | 1) Abrir el reader  2) Desactivar  3) Filtro Estado = Inactivo: confirmar  4) Reactivar | Pasa a Inactivo y se reactiva; sin borrado fisico | Media | Seguridad |

## CPRO — Config CRUD: Procesos + Ejecuciones (/appih/#/processes)  ·  F2. Configuracion (catalogo)

| ID | Ejecutor | Escenario | Precondición | Pasos | Resultado esperado | Prio | Tipo |
|---|---|---|---|---|---|---|---|
| CPRO-01 | Manual-QA | Listar, buscar y filtrar procesos | Login admin (P); menu Procesos (/appih/#/processes) | 1) Abrir Procesos  2) Ver la lista  3) Buscar por nombre/descripcion/id  4) Filtrar por Modo (programado / todos) | La lista se filtra; cada fila muestra nombre, descripcion, estado y ultima/proxima corrida | Media | Funcional |
| CPRO-02 | Manual-QA | Ver el detalle de un proceso (solo lectura) | Login admin (P); un proceso existente | 1) Procesos  2) Abrir un proceso  3) Ver Overview (nombre, descripcion, ultima/proxima corrida) y las tareas del pipeline | Se ve el detalle completo sin editar; las tareas del flujo se muestran en orden | Media | Funcional |
| CPRO-03 | Manual-QA | Crear un proceso (metadata) | Login admin (P) | 1) Procesos > Crear proceso  2) Nombre = Proceso QA demo ; Descripcion = Proceso de prueba QA  3) Programado (Scheduled) = OFF (ejecucion manual) ; Activo = ON  4) Guardar | El proceso se crea (aun sin tareas); armar el grafo de tareas es avanzado -> ver CPRO-07 | Media | Funcional |
| CPRO-04 | Manual-QA | Editar metadata del proceso | Un proceso guardado | 1) Abrir el proceso > Editar  2) Cambiar Descripcion / activar Programado y poner Frecuencia (Every)  3) Guardar | El cambio se guarda | Media | Funcional |
| CPRO-05 | Manual-QA | Ejecutar un proceso (Run) | Login admin (P); un proceso ejecutable | 1) Abrir el proceso  2) Click Ejecutar (Run)  3) Esperar el aviso | Muestra 'Proceso ejecutado con exito'; la corrida aparece en Ejecuciones (/appih/#/executions) | Alta | Funcional |
| CPRO-06 | Manual-QA | Desactivar / Reactivar proceso (baja logica) | Un proceso Activo | 1) Abrir el proceso  2) Desactivar (toggle Activo)  3) Filtro por estado: confirmar  4) Reactivar | Pasa a Inactivo (no se agenda ni ejecuta) y se reactiva; sin borrado fisico | Media | Seguridad |
| CPRO-07 | Tecnico/Dev | Armar el pipeline de tareas (avanzado) | Login admin (P); un proceso en edicion | 1) En el editor del proceso abrir la paleta de tareas (File read, Parse MT101, Validate, Build, Archive, Route, Pay, Status, Reconcile...)  2) Arrastrar y conectar las tareas  3) Configurar cada tarea (fuente, reader, conexion, tabla, mapeos)  4) Guardar | Se compone el money-path MT101; requiere conocer el pipeline (apoyo dev). El money-path ya se valida en los modulos MP/PAY/STAT | Alta | Funcional |
| CPRO-08 | Manual-QA | Ver la ejecucion en Ejecuciones | Una corrida realizada (CPRO-05) | 1) Abrir /appih/#/executions  2) Buscar la corrida (por proceso o id)  3) Abrir el detalle > Ver trazabilidad | Se ve el estado de la corrida y las tareas ejecutadas; hay link a la trazabilidad (lineage) | Media | Funcional |

## E2E — Flujo E2E: configurar -> dejar archivo -> ejecutar -> verificar -> reprocesar  ·  F3. Flujo E2E (money-path)

| ID | Ejecutor | Escenario | Precondición | Pasos | Resultado esperado | Prio | Tipo |
|---|---|---|---|---|---|---|---|
| E2E-01 | Manual-QA | A1. Configurar la Conexion (Postgres, staging) | Login admin (P); postgres arriba | 1) Conexiones > Nueva conexion (ver Datos-Formularios / CCON-02): Nombre=Conexion Postgres QA ; Motor=PostgreSQL ; JDBC URL=jdbc:postgresql://postgres:5432/integration_hub ; Usuario=postgres ; Password=admin  2) Probar  3) Guardar | Probar OK; la conexion queda Activa. Es la base para staging y tablas del pipeline | Alta | Funcional |
| E2E-02 | Manual-QA | A2. Configurar el Reader CSV MT101 | Login admin (P) | 1) Readers > Nuevo reader (ver CRDR-03): Nombre=Reader CSV MT101 QA ; Tipo=CSV ; Delimiter=, ; Encoding=UTF-8 ; Data starts at row=2  2) Agregar 8 campos por posicion: dni(1), nombre(2), cuenta(3), moneda(4), monto(5 NUMBER), bic(6), concepto(7), cargos(8)  3) Guardar | El reader guarda las 8 columnas; es el que parsea el CSV del banco a staging | Alta | Funcional |
| E2E-03 | Manual-QA | A3. Configurar la Fuente SFTP (de donde se lee) | Login admin (P); sftp-source arriba | 1) Fuentes > Nueva fuente (ver CSRC-02): Nombre=Fuente SFTP QA ; Tipo=SFTP ; Host=sftp-source ; Port=22 ; Username=ihsource ; Password=ihsource ; Remote path=/upload ; Strict host key checking=OFF  2) Probar  3) Guardar | Probar OK; la fuente queda Activa apuntando a la carpeta /upload del sftp-source | Alta | Funcional |
| E2E-04 | Tecnico/Dev | A4. Provisionar el Proceso MT101 outbound (10 tareas) | Fuente (E2E-03) y Reader (E2E-02) creados; sus IDs | 1) Dev crea el proceso via API POST /api/process-definitions con 10 tareas EN ORDEN: FILE_READ(usa sourceId+readerId) -> MT101_BUILD (mapea moneda/monto/cuenta/nombre/dni/bic/concepto/cargos; envelope senderLt=SGOBFRPPAXXX receiverLt=BCPLPEPLXXXX) -> MT101_SPLIT (maxTransactionsPerFragment=2) -> MT101_REPAIR (stripNonSwiftXChars) -> MT101_VALIDATE (ruleSet=structural-mvp, failOn=ERROR) -> MT101_ROUTE -> MT101_ARCHIVE -> MT101_PAY -> MT101_STATUS -> MT101_RECONCILE  2) QA: /appih/#/processes, abrir el proceso y verificar que existe, esta Activo y su FILE_READ apunta a la Fuente+Reader correctos | El proceso MT101 queda disponible y Activo. Armarlo tarea-por-tarea en la UI es avanzado (paleta del editor); en la practica lo provisiona dev via API | Alta | Funcional |
| E2E-05 | Tecnico/Dev | B. Dejar el archivo en la fuente (docker) | Acceso al host docker; archivo de datos ya entregado en qa/fase-6-qa/datos-prueba/ | 1) Usar el archivo entregado: mt101-10k.csv (10.000 filas, volumen) o mt101-6.csv (humo, 6 filas)  2) Como los puertos SFTP/FTP/MinIO NO estan expuestos al host, copiar con: docker cp mt101-10k.csv ih-int-sftp-source:/home/ihsource/upload/  3) (Alternativas: FTP -> ih-int-ftp-source:/ftp/ihftp ; S3 -> mc cp al bucket ih-source-inbox) | El archivo queda en /upload, la carpeta exacta que lee la Fuente SFTP (E2E-03). Ver LEEME-datos.md para XLSX/TXT y la config de reader por formato | Alta | Funcional |
| E2E-06 | Manual-QA | C1. Ejecutar el proceso (Run) | Archivo dejado (E2E-05); login (P) | 1) Menu Procesos  2) Abrir el proceso MT101 outbound  3) Click Ejecutar | Aviso 'Proceso ejecutado con exito'; en el menu Ejecuciones aparece una corrida nueva (la mas reciente arriba) | Alta | Funcional |
| E2E-07 | Manual-QA | C2. FILE_READ -> staging (vista Ejecuciones) | Una corrida creada (E2E-06) | 1) Menu Ejecuciones  2) Abrir la corrida (la mas reciente)  3) Pestana 'Tareas' (Tareas ejecutadas)  4) Seleccionar la tarea FILE_READ  5) Leer las columnas Procesados / Escritos | FILE_READ muestra Procesados=6 y Escritos=6 (las 6 filas del CSV entraron a staging). Verificado por la vista, sin API | Alta | Funcional |
| E2E-08 | Manual-QA | C3. BUILD/SPLIT -> fragmentos (vista Fragmentos MT101) | Corrida abierta | 1) En la corrida > pestana 'Tareas': ver MT101_BUILD y MT101_SPLIT (Procesados/Escritos)  2) Menu Auditoria > Fragmentos MT101  3) Buscar por la fila origen o la ejecucion | BUILD arma 1 mensaje con 6 transacciones; SPLIT genera 3 fragmentos (2 tx por fragmento). La vista Fragmentos MT101 lista los 3 | Alta | Funcional |
| E2E-09 | Manual-QA | C4. VALIDATE -> 0 invalidos | Corrida abierta | 1) Pestana 'Tareas' > seleccionar MT101_VALIDATE  2) Ver el resumen de la tarea | MT101_VALIDATE sin invalidos (0 issues). Si hubiera una fila mala, apareceria en Auditoria > Cuarentena MT101 (ver E2E-15) | Alta | Funcional |
| E2E-10 | Manual-QA | C5. ARCHIVE -> archivado | Corrida abierta | 1) Pestana 'Tareas' > seleccionar MT101_ARCHIVE  2) Ver Procesados/Escritos | MT101_ARCHIVE archiva los 3 mensajes (Escritos=3) | Alta | Funcional |
| E2E-11 | Manual-QA | C6. PAY -> SENT (vista Fragmentos MT101) | Corrida abierta; canal (sftp-bank/REST) OK | 1) Pestana 'Tareas' > MT101_PAY: ver el resumen (enviados/aceptados)  2) Menu Auditoria > Fragmentos MT101  3) Ver el estado de los 3 fragmentos | MT101_PAY: enviados=3 aceptados=3 rechazados=0; en Fragmentos MT101 los 3 quedan en estado SENT (entregado al banco) | Alta | Funcional |
| E2E-12 | Manual-QA | C7. STATUS -> confirmado | PAY hecho | 1) Pestana 'Tareas' > seleccionar MT101_STATUS  2) Ver el resumen | MT101_STATUS: consultados=3 confirmados=3 errores=0 (releyo la respuesta del banco) | Alta | Funcional |
| E2E-13 | Manual-QA | C8. RECONCILE -> cuadre | STATUS hecho | 1) Pestana 'Tareas' > seleccionar MT101_RECONCILE  2) Ver el resumen | MT101_RECONCILE: enviado == confirmado; sin excepciones (toda diferencia quedaria visible como excepcion) | Alta | Funcional |
| E2E-14 | Manual-QA | C9. Trazabilidad E2E (vista Linaje) | Corrida terminada; login (P) | 1) En el detalle de la corrida: boton 'Ver trazabilidad del registro'  2) (o) Menu Auditoria > Linaje y buscar por la referencia :20: (sendersReference, ej. S<idEjecucion>) | Se ve la linea de tiempo completa: archivo -> staging -> fragmento -> PAY -> confirmacion. Todo por la UI | Alta | Funcional |
| E2E-15 | Manual-QA | D1. Reproceso: fila invalida -> Cuarentena -> corregir -> reconstruir | maker: dev prepara un CSV con 1 fila mala; login como payments-operator (P) | 1) Menu Auditoria > Cuarentena MT101  2) Abrir la fila invalida  3) Corregir el dato y Guardar  4) Usar Reconstruir / PAY correctivo de la MISMA vista | Solo la fila mala esta en Cuarentena MT101; las validas siguieron. Corregida se reconstruye y continua. Todo por la vista Cuarentena (sin API) | Alta | Negativo |
| E2E-16 | Manual-QA | D2. Reproceso: reingreso del MISMO archivo (idempotencia) | Un archivo ya procesado (E2E-06); dev vuelve a dejar el mismo mt101.csv | 1) (dev) docker cp del MISMO mt101.csv a /upload  2) Menu Procesos > Ejecutar otra vez  3) Menu Ejecuciones > abrir la corrida nueva > pestana 'Tareas' > MT101_PAY  4) Menu Auditoria > Fragmentos MT101 | La corrida nueva no genera pagos: MT101_PAY enviados=0 (dedupe por hash); en Fragmentos MT101 no aparecen SENT nuevos. Verificado por la UI | Alta | Seguridad |
| E2E-17 | Manual-QA | D3. Reproceso: rechazo del banco -> Conflicto -> run correctivo | Un pago SENT; dev fuerza el rechazo (test) | 1) Menu Auditoria > Conflictos de pago: aparece el PAY_CONFLICT  2) Abrir el conflicto y Solicitar la correccion (genera run hijo)  3) Menu Ejecuciones > abrir la corrida padre > seccion 'Ejecuciones hijas' > abrir el run hijo | En Conflictos de pago se ve el conflicto; el run hijo (en Ejecuciones hijas) reprocesa SOLO los rechazados y queda PARTIALLY_SENT; los aceptados no se tocan. Todo por la UI | Alta | Seguridad |
| E2E-18 | Manual-QA | D4. Reproceso: pago no enviado -> re-solicitar | Un pago quedo invalidado (dev corta el canal pre-dispatch) | 1) Menu Auditoria > Fragmentos MT101: el fragmento figura invalidado (no llego al banco)  2) Re-solicitar el pago desde la vista (Cuarentena MT101 / Fragmentos)  3) Menu Ejecuciones > corrida > pestana 'Tareas' > MT101_PAY | Se envia exactamente 1: en Fragmentos MT101 el pago pasa a SENT una sola vez (el banco tiene 1 pago por :20:). Verificado por la UI | Alta | Seguridad |
| E2E-19 | Manual-QA | D5. Reproceso gobernado: maker-checker (four-eyes) | maker-checker ON; pay-maker/pay-checker (P); un conflicto abierto | 1) Como pay-maker: Auditoria > Conflictos de pago > Resolver > Solicitar reconocimiento (motivo+ticket)  2) Como pay-checker (distinto): abrir el conflicto > Aprobar  3) Auditoria > Spool: ver las tramas | El conflicto se resuelve con doble control; en Spool se ven las tramas ACK_REQUESTED/RESOLVED (ver modulo MC). Todo por la UI | Alta | Seguridad |
| E2E-20 | Manual-QA | E. Inbound: SWIFT FIN -> parse -> route (opcional) | Reader SWIFT_MT y proceso inbound provisionados (dev); un FIN dejado en la fuente | 1) Menu Procesos > Ejecutar el proceso inbound  2) Menu Ejecuciones > abrir la corrida > pestana 'Tareas'  3) Ver MT101_PARSE y MT101_ROUTE | En la pestana 'Tareas': MT101_PARSE parsea el FIN y MT101_ROUTE lo enruta (INBOUND_REVIEW/UNMATCHED). Verificado por la UI | Media | Funcional |

## SRC — Fuentes (SFTP / FTP / S3-MinIO)  ·  F4. Profundizacion por etapa

| ID | Ejecutor | Escenario | Precondición | Pasos | Resultado esperado | Prio | Tipo |
|---|---|---|---|---|---|---|---|
| SRC-01 | Tecnico/Dev | Lectura por SFTP | sftp-source arriba; una fuente SFTP configurada | 1) Dejar un archivo en la carpeta upload del sftp-source  2) Ejecutar la fuente/proceso que lee SFTP | El archivo se lee e ingresa al pipeline | Alta | Funcional |
| SRC-02 | Tecnico/Dev | SFTP host key correcta | known_hosts con la host key del servidor | 1) Conectar por SFTP (verificacion de host key activa) | La conexion se establece OK | Alta | Seguridad |
| SRC-03 | Tecnico/Dev | SFTP host key incorrecta | known_hosts sin/con la key erronea | 1) Intentar conectar por SFTP | La conexion se rechaza (host key no coincide) | Alta | Seguridad |
| SRC-04 | Tecnico/Dev | SFTP credencial invalida | - | 1) Configurar user/pass incorrecto y conectar | Falla de forma controlada; no se cuelga | Media | Negativo |
| SRC-05 | Tecnico/Dev | Lectura por FTP | ftp-source arriba | 1) Dejar un archivo en el FTP  2) Ejecutar la fuente FTP | El archivo se lee | Media | Funcional |
| SRC-06 | Tecnico/Dev | Lectura por S3/MinIO | bucket ih-source-inbox | 1) Subir un objeto al bucket  2) Ejecutar la fuente S3 | El objeto se lee | Media | Funcional |
| SRC-07 | Tecnico/Dev | Formato CSV | - | 1) Ingresar un CSV valido | Se parsea a staging con la posicion fisica (numero de linea) | Alta | Funcional |
| SRC-08 | Tecnico/Dev | Formato TXT/FIN | - | 1) Ingresar un archivo TXT/FIN | Se parsea a staging | Media | Funcional |
| SRC-09 | Tecnico/Dev | Formato Excel | - | 1) Ingresar un .xlsx | Se parsea con la posicion (hoja + fila) | Media | Funcional |
| SRC-10 | Tecnico/Dev | Archivo vacio/corrupto | - | 1) Ingresar un archivo vacio o corrupto | Error controlado; no rompe el pipeline | Media | Negativo |
| SRC-11 | Tecnico/Dev | Archivo duplicado (mismo contenido) | Un archivo ya procesado | 1) Reingresar el mismo archivo  2) Correr el proceso | No se reprocesa (dedupe por hash); 0 pagos nuevos | Alta | Funcional |

## MP — MT101 Money-path (lectura -> construccion -> validacion -> archivo)  ·  F4. Profundizacion por etapa

| ID | Ejecutor | Escenario | Precondición | Pasos | Resultado esperado | Prio | Tipo |
|---|---|---|---|---|---|---|---|
| MP-01 | Tecnico/Dev | Camino feliz de punta a punta | Fuente y proceso MT101 configurados; canal de pago listo | 1) Ingresar un archivo valido  2) Ejecutar el proceso MT101 completo (Procesos/Ejecuciones)  3) Login (P) y revisar el resultado en Audit | Todas las filas terminan en SENT (leidas -> construidas -> validadas -> archivadas -> pagadas) | Alta | Funcional |
| MP-02 | Manual-QA | Escritura a staging | Archivo ingresado; una corrida ejecutada; login (P) | 1) Menu Ejecuciones  2) Abrir la corrida  3) Pestana 'Tareas' > seleccionar FILE_READ  4) Ver Procesados / Escritos | FILE_READ muestra Escritos = numero de filas del archivo (las filas quedaron en staging). Verificado por la vista, sin API | Alta | Funcional |
| MP-03 | Tecnico/Dev | Construccion de fragmentos MT101 | Filas en staging | 1) Ejecutar la etapa de construccion | Se crean los fragmentos MT101 | Alta | Funcional |
| MP-04 | Tecnico/Dev | Validacion OK | Fragmento valido | 1) Ejecutar la validacion | El fragmento pasa como valido | Alta | Funcional |
| MP-05 | Tecnico/Dev | Estructura invalida -> cuarentena | Fila con estructura invalida | 1) Ingresar la fila mala y validar  2) Login (P), Audit > Quarantine | La fila aparece en Quarantine con un codigo STRUCT; las filas buenas siguen | Alta | Negativo |
| MP-06 | Tecnico/Dev | Monto no positivo -> cuarentena | Fila con monto <= 0 | 1) Validar la fila  2) Ver Quarantine | La fila queda en Quarantine (AMOUNT_POSITIVE) | Alta | Negativo |
| MP-07 | Tecnico/Dev | Monto no numerico -> cuarentena | Fila con monto no numerico | 1) Validar  2) Ver Quarantine | Queda en Quarantine (hoy con AMOUNT_POSITIVE) | Media | Negativo |
| MP-08 | Manual-QA | La cuarentena aisla la fila mala | Login (P); un lote con 1 fila invalida ya procesado | 1) Audit > Quarantine para ese set | Solo la fila invalida esta en cuarentena; las validas continuaron el flujo | Alta | Funcional |
| MP-09 | Manual-QA | Corregir una fila en cuarentena | Login como payments-operator (P); una fila en Quarantine | 1) Audit > Quarantine  2) Abrir la fila, corregir el dato  3) Guardar | La fila se corrige y vuelve a validarse | Alta | Funcional |
| MP-10 | Tecnico/Dev | Correccion sin If-Match | Una fila en cuarentena | 1) Con API, corregir sin la cabecera If-Match | HTTP 400 (se exige If-Match para evitar pisar cambios) | Media | Negativo |
| MP-11 | Tecnico/Dev | Modificacion concurrente | La misma fila editada por 2 a la vez | 1) Con dev, editar la fila con una version vieja | HTTP 409 (bloqueo optimista) | Alta | Concurrencia |
| MP-12 | Tecnico/Dev | Archivado | Fragmento validado | 1) Ejecutar la etapa de archivo | El fragmento queda archivado | Alta | Funcional |
| MP-13 | Tecnico/Dev | Enrutado al canal | Fragmento archivado | 1) Ejecutar la etapa de ruteo | Se enruta al canal correcto (SFTP/REST) segun la config | Alta | Funcional |
| MP-14 | Tecnico/Dev | Referencia :20: por transaccion | Set con varias transacciones | 1) Construir  2) Revisar cada fragmento | Cada transaccion tiene su propia referencia :20: | Media | Funcional |
| MP-15 | Tecnico/Dev | Division en fragmentos | Un set grande | 1) Ejecutar la division | El set se parte en varios fragmentos coherentes | Media | Funcional |
| MP-16 | Automatizado-IT | Reprocesar una fila exacta en un lote grande | Lote grande con 1 fila fallida | 1) Localizar esa fila y reprocesarla | Se reprocesa exactamente esa fila, sin duplicar ni afectar otras. Cubierto por los ITs H4 | Alta | Funcional |

## PAY — PAY / Anti-doble-pago (money-safety, dos nodos)  ·  F4. Profundizacion por etapa

| ID | Ejecutor | Escenario | Precondición | Pasos | Resultado esperado | Prio | Tipo |
|---|---|---|---|---|---|---|---|
| PAY-01 | Tecnico/Dev | Pago normal exitoso | Fragmento archivado; canal OK | 1) Ejecutar el pago  2) Login (P), revisar el estado | El banco acepta -> estado SENT | Alta | Funcional |
| PAY-02 | Automatizado-IT | Solo se reclama lo archivado | - | 1) Ejecutar pago sobre fragmentos en distintos estados | Solo procesa los ARCHIVED; no toca otros. Cubierto por Mt101PayNormalDurableTest | Alta | Funcional |
| PAY-03 | Automatizado-IT | Aceptado -> SENT | Transporte devuelve 'aceptado' | 1) Ejecutar pago | Queda SENT. Cubierto por los ITs de PAY normal | Alta | Funcional |
| PAY-04 | Tecnico/Dev | Rechazo real del banco -> FAILED | El banco responde NACK | 1) Con dev, hacer que el banco rechace el pago | Queda FAILED (terminal); NO se re-envia solo; el motivo del banco queda auditado | Alta | Funcional |
| PAY-05 | Automatizado-IT | Fallo ANTES de enviar -> re-solicitable | Canal caido antes del envio | 1) Con dev, cortar el canal antes del despacho  2) Ejecutar pago | Queda 'invalidado' (nunca llego al banco) y se puede re-solicitar. Cubierto por los ITs de transporte (D.2) | Alta | Funcional |
| PAY-06 | Automatizado-IT | Timeout ambiguo -> queda para conciliar | Corte durante/despues del envio | 1) Con dev, cortar durante el envio | Queda 'incierto' (pudo llegar); NO reenvia; se concilia despues. Cubierto por los ITs de PAY | Alta | Funcional |
| PAY-07 | Tecnico/Dev | Re-solicitar un pago no enviado | Un pago quedo 'invalidado' | 1) Re-solicitar el pago  2) Verificar en el banco | Se envia exactamente 1; el banco tiene 1 solo pago por :20: | Alta | Funcional |
| PAY-08 | Automatizado-IT | Aceptacion tardia de un 'incierto' | Un pago 'incierto'; luego llega la aceptacion | 1) Que llegue la aceptacion tardia | El pago pasa a SENT sin generar un segundo pago. Cubierto por payLateAcceptanceAfterLeaseExpiry | Alta | Funcional |
| PAY-09 | Tecnico/Dev | Idempotencia de reenvio | Un archivo ya pagado | 1) Reprocesar el mismo archivo | 0 pagos nuevos al banco | Alta | Funcional |
| PAY-10 | Automatizado-IT | Reinicio a mitad de pago | App se cae durante el despacho | 1) Con dev, matar el proceso y reiniciar | No se re-despacha; queda incierto/consistente; sin duplicado. Cubierto por los ITs de claim | Alta | Concurrencia |
| PAY-11 | Automatizado-IT | Contencion: 1 solo gana | 2 nodos / varios hilos por el mismo item | 1) Ejecutar la contencion (test) | Exactamente 1 ejecuta el pago. Cubierto por AsyncInboxClaimIT (8 hilos) | Alta | Concurrencia |
| PAY-12 | Automatizado-IT | Fencing de nodo caido | Nodo A muere; su lease vence | 1) Otro nodo re-clama; A 'despierta' | B recupera; A no puede pisar (token distinto); cero doble-ejecucion. Cubierto por AsyncInboxClaimIT | Alta | Concurrencia |
| PAY-13 | Automatizado-IT | Heartbeat protege el lease | Lease vivo renovado por heartbeat | 1) Otro nodo intenta tomar el item | No lo roba mientras el lease este vivo. Cubierto por AsyncInboxClaimIT | Alta | Concurrencia |
| PAY-14 | Automatizado-IT | Recovery de pago con lease vencido | Pago con lease vencido | 1) Ejecutar el barrido de recuperacion | Queda incierto (si despacho) o invalidado (si no); nunca reenvio ciego. Cubierto por los ITs | Alta | Concurrencia |
| PAY-15 | Tecnico/Dev | Pago por lista (in-memory) | direct-list habilitado | 1) Ejecutar un pago por lista | Se despacha por lista con reclamo por idempotencia | Media | Funcional |
| PAY-16 | Automatizado-IT | Pago por lista + fallo re-solicitable | direct-list ON; transporte re-solicitable | 1) Ejecutar (test) | Queda invalidado; NO archiva un rechazo; re-solicitable. Cubierto por Mt101PayDirectListDurableTest | Alta | Funcional |
| PAY-17 | Automatizado-IT | Pago por lista + bloqueo de reenvio | aceptado/incierto en lista | 1) Ejecutar (test) | Se bloquea el re-reclamo (sin doble pago). Cubierto por Mt101PayDirectListDurableTest | Alta | Funcional |
| PAY-18 | Tecnico/Dev | Gate: sin lista en memoria en prod | direct-list.enabled=false | 1) Intentar un pago por lista sin fragmento persistido | Rechazado (prod exige fragmento persistido) | Alta | Seguridad |
| PAY-19 | Automatizado-IT | Auditar lo saltado en un revert | Refs saltadas en un revert | 1) Ejecutar (test) | Las saltadas quedan en conflicto + trama PAY_CONFLICT. Cubierto por los ITs de PAY | Media | Funcional |
| PAY-20 | Automatizado-IT | 'Incierto' pegajoso | Varios intentos, uno incierto | 1) Ejecutar (test) | El 'incierto' no se sobrescribe por un intento posterior. Cubierto por los ITs de transporte | Alta | Funcional |

## CORR — PAY Correctivo (rechazo, run hijo, parcial)  ·  F4. Profundizacion por etapa

| ID | Ejecutor | Escenario | Precondición | Pasos | Resultado esperado | Prio | Tipo |
|---|---|---|---|---|---|---|---|
| CORR-01 | Tecnico/Dev | Rechazo del banco -> run hijo | Un fragmento correctivo rechazado | 1) Con dev, provocar el rechazo  2) Solicitar la correccion | Se crea un run hijo que reprocesa solo los rechazados | Alta | Funcional |
| CORR-02 | Manual-QA | Corregir un fragmento en conflicto | Login (P); un fragmento en conflicto | 1) Audit > Quarantine, corregir  2) Reconstruir | El fragmento se re-construye correctamente | Media | Funcional |
| CORR-03 | Automatizado-IT | Rechazo parcial -> PARTIALLY_SENT | Lote con algunos aceptados y otros rechazados | 1) Ejecutar el pago correctivo | El run queda PARTIALLY_SENT; los aceptados no se tocan. Cubierto por Mt101CorrectiveLifecycleServiceTest | Alta | Funcional |
| CORR-04 | Automatizado-IT | Re-solicitar los no enviados | Run parcial con no-enviados | 1) Re-solicitar | Re-envia solo los no enviados; sin doble pago. Cubierto por el IT correctivo (D2-R1) | Alta | Funcional |
| CORR-05 | Automatizado-IT | Mixto sin envios | Run con rechazados e invalidados, 0 enviados | 1) Ejecutar (test) | Queda PARTIALLY_SENT (no FAILED), lo que habilita recuperarlo. Cubierto por D2-R2 | Alta | Funcional |
| CORR-06 | Automatizado-IT | El run hijo solo reenvia rechazados | Un run hijo | 1) Ejecutar | Reenvia solo rechazados; nunca los ya enviados. Cubierto por el IT correctivo | Alta | Funcional |
| CORR-07 | Automatizado-IT | Marca de despacho correctivo | - | 1) Ejecutar (test) | Marca el despacho en el ledger correctivo. Cubierto por el IT correctivo | Media | Funcional |
| CORR-08 | Automatizado-IT | Cuarentena por fragmento | Correctivo con seleccion parcial | 1) Ejecutar (test) | Cuarentena sincronizada por fragmento. Cubierto por el IT correctivo | Media | Funcional |
| CORR-09 | Automatizado-IT | Correctivo sin doble pago (con incierto) | Run con enviados/inciertos/no-enviados | 1) Re-solicitar | Solo re-prepara los no enviados; inciertos y enviados no se re-envian. Cubierto por D2-R1 | Alta | Funcional |
| CORR-10 | Automatizado-IT | Reemplazo de una solicitud hija previa | Solicitud hija previa | 1) Nueva solicitud | La previa se reemplaza (no se duplica). Cubierto por el IT correctivo | Media | Funcional |

## STAT — STATUS / RECONCILE / Confirmaciones del banco  ·  F4. Profundizacion por etapa

| ID | Ejecutor | Escenario | Precondición | Pasos | Resultado esperado | Prio | Tipo |
|---|---|---|---|---|---|---|---|
| STAT-01 | Tecnico/Dev | Confirmacion positiva del banco | Un pago enviado | 1) Que el banco responda ACK  2) Correr STATUS | La confirmacion queda registrada | Alta | Funcional |
| STAT-02 | Tecnico/Dev | Rechazo del banco (NACK) | Un pago enviado | 1) Que el banco responda NACK | Se maneja como conflicto/FALLA segun el caso; el motivo queda auditado | Alta | Funcional |
| STAT-03 | Tecnico/Dev | Confirmacion tardia | Pago enviado; ACK llega tarde | 1) Recibir el ACK con retraso | Se concilia contra el :20:+ejecucion sin reenviar | Alta | Funcional |
| STAT-04 | Manual-QA | Datos de la confirmacion | Login (P); un conflicto con confirmaciones | 1) Audit > PAY Conflicts  2) Abrir la evidencia inline del conflicto | Se ve el tipo de confirmacion, la referencia del gateway y el estado confirmado | Media | Funcional |
| STAT-05 | Automatizado-IT | Confirmacion de otra corrida con el mismo :20: | 2 corridas con la misma referencia | 1) Recibir una confirmacion | Se acota por ejecucion; no mezcla corridas. Cubierto por el console IT | Alta | Funcional |
| STAT-06 | Tecnico/Dev | Cuadre (reconcile) | Fin de ventana | 1) Ejecutar la conciliacion | Total enviado == confirmado; diferencias -> incierto/conflicto | Alta | Funcional |
| STAT-07 | Tecnico/Dev | STATUS re-lee la respuesta del banco | Respuesta en el buzon del banco | 1) Ejecutar STATUS | Re-lee la respuesta (FIN) del banco | Media | Funcional |
| STAT-08 | Automatizado-IT | Rechazo sobre un enviado -> conflicto | Un enviado; STATUS trae rechazado | 1) Ejecutar STATUS | Se crea un PAY_CONFLICT (no sobrescribe el estado). Cubierto por los ITs | Alta | Funcional |

## MC — Maker-checker / PAY_CONFLICT (tanda-8/9)  ·  F5. Maker-checker / Consolas

| ID | Ejecutor | Escenario | Precondición | Pasos | Resultado esperado | Prio | Tipo |
|---|---|---|---|---|---|---|---|
| MC-01 | Manual-QA | El conflicto aparece en la consola | Login (P); un PAY_CONFLICT existente | 1) Audit > PAY Conflicts | El conflicto se lista, con su motivo y su evidencia | Alta | Funcional |
| MC-02 | Manual-QA | Reconocer single-actor (modo OFF) | maker-checker OFF; login como payments-operator (P); un conflicto | 1) PAY Conflicts > en el conflicto: Resolver  2) Escribir motivo y ticket  3) Reconocer | El conflicto desaparece del inbox; queda registrada la resolucion | Alta | Funcional |
| MC-03 | Manual-QA | Reconocer sin motivo | maker-checker OFF; login (P) | 1) Resolver un conflicto dejando el motivo vacio  2) Reconocer | No deja: pide el motivo (o da 400) | Media | Negativo |
| MC-04 | Manual-QA | Reconocer sin ticket | maker-checker OFF; login (P) | 1) Resolver dejando el ticket vacio  2) Reconocer | No deja: pide el ticket (o da 400) | Media | Negativo |
| MC-05 | Manual-QA | Single-actor bloqueado con modo ON | maker-checker ON; login (P) | 1) Intentar reconocer un conflicto en un solo paso | No se permite: exige el flujo de dos pasos (400 'maker-checker enabled') | Alta | Negativo |
| MC-06 | Manual-QA | Solicitar reconocimiento (maker) | maker-checker ON; login como pay-maker (P); un conflicto | 1) PAY Conflicts > Resolver  2) Motivo + ticket  3) Solicitar reconocimiento | Queda una solicitud PENDIENTE; el conflicto SIGUE en el inbox (no se apago) | Alta | Funcional |
| MC-07 | Manual-QA | Aprobar (checker distinto) | Una solicitud PENDING; login como pay-checker (P), distinto del maker | 1) PAY Conflicts > abrir ese conflicto  2) Aprobar | El conflicto se resuelve y desaparece del inbox | Alta | Funcional |
| MC-08 | Manual-QA | No puedo aprobar mi propia solicitud | Login como el pay-maker que solicito | 1) Abrir el conflicto con tu solicitud  2) Ver Aprobar | Aprobar esta deshabilitado (tooltip de segregacion); por API daria 400 | Alta | Seguridad |
| MC-09 | Manual-QA | Aprobar sin solicitud previa | maker-checker ON; login como pay-checker (P); conflicto SIN solicitud | 1) Intentar Aprobar directo | No procede (no hay solicitud pendiente que aprobar) -> 400 | Media | Negativo |
| MC-10 | Manual-QA | Solicitar sobre un no-conflicto | Login como pay-maker (P) | 1) Intentar solicitar sobre algo que ya no es conflicto | No procede (fail-loud: 'no open pay conflict') | Media | Negativo |
| MC-11 | Manual-QA | Solo el maker puede solicitar | maker-checker ON; login como pay-checker u operator (P) | 1) Buscar 'Solicitar reconocimiento' | No se ofrece / da 403 (falta el rol pay-conflict-maker) | Alta | Seguridad |
| MC-12 | Manual-QA | Solo el checker puede aprobar | maker-checker ON; login como pay-maker u operator (P) | 1) Buscar 'Aprobar' | No disponible / da 403 (falta el rol pay-conflict-checker) | Alta | Seguridad |
| MC-13 | Manual-QA | La consola muestra la solicitud PENDING | Una solicitud PENDING; login (P) | 1) PAY Conflicts > abrir ese conflicto | Se ve el chip 'Pendiente aprob.' y el detalle: quien solicito (maker), ticket, motivo, fecha | Alta | Funcional |
| MC-14 | Manual-QA | Boton Aprobar deshabilitado si soy el maker | Solicitud tuya; login como ese maker | 1) Ver el boton Aprobar | Aparece deshabilitado con el tooltip de segregacion | Media | Funcional |
| MC-15 | Manual-QA | Segundo pedido reemplaza al anterior | Un PENDING de un maker; login como OTRO maker (P) | 1) Solicitar de nuevo (otro maker, motivo/ticket)  2) Ver el estado | El pedido anterior queda como reemplazado; queda un solo PENDIENTE (el nuevo). Se genera la trama de reemplazo (Audit > Spool) | Alta | Funcional |
| MC-16 | Manual-QA | Historial del reemplazo se conserva | Tras un reemplazo | 1) Audit > Spool: buscar la trama de reemplazo | La solicitud reemplazada queda en el historial; la trama la registra | Media | Funcional |
| MC-17 | Automatizado-IT | Aprobar cuando ya se resolvio (fail-loud) | Solicitud PENDING pero el flag ya se limpio | 1) Ejecutar (test de carrera) | La aprobacion aborta con error (rollback); NO marca aprobado en falso. Cubierto por Mt101PayConflictMakerCheckerIT | Alta | Concurrencia |
| MC-18 | Automatizado-IT | Dos checkers aprueban a la vez | Un PENDING; 2 checkers concurrentes | 1) Ejecutar (test concurrente) | Exactamente 1 aprueba; el otro falla explicito; el flag se limpia 1 sola vez. Cubierto por el IT concurrente | Alta | Concurrencia |
| MC-19 | Manual-QA | Estado 'cargando modo' | Login (P); abrir la consola recien cargada | 1) Abrir el panel de un conflicto muy rapido | Mientras carga la politica, no ofrece acciones (evita el flujo equivocado) | Media | Funcional |
| MC-20 | Tecnico/Dev | Settings en error -> se bloquea (fail-closed) | - | 1) Con dev, simular que /pay-conflicts/settings falla  2) Abrir el panel | Se bloquean las acciones y aparece un aviso + boton Reintentar (no cae a modo OFF) | Alta | Seguridad |
| MC-21 | Manual-QA | Maker-checker sobre un correctivo | maker-checker ON; un conflicto CORRECTIVO; usuarios maker/checker (P) | 1) Solicitar (maker) y aprobar (checker) sobre el conflicto correctivo | Funciona igual que el normal | Media | Funcional |
| MC-22 | Manual-QA | Tramas de auditoria completas | Un flujo request->approve realizado | 1) Audit > Spool: buscar las tramas del conflicto | Se ven ACK_REQUESTED, (reemplazo si aplica) y RESOLVED, con actores/motivo/ticket | Alta | Funcional |
| MC-23 | Manual-QA | El inbox trae los datos de la solicitud | Un PENDING; login (P) | 1) PAY Conflicts > la fila del conflicto | La fila trae el estado de la solicitud, quien la hizo, ticket, motivo y fecha | Alta | Funcional |

## UI — Consolas de UI (PAY conflicts, quarantine, lineage)  ·  F5. Maker-checker / Consolas

| ID | Ejecutor | Escenario | Precondición | Pasos | Resultado esperado | Prio | Tipo |
|---|---|---|---|---|---|---|---|
| UI-01 | Manual-QA | Inbox transversal de conflictos | Login (P); conflictos en varios sets | 1) Audit > PAY Conflicts | Lista los conflictos abiertos de TODOS los sets/ejecuciones, mas recientes primero | Alta | Funcional |
| UI-02 | Manual-QA | Paginacion | Muchos conflictos (>1 pagina); login (P) | 1) PAY Conflicts  2) Cargar mas / paginar | Recorre todos sin repetir ni saltar | Alta | Funcional |
| UI-03 | Manual-QA | Evidencia inline (confirmaciones) | Un conflicto con confirmaciones; login (P) | 1) En el conflicto: boton Evidencia | Muestra la referencia del gateway y el ultimo estado del banco | Media | Funcional |
| UI-04 | Manual-QA | Evidencia sin ejecucion asociada | Un conflicto sin processExecutionId; login (P) | 1) Abrir la evidencia | Avisa que no puede acotar la evidencia (en vez de mostrar de otra corrida) | Media | Negativo |
| UI-05 | Manual-QA | Ir a Quarantine desde el conflicto | Login (P); un conflicto | 1) En el conflicto: link a reconciliar/quarantine | Abre la vista Quarantine de ese set | Media | Funcional |
| UI-06 | Manual-QA | Ir al lineage desde el conflicto | Login (P); un conflicto | 1) En el conflicto: Ver lineage | Abre el lineage de ese :20: | Media | Funcional |
| UI-07 | Manual-QA | Linea de tiempo de una fila | Login (P); una fila conocida | 1) Abrir el row-timeline de la fila | Muestra la linea de tiempo (staging/fragmento/cuarentena) | Media | Funcional |
| UI-08 | Manual-QA | Exportar evidencia | Login (P); la lista con conflictos | 1) PAY Conflicts > Exportar | Descarga un JSON con los conflictos visibles | Baja | Funcional |
| UI-09 | Manual-QA | Chip 'Pendiente' en la fila | Un PENDING; login (P) | 1) PAY Conflicts  2) Ver la fila del conflicto con solicitud | Muestra un chip 'Pendiente aprob.'; el tooltip trae maker/ticket/motivo | Media | Funcional |
| UI-10 | Manual-QA | Idioma es/en | Login (P) | 1) Cambiar el idioma de la app | Los textos cambian correctamente entre espanol e ingles | Baja | Funcional |
| UI-11 | Manual-QA | Conflicto correctivo en la consola | Un conflicto correctivo; login (P) | 1) PAY Conflicts > la fila | Muestra origen CORRECTIVE, el set original y el contexto del rebuild | Media | Funcional |
| UI-12 | Manual-QA | Sin conflictos | Estado limpio; login (P) | 1) Audit > PAY Conflicts | Muestra el estado vacio (no hay conflictos abiertos) | Baja | Funcional |

## PLG — Plugins out-of-process (gRPC + widget)  ·  F6. Plataforma / Auditoria

| ID | Ejecutor | Escenario | Precondición | Pasos | Resultado esperado | Prio | Tipo |
|---|---|---|---|---|---|---|---|
| PLG-01 | Tecnico/Dev | Instalar plugin Java | Stack arriba; imagen del plugin | 1) Instalar demo-transform-java (seccion Plugins) | Queda registrado y alcanzable (gRPC 50061) | Media | Funcional |
| PLG-02 | Tecnico/Dev | Instalar plugin Node | Stack arriba | 1) Instalar demo-transform-node | Registrado (50062) | Media | Funcional |
| PLG-03 | Tecnico/Dev | Instalar plugin Python | Stack arriba | 1) Instalar demo-transform-py | Registrado (50063) | Media | Funcional |
| PLG-04 | Tecnico/Dev | Invocar un transform | Plugin instalado | 1) Ejecutar una tarea que use el plugin | El plugin transforma y responde | Media | Funcional |
| PLG-05 | Manual-QA | Widget del plugin | Stack arriba; login (P) | 1) Abrir /pluginwidget/ o la seccion del widget | El widget del plugin se muestra | Baja | Funcional |
| PLG-06 | Tecnico/Dev | Trust-policy: local aceptado | Plugin en 127.0.0.1 | 1) Invocar el plugin local | Aceptado (localhost, red compartida) | Media | Seguridad |
| PLG-07 | Tecnico/Dev | Trust-policy: no-local rechazado | Plugin en endpoint no local por http plano | 1) Invocar | Rechazado por la politica de confianza | Media | Seguridad |
| PLG-08 | Tecnico/Dev | Staging de plugin en MinIO | - | 1) Subir el artefacto del plugin | Queda en el bucket de staging | Baja | Funcional |

## AUD — Auditoria asincrona (Kafka -> store frio)  ·  F6. Plataforma / Auditoria

| ID | Ejecutor | Escenario | Precondición | Pasos | Resultado esperado | Prio | Tipo |
|---|---|---|---|---|---|---|---|
| AUD-01 | Tecnico/Dev | audit-consumer consume de Kafka | audit-consumer arriba | 1) Generar eventos de auditoria  2) Verificar el store frio | Los eventos se consumen y persisten | Alta | Funcional |
| AUD-02 | Manual-QA | Tramas append-only en el spool | Login (P); acciones ejecutadas | 1) Audit > Spool | Las tramas estan (append-only), no se editan/borran | Alta | Funcional |
| AUD-03 | Manual-QA | Exportar evidencia para auditor | Login (P) | 1) Exportar la evidencia disponible (PAY Conflicts / Spool) | Se obtiene la trazabilidad (actor/motivo/ticket/terminal) | Media | Funcional |
| AUD-04 | Tecnico/Dev | Fallo de auditoria no bloquea negocio | - | 1) Con dev, provocar un fallo en el relay de auditoria durante un proceso | El proceso (money-path) continua; el error se maneja aparte | Alta | No-funcional |
| AUD-05 | Manual-QA | Trazabilidad de una decision | Un reconocimiento maker-checker; login (P) | 1) Audit > Spool: buscar la trama del conflicto | Se ve quien solicito, quien aprobo, motivo y ticket | Alta | Funcional |
| AUD-06 | Tecnico/Dev | Store frio segun config | - | 1) Verificar el destino configurado | Persiste en el store configurado (Postgres/ClickHouse) | Baja | Funcional |

## NF — No funcionales (rendimiento, resiliencia, seguridad)  ·  F7. No funcionales

| ID | Ejecutor | Escenario | Precondición | Pasos | Resultado esperado | Prio | Tipo |
|---|---|---|---|---|---|---|---|
| NF-01 | Automatizado-IT | Escala 1.000.000 de registros | Harness e2e; heap acotado | 1) Correr el proceso con 1M filas (comando de evidencia) | 1M -> SENT; sin OOM; sin deadlock; ~14 min. Cubierto por Mt101MillionFileProcessE2EIT | Alta | No-funcional |
| NF-02 | Automatizado-IT | Harness a 100k | - | 1) Correr a 100k | OK; ~2.5 min; sin OOM/deadlock | Media | No-funcional |
| NF-03 | Automatizado-IT | Fencing de dos nodos | - | 1) Correr AsyncInboxClaimIT | 11/11: contencion real (8 hilos), lease/heartbeat/recovery/fencing | Alta | No-funcional |
| NF-04 | Tecnico/Dev | mTLS con el banco (UAT) | Cert de CA aceptada por el banco | 1) Conectar por SFTP/REST con mTLS | Handshake OK; el banco acepta el cert | Alta | Seguridad |
| NF-05 | Tecnico/Dev | Sin secretos/montos en URL/logs | - | 1) Revisar access-logs y URLs | reason/monto/credencial no viajan en URL ni quedan en logs | Alta | Seguridad |
| NF-06 | Tecnico/Dev | Controles ON en prod | Perfil prod (#10) | 1) Verificar los flags en prod | maker-checker=true, direct-list=false, insert-batch=200000 | Alta | Seguridad |
| NF-07 | Tecnico/Dev | Backoff/reintentos | Fallo transitorio del canal | 1) Inducir un fallo transitorio | Reintenta con backoff; sin duplicar; sin colgarse | Media | No-funcional |
| NF-08 | Tecnico/Dev | Cuadre de fin de dia | Jornada de pagos | 1) Conciliar totales enviado vs confirmado | Coinciden; toda diferencia visible (incierto/conflicto) | Alta | No-funcional |
| NF-09 | Tecnico/Dev | Barrido de recuperacion | Claims estancados | 1) Ejecutar el recovery sweep | Marca los estancados como muertos (DLQ); limpia el token | Media | No-funcional |
| NF-10 | Tecnico/Dev | Readiness con dependencias | Stack arriba | 1) GET /q/health/ready | UP con DB + mensajeria | Media | No-funcional |
| NF-11 | Tecnico/Dev | Alertas operativas | Monitoreo configurado | 1) Provocar un conflicto/incierto/falla | La alerta llega al equipo operativo | Media | No-funcional |
| NF-12 | Tecnico/Dev | Arranque nativo | Imagen nativa | 1) Levantar la app nativa | Arranca ~1.5s; RAM baja (~70 MB); UI embebida | Baja | No-funcional |

## BANK — Controles criticos bancarios / homologacion (vista consolidada)  ·  F8. Aceptacion bancaria (homologacion)

| ID | Ejecutor | Escenario | Precondición | Pasos | Resultado esperado | Prio | Tipo |
|---|---|---|---|---|---|---|---|
| BANK-01 | Tecnico/Dev | CERO DOBLE PAGO verificado EN EL BANCO | Stack arriba; acceso al buzon del banco (sftp-bank) o su reporte | 1) Con apoyo dev, inducir fallo pre-dispatch, timeout post-dispatch, reinicio del app y caida de nodo sobre pagos de prueba  2) Reintentar/conciliar  3) Contar en el banco cuantos mensajes hay por cada referencia :20: | El banco tiene EXACTAMENTE 1 pago por cada :20:; cero duplicados (control maestro). Cubierto en logica por PAY-05..08 y los ITs de fencing | Alta | Seguridad |
| BANK-02 | Manual-QA | Ningun pago queda colgado (orphan) | Login como admin (P); una corrida de pagos terminada | 1) Ir a Audit > Fragments (mt101-fragments) o Executions  2) Filtrar los pagos de la corrida  3) Revisar el estado de cada uno | Todos en un estado FINAL (SENT / FAILED / o UNCERTAIN ya resuelto); ninguno atascado en 'en despacho' | Alta | Funcional |
| BANK-03 | Automatizado-IT | Toda contradiccion -> PAY_CONFLICT (nunca silenciosa) | Un pago SENT y una respuesta del banco REJECTED (o test) | 1) Que STATUS traiga REJECTED sobre un SENT  2) Ir a Audit > PAY Conflicts | Aparece un PAY_CONFLICT nuevo; el estado real NO cambio en silencio. Cubierto por Mt101CorrectiveLifecycleServiceTest / console IT | Alta | Seguridad |
| BANK-04 | Manual-QA | Segregacion de funciones inviolable | maker-checker ON; login como pay-maker (P) | 1) Como pay-maker, en un conflicto: Resolver > Solicitar reconocimiento  2) Intentar Aprobar tu propia solicitud | El boton Aprobar esta deshabilitado para ti (eres el maker); si se fuerza por API da 400/403. Necesitas un pay-checker distinto | Alta | Seguridad |
| BANK-05 | Manual-QA | Auditoria inmutable / no-repudio | Login como admin/auditor (P); acciones ya ejecutadas | 1) Ir a Audit > Spool  2) Buscar las tramas PAY_CONFLICT_ACK_REQUESTED/RESOLVED  3) Ver su contenido | Cada trama muestra quien/que/cuando/motivo/ticket; son de solo lectura (no se editan/borran) | Alta | Seguridad |
| BANK-06 | Manual-QA | Trazabilidad E2E de un pago | Login (P); un :20: conocido | 1) Audit > Record Lineage: buscar por paymentReference = ese :20:  2) Abrir su row-timeline | Se ve el recorrido completo: archivo origen -> staging -> fragmento -> PAY -> confirmacion del banco | Alta | Funcional |
| BANK-07 | Tecnico/Dev | Cuadre fin de dia sin descuadre silencioso | Fin de jornada; totales del banco | 1) Con dev/ops, obtener total enviado (plataforma) y total confirmado (banco)  2) Comparar | enviado == confirmado; toda diferencia queda VISIBLE como UNCERTAIN o PAY_CONFLICT (cero perdida silenciosa) | Alta | Seguridad |
| BANK-08 | Tecnico/Dev | Idempotencia extremo a extremo | Un archivo ya pagado | 1) Reingresar el MISMO archivo (mismo contenido)  2) Correr el proceso | 0 pagos nuevos al banco (dedupe por hash/idempotencia) | Alta | Seguridad |
| BANK-09 | Tecnico/Dev | NACK nunca se re-envia a ciegas | Un pago rechazado por el banco (NACK) | 1) Provocar/recibir el NACK  2) Intentar reprocesar el pago tal cual | Queda FAILED (terminal); solo se re-envia por el flujo correctivo gobernado (run hijo), nunca automatico | Alta | Seguridad |
| BANK-10 | Tecnico/Dev | Validacion de campos MT101 obligatorios | Archivo de prueba con filas invalidas | 1) Con dev, ingresar filas con :20:/:59:/monto/moneda faltantes o invalidos  2) Correr build+validate | Las filas invalidas van a Quarantine; NUNCA sale un mensaje mal formado al banco | Alta | Negativo |
| BANK-11 | Tecnico/Dev | Precision de monto/moneda | Filas con montos decimales | 1) Comparar el monto/moneda del archivo origen vs el del mensaje que llega al banco | Coinciden exactamente; sin redondeos ni perdida de precision | Alta | Funcional |
| BANK-12 | Tecnico/Dev | PDE (Possible Duplicate Emission) | Escenario de reintento de envio | 1) Con dev, forzar un reintento del mismo mensaje | El banco NO reporta un duplicado real (idempotencia + fencing evitan el doble mensaje) | Alta | Seguridad |
| BANK-13 | Tecnico/Dev | Fecha valor / cut-off | Pagos con fecha valor | 1) Enviar un pago con value date valida y otro fuera del horario de corte | Respeta la fecha valor; fuera de cut-off aplica el manejo definido. VERIFICAR / marcar N/A si esta version no maneja cut-off | Media | Funcional |
| BANK-14 | Tecnico/Dev | mTLS + host key reales con el banco (prod) | Entorno prod real con el banco | 1) Configurar cert cliente (CA aceptada) + known_hosts real  2) Conectar SFTP/REST | mTLS efectivo; host key real; NO cert self-signed en prod | Alta | Seguridad |
| BANK-15 | Tecnico/Dev | Secretos fuera de claro | Acceso al repo/servidor | 1) Revisar repo, logs de acceso, URLs y variables de entorno | Credenciales/cert del banco vienen del vault; nunca aparecen en claro (repo/logs/URL) | Alta | Seguridad |
| BANK-16 | Tecnico/Dev | Controles bancarios ACTIVOS en prod | Ambiente prod (perfil prod) | 1) Verificar la config efectiva del ambiente prod | maker-checker.enabled=true; direct-list.enabled=false; insert-batch-max-bytes=200000 | Alta | Seguridad |
| BANK-17 | Automatizado-IT | Cero doble-ejecucion bajo caida de nodo | 2 replicas; capacidad de matar una | 1) Matar un nodo a mitad de un PAY  2) Observar recovery | El efecto de pago se ejecuta 1 sola vez (fencing por token); el nodo caido no pisa. Cubierto por AsyncInboxClaimIT (8 hilos) | Alta | Concurrencia |
| BANK-18 | Tecnico/Dev | Resolucion segura de UNCERTAIN | Un pago en estado UNCERTAIN | 1) Que llegue la confirmacion del banco  2) Correr STATUS/RECONCILE | UNCERTAIN pasa a SENT (si llego) o INVALIDATED (si no), SIN generar un segundo pago | Alta | Seguridad |
| BANK-19 | Manual-QA | Retencion de evidencia | Login (P); confirmaciones y tramas existentes | 1) Audit > PAY Conflicts: abrir la evidencia inline  2) Audit > Spool: ver las tramas | Confirmaciones del banco + tramas de auditoria se conservan y se pueden consultar | Media | Funcional |
| BANK-20 | Manual-QA | Minimo privilegio (RBAC) | Usuarios de distintos roles (P) | 1) Login como auditor: intentar reconocer un conflicto  2) Login como payments-operator con maker-checker ON: intentar solicitar | auditor NO puede mover dinero (solo ver); operator sin rol maker/checker no puede solicitar/aprobar | Alta | Seguridad |
| BANK-21 | Tecnico/Dev | Limites/umbrales de aprobacion | - | 1) Enviar un pago que supere un umbral (si el sistema tiene limites) | Aplica el control de limite/umbral. VERIFICAR el mecanismo / marcar N/A si no existe en esta version | Media | Seguridad |
| BANK-22 | Manual-QA | Cifrado en transito | Login (P); navegador | 1) Verificar que la URL sea https (candado)  2) Con dev, confirmar mTLS en los canales al banco | Todo el trafico publico va por HTTPS; los canales al banco por mTLS; nada de dinero en claro | Alta | Seguridad |

## Checklist de aprobación / homologación

Gates de aceptación para cerrar la homologación (pestaña **Aprobacion** del xlsx). Cada gate se cierra cuando sus casos de referencia están en **Pass**.

| Gate | Criterio de aceptación | Casos de referencia |
|---|---|---|
| G-01 | Cero doble pago (anti-doble-pago) verificado en el banco | BANK-01, PAY-05..12, E2E-16/18, NF-03 |
| G-02 | Ningun pago queda huerfano (todos en estado final) | BANK-02 |
| G-03 | Toda contradiccion -> PAY_CONFLICT (nunca silenciosa) | BANK-03, STAT-08, E2E-17 |
| G-04 | Segregacion de funciones / maker-checker (four-eyes) | BANK-04, MC-06..18, E2E-19 |
| G-05 | Auditoria inmutable / no repudio | BANK-05, AUD-02, MC-22 |
| G-06 | Trazabilidad E2E de un pago (:20:) | BANK-06, E2E-14 |
| G-07 | Cuadre fin de dia (enviado == confirmado) | BANK-07, STAT-06, E2E-13 |
| G-08 | Idempotencia (reingreso no duplica) | BANK-08, E2E-16 |
| G-09 | Validacion MT101 / cuarentena (nada mal formado al banco) | BANK-10, MP-05..08, E2E-15 |
| G-10 | Precision de monto/moneda | BANK-11 |
| G-11 | Controles bancarios ACTIVOS en prod | BANK-16, NF-06 |
| G-12 | RBAC / minimo privilegio | BANK-20, AUTH-09..13 |
| G-13 | Cifrado en transito (HTTPS/mTLS) + secretos fuera de claro | BANK-14/15/22, NF-04/05 |
| G-14 | Rendimiento / escala (1.000.000) | BANK-17, NF-01/02 |
| G-15 | Flujo E2E money-path completo (config->archivo->SENT->reproceso) | E2E-01..20 |
| G-16 | CRUD de catalogo (Fuentes/Conexiones/Readers/Procesos) | CSRC, CCON, CRDR, CPRO |

**Firmas:** Líder QA · Líder Técnico/Dev · Dueño de negocio/Producto · Seguridad/Riesgos · Representante del banco (opcional) — cada uno con Decisión (Aprobado / Aprobado con obs. / Rechazado), fecha y firma.
