# Ambiente de INTEGRACION (int) — todo dockerizado detras de nginx

Paquete autonomo para levantar la plataforma + todas sus dependencias de prueba en un
solo `docker compose`, replicando el server real (no es PROD, pero es el mismo shape):

| Servicio        | URL publica                                   |
|-----------------|-----------------------------------------------|
| App (appih)     | `http://app.buildsoft.com.pe/appih`           |
| Keycloak (iam)  | `http://app.buildsoft.com.pe/iam`             |
| Widget plugin   | `http://app.buildsoft.com.pe/pluginwidget/`   |

Compose: `../docker-compose.int.yml` · soporte en este dir (`nginx/`, `keycloak/`, `smoke/`).
Todo sale por **nginx**. La app y Keycloak van **detras del reverse proxy**; el issuer del
token es la URL publica y es consistente entre browser y app (nginx tiene el alias de red
`app.buildsoft.com.pe`, asi la app resuelve el issuer publico internamente).

## Contenido

- **platform-app** — imagen NATIVA (UPX ~84 MB) con `/appih` horneado. Ancla el netns de plugins.
- **keycloak** — realm `integration-hub` en `/iam`, detras de proxy.
- **postgres** — BD operacional (app + audit-consumer).
- **kafka** — UNICO broker (async dispatch + backbone de auditoria).
- **audit-consumer** — NATIVO; consume de Kafka y persiste en **postgres**. El cold-store es
  `audit.cold-store.type=POSTGRES`, que es el valor por defecto: **ClickHouse esta diferido y no hay
  servicio `clickhouse` en el compose**. La dependencia `clickhouse-jdbc` sigue en el classpath, por
  eso el aviso de reflexion nativa de mas abajo continua vigente.
- **minio** (+init de buckets) — S3 (staging de plugins + fuentes).
- **sftp-source** / **ftp-source** — `SftpSourceProvider` / `FtpSourceProvider`.
- **SFTP del banco** — YA NO es un contenedor: es una cuenta **SFTP en la nube** (sftpcloud). Sigue
  siendo el inbox del "banco" para el money-path **PAY** (FIN MT101 upload-with-rename) + STATUS.
  Host y usuario en `int/.env`; la clave **solo** como `${secret:tasks/sftp/bank/password}`.
- **plugin-java / node / python** — 3 backends gRPC; comparten el netns de la app
  (`network_mode: service:platform-app`) => la app los ve en `127.0.0.1:5006x` (localhost),
  unica forma que la trust-policy acepta sobre HTTP plano.
- **frontend-widget** — widget del plugin, servido por nginx en `/pluginwidget/`.

> **Por que el SFTP del banco dejo de ser un contenedor.** Un servidor SFTP es exactamente el tipo
> de pieza que tiene equivalente gratuito gestionado, asi que operarlo aqui solo anadia algo que
> mantener — y de cara a mover esto a la nube, algo que migrar sin necesidad. Lo que **no** se puede
> contratar es el cerebro del banco: `bank-sim` sigue existiendo, pero ya no comparte volumen con
> nadie; habla SFTP por red contra esa misma cuenta. Ver [bank-sim/README.md](bank-sim/README.md).
>
> Consecuencia a tener presente: la cuenta gratuita **caduca cada pocas horas** y con ella cambian
> usuario y clave. Si el money-path deja de entregar de golpe sin haber tocado nada, mirar eso antes
> que el codigo.

## 1. Build de las imagenes NATIVAS (build-time)

Requisitos (ver `../../NATIVE-STATUS.md`): WSL2 >=12 GB, contenedores pesados parados.
Compresion UPX (`quarkus.native.compression.level=7`) ya en `application.properties`.

### 1a. platform-app con el subpath `/appih`

> ⚠️ El subpath se **hornea en build-time** (base-href del SPA + `quarkus.http.root-path`).
> La imagen por defecto sirve en `/`, NO en `/appih`.

Son **dos** cosas las que hay que hornear, y el perfil Maven `appih` las hace las dos de golpe
(ADR-024). Esta aislado en un perfil opt-in para no romper dev, que sigue en `/`:

1. **Quarkus root-path** = `/appih` — donde se montan la API y los endpoints de plataforma.
2. **Frontend base-href** = `/appih/` — el perfil cambia el comando de build de Quinoa a
   `run build:appih`, que es la configuracion `appih` de Nx.

> **No basta con `-Dquarkus.http.root-path=/appih`**, que es lo que decia este README antes. Eso
> mueve el backend pero deja el SPA compilado para `/`: el bundle pide sus assets a `/main-xxxx.js`,
> detras del subpath esa ruta no existe y la aplicacion arranca en **pagina en blanco**. Es
> exactamente el fallo que ADR-024 documenta. Usa `-Pnative,appih`.

```bash
mvn -B -pl platform-app -am clean package -Dmaven.test.skip=true -Pnative,appih \
  -Dquarkus.native.container-build=true
docker build -f ops/fase-7-deploy/dist/common/Dockerfile.native \
  --build-arg RUNNER=platform-app/target/platform-app-0.0.1-SNAPSHOT-runner \
  -t integration-hub:native-appih .
```

Aqui `-am` **si** es correcto: los dos verticales son dependencias declaradas de `platform-app`, no
modulos hermanos. (En `audit-consumer`, que es hermano, `-am` no lo arrastraria; por eso tiene su
propio bloque abajo.)

El script `run-native-build-appih.cmd` de la raiz ejecuta exactamente este comando. El build tarda
~25 min y su exito se verifica por el **timestamp del runner**, no por el eco del script.

### 1b. audit-consumer NATIVO

> ⚠️ Trae `clickhouse-jdbc`: puede requerir config de reflexion en native-image
> (tipo "muros"). Verificar el smoke de auditoria tras el primer build.

```bash
mvn -pl audit-consumer -am clean package -Dmaven.test.skip=true -Pnative \
  -Dquarkus.native.container-build=true
docker build -f audit-consumer/src/main/docker/Dockerfile.native \
  -t integration-hub-audit-consumer:native audit-consumer
```

## 2. Levantar el ambiente

```bash
cd ops/fase-7-deploy/dist/onprem
cp int/.env.example int/.env          # ajustar claves si hace falta
docker compose -f docker-compose.int.yml --env-file int/.env up -d
```

En el **host** (test local sin DNS), agregar al hosts file: `127.0.0.1  app.buildsoft.com.pe`.
Navegar `http://app.buildsoft.com.pe/appih` -> login por `/iam` -> app.

## 3. Smoke tests

| Area        | Como probar |
|-------------|-------------|
| Login/OIDC  | Entrar a `/appih`, loguear en Keycloak `/iam`, volver autenticado. |
| Plugins     | `/appih/#/plugins` -> instalar los 3 (`http://localhost:5006{1,2,3}`, netns compartido) -> invocar. Widget en `/pluginwidget/`. |
| SFTP source | Dejar archivo en `sftp_source_data` (host `sftp-source`, user `ihsource`) -> fuente SFTP -> leer. |
| FTP source  | Igual con `ftp-source` (user `ihftp`). |
| S3 source   | MinIO (`minio:9000`, bucket `ih-source-inbox`). |
| PAY money-path | Proceso MT101 PAY -> entrega el FIN al SFTP del banco en la nube (`inbox/`), STATUS lo relee. |
| Auditoria   | `audit-consumer` (nativo) consume de Kafka -> **postgres** (`audit_record_event`). El esquema ClickHouse existe en el repo pero su servicio no se levanta aqui. |

### Smoke rapido de INFRA en `/` (sin la imagen /appih)

Valida el wiring de containers con la imagen por defecto `integration-hub:native` (sirve en
`/`, no `/appih`), usando `smoke/` (nginx-root + realm-root, puerto 8080). Util antes de
invertir en el build `/appih`:

> **`smoke/realm-root.json` es un realm REDUCIDO a proposito**: define cinco roles y cuatro
> usuarios, sin `pay-conflict-maker` ni `pay-conflict-checker`. Es coherente con lo que este carril
> valida —que los contenedores levantan y se hablan— y con que corra antes de gastar 25 minutos en
> el build nativo. La consecuencia hay que tenerla presente: **el four-eyes del camino del dinero no
> se puede ejercitar aqui**, porque no hay forma de asignar el rol que el backend exige. Para eso, el
> stack completo con `int/keycloak/integration-hub-realm.json`, que trae los siete roles y los
> usuarios `pay-maker` / `pay-checker`.

```bash
cd ops/fase-7-deploy/dist/onprem
docker compose -f docker-compose.int.yml --env-file int/smoke/.env up -d \
  postgres keycloak kafka minio minio-init sftp-source ftp-source \
  platform-app plugin-java plugin-node plugin-python frontend-widget nginx
# app: http://localhost:8080/  (o app.buildsoft.com.pe:8080 con hosts entry)
```

## Plegar en el nginx REAL del servidor

Copiar los tres `location` de `nginx/default.conf` dentro del server block existente,
apuntando los `proxy_pass` a los upstreams reales. Los `X-Forwarded-*` son los mismos
(Keycloak los consume con `KC_PROXY_HEADERS=xforwarded`; el issuer se fija con `KC_HOSTNAME`
= URL publica + `/iam`).

## Notas

- La imagen `ubi9-quarkus-micro-image` no trae `curl` -> sin healthcheck HTTP en Compose (en K8s
  lo hace el kubelet). Ver `../../common/Dockerfile.native`.
- Realm de integracion: `keycloak/integration-hub-realm.json` (redirects al URL publico
  `/appih`). El de dev (`/keycloak/integration-hub-realm.json`, localhost:8080) queda intacto.
- Fix nativo aplicado esta ronda: `BrandingResponse` registrado en
  `NativeReflectionRegistrations` (sin el, `/api/branding` da 500 en nativo -> rompe el
  white-label del login). Se valida en el build 1a.
