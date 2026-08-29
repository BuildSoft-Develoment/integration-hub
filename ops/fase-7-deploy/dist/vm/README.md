# Integration Hub en una VM de nube — runbook

Despliegue completo en **una sola maquina**: seis componentes y un proxy, todo por el puerto 443
bajo un unico nombre.

| | |
|---|---|
| App | `https://<tu-dominio>/appih/` |
| Keycloak | `https://<tu-dominio>/iam/` |
| OpenBao | `https://<tu-dominio>/openbao` → `/ui/` |

Componentes: `platform-app`, `audit-consumer`, `keycloak`, `openbao`, `postgres`, **`kafka`** y
`nginx`. Kafka no es opcional: el consumidor de auditoria es Kafka puro y el despacho asincrono de
tareas tambien. Sin el, el consumidor no arranca y el modo asincrono deja de existir.

---

## 0. Antes de empezar: dos decisiones

### El nombre publico

**Tiene que ser un nombre, no una IP.** No es estetica: OpenBao habla con Keycloak por su cuenta
—descubrimiento, canje del codigo, claves— y exige que la URL que usa sea IDENTICA al `issuer` que
Keycloak anuncia. Una IP cambia; y `localhost` dentro de un contenedor es el propio contenedor.

**Su DNS tiene que apuntar a la IP publica de esta VM ANTES del paso 5.** La CA valida haciendo una
peticion HTTP real contra ese nombre. Si apunta a otro sitio, el certificado no se emite.

**Usa un subdominio PROPIO de la nube, distinto del que ya sirve el on-premise.** No compiten: son
dos nombres, cada uno con su registro A apuntando a una maquina, y cada uno con su certificado. Por
ejemplo `ih.buildsoft.com.pe` para esta VM mientras `app.buildsoft.com.pe` sigue en el servidor de
casa.

Reutilizar el nombre del on-premise obligaria a repuntar su DNS, y con el se irian tambien el acceso
a la aplicacion y el issuer de Keycloak de ese entorno: no se puede tener el mismo nombre sirviendo
en dos sitios a la vez.

Todo el paquete deriva del knob `PUBLIC_HOST`: el certificado, el issuer, las redirecciones del
realm y el alias de red de nginx. Cambiarlo es cambiar una linea de `.env`, pero **antes** del
paso 5 — a partir de ahi queda horneado en el certificado y en el realm ya importado.

### El tamano de la maquina

**2 vCPU y 8 GB llegan** — `e2-standard-2` o equivalente. Ese numero sale de que **aqui no se
compila**: las imagenes nativas las construye CI y esta maquina solo las descarga. El build de
GraalVM pica ~9,3 GB, mas de lo que hay; si alguna vez se intenta en la propia VM, el nucleo
empieza a matar contenedores y el sintoma no apunta al build sino a los servicios que mueren.

Bajar a 4 GB no se recomienda: Keycloak, Kafka y Postgres juntos ya rondan los 2,5 GB en reposo, y
el margen que queda desaparece con el primer proceso grande.

**Disco: 50 GB.** Con las imagenes ya construidas no hace falta mas, pero por debajo de 20 GB los
volumenes de Postgres y Kafka se comen el espacio en semanas.

---

## 1. Crear la instancia

En **Compute Engine → Instancias de VM → Crear instancia**. Antes hay que habilitar la
**Compute Engine API**, que la consola ofrece la primera vez que se entra.

- **Region:** `southamerica-west1` (Santiago) es la mas cercana a Peru. La region fija la latencia
  y no se puede cambiar despues sin recrear la maquina.
- **Tipo de maquina:** `e2-standard-2` (2 vCPU, 8 GB). Ver el apartado anterior.
- **Disco de arranque:** Ubuntu **24.04 LTS**, 50 GB, tipo balanceado. El runbook usa `apt`.
- **Cortafuegos:** marcar **las dos** casillas, `Permitir trafico HTTP` y `Permitir trafico HTTPS`.
  Crean las reglas de entrada por 80 y 443. El 80 hace falta de verdad — ver el paso 2.
- **IP publica ESTATICA, no efimera.** Es la que mas tarde duele. Una IP efimera cambia al parar y
  arrancar la instancia, y con ella se rompe el registro A. El sintoma es doble y confuso —la
  aplicacion deja de responder Y el certificado deja de renovarse— y nadie lo relaciona con haber
  apagado la maquina la semana anterior.

  En el formulario: **Redes → Interfaces de red → Direccion IPv4 externa → Crear direccion IP
  estatica**. Si ya se creo la VM con una efimera, se convierte despues en **Red de VPC →
  Direcciones IP** sin recrear nada.

**El acceso es por el boton SSH de la consola**, que gestiona las claves solo. No hay ninguna clave
que guardar en el momento de crear la instancia.

---

## 2. Abrir los puertos

Las dos casillas del paso anterior crean las reglas de entrada por 80 y 443 en la VPC. **La imagen
de Ubuntu de GCE no trae cortafuegos de host activo**, asi que con eso basta — a diferencia de otras
nubes, donde la imagen filtra por dentro y abrir solo la capa de red produce exactamente el mismo
sintoma que no abrir nada: la conexion colgada.

Comprobarlo, en vez de darlo por hecho:

```sh
sudo iptables -L INPUT -n | head -3     # dentro de la maquina: policy ACCEPT, sin reglas
```

Y desde FUERA de la maquina, que es la comprobacion que vale:

```sh
curl -sS -o /dev/null -w '%{http_code}\n' http://<ip-publica>/
```

Cualquier respuesta HTTP —incluido un 404— significa que el camino esta abierto. Un tiempo de espera
agotado significa que algo sigue filtrando: repasar que las dos casillas quedaran marcadas en
**VPC → Cortafuegos**, con destino a esta instancia.

### El 80 se queda abierto para siempre

No es un descuido. La validacion del certificado se repite en cada renovacion, cada 60 dias.
Cerrarlo "porque todo va por HTTPS" caduca el certificado tres meses despues, cuando ya nadie
relaciona las dos cosas.

---

## 3. Docker y el codigo

```sh
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-v2 git
sudo usermod -aG docker $USER
```

Cerrar la sesion SSH y volver a entrar, o el grupo no aplica y todo pide `sudo`.

```sh
git clone <url-del-repositorio> ~/integration-hub
cd ~/integration-hub/ops/fase-7-deploy/dist/vm
```

---

## 4. Traer las imagenes

**Esta maquina no compila.** Las dos imagenes nativas las construye CI y aqui solo se descargan.
Ver el apartado del tamano: el build no cabe en 8 GB.

Las imagenes viven en `ghcr.io` y el repositorio es privado, asi que hace falta autenticarse una
vez. Con un **token personal de GitHub con permiso `read:packages`** —no la contrasena de la cuenta,
y no un token con permisos de escritura, que aqui no se necesitan:

```sh
read -rsp 'token: ' GHCR_TOKEN && echo
echo "$GHCR_TOKEN" | docker login ghcr.io -u <tu-usuario-de-github> --password-stdin
unset GHCR_TOKEN
```

`read -rsp` no muestra lo que se teclea y `--password-stdin` evita que el token quede en el
historial del shell y en la lista de procesos.

La descarga real ocurre en el paso 5, ya con `.env` relleno. Aqui no se puede adelantar: cualquier
comando de compose necesita las variables, y todavia no existen.

**Ojo con la arquitectura.** CI construye para x86-64 y un binario nativo de GraalVM no es portable:
una imagen aarch64 en esta maquina arranca y muere al instante con `exec format error`, un mensaje
que no menciona la arquitectura y parece corrupcion de imagen.

### El directorio de datos

El motor escribe los ficheros generados en `data-filesystem/`, montado desde el paquete. Va
versionado vacio para que exista antes del primer arranque: si Docker tiene que crearlo, lo hace
como **root**, y la aplicacion corre como uid 1001. El fallo no aparece al arrancar sino a mitad de
un proceso, al intentar escribir.

```sh
sudo chown -R 1001 data-filesystem
```

---

## 5. Configuracion y certificado

```sh
cp .env.example .env
nano .env
```

Rellenar las once variables. **Ninguna tiene valor por defecto**, a diferencia del compose de
integracion, donde la contrasena de Postgres y la del administrador de Keycloak caian a `admin` si
faltaban. En una maquina con IP publica un default silencioso es una puerta abierta que nadie
recuerda haber dejado, porque el arranque no se queja. Aqui, si falta una, el compose no levanta y
dice cual.

Efecto secundario que conviene saber: con una sola ausente fallan **todos** los comandos de compose,
incluido `docker compose ps`. Para diagnosticar sin ellas, `docker ps` no pasa por el compose.

Generar los secretos en la propia maquina:

```sh
openssl rand -base64 32   # POSTGRES_PASSWORD, KC_ADMIN_PASSWORD, KC_SEED_ADMIN_PASSWORD
openssl rand -hex 32      # OPENBAO_OIDC_CLIENT_SECRET, INTEGRATION_HUB_API_SECRET
```

`OPENBAO_TOKEN` se deja **vacio de momento**: no existe hasta el paso 7.

Antes de emitir nada, comprobar que las imagenes bajan:

```sh
docker compose -f docker-compose.cloud.yml --env-file .env pull platform-app audit-consumer
```

Es lo que separa "falta el login de ghcr" o "IMAGE_TAG no existe" de un fallo del certificado. Si
se descubre a mitad de `init-tls.sh`, lo que se ve es la emision a medias, y ahi no se parece en
nada a un problema de imagenes.

Con eso en verde y el DNS ya apuntando aqui:

```sh
./init-tls.sh
```

Emite el certificado y deja la stack sirviendo por HTTPS. Es idempotente: repetirlo no gasta cuota
de la CA.

### Comprobar

```sh
curl -s -o /dev/null -w 'app: %{http_code}\n' https://<tu-dominio>/appih/q/health
curl -s -o /dev/null -w 'iam: %{http_code}\n' https://<tu-dominio>/iam/realms/integration-hub
curl -s -o /dev/null -w 'bao: %{http_code}\n' https://<tu-dominio>/v1/sys/health
```

Los dos primeros deben dar **200**. El tercero da **501 o 503** y eso es lo correcto: OpenBao
arranca sin inicializar. Sin `-k`: si el certificado fuera invalido, curl protestaria, y aqui
queremos que proteste.

---

## 6. Inicializar y desellar OpenBao

### Primero: decidir si la boveda se abre sola

**Esta decision se toma AHORA o cuesta mucho mas.** Cambiar el sello de una boveda ya inicializada
no es editar un fichero: es un procedimiento de migracion de sello con las claves actuales en la
mano. Antes de inicializar es copiar un fichero.

> **Si ya inicializaste sin sello, mira primero si la boveda esta VACIA.** Mientras no guarde ningun
> secreto, borrar su volumen y volver a empezar con el sello puesto cuesta diez minutos y no pierde
> nada — mucho menos que una migracion de sello. En cuanto entre la primera credencial real, esa
> puerta se cierra.
>
> ```sh
> docker compose -f docker-compose.cloud.yml --env-file .env stop openbao
> docker compose -f docker-compose.cloud.yml --env-file .env rm -f openbao
> docker volume rm integration-hub-cloud_openbao_data
> ```
>
> Se pierden el token raiz, las politicas, el motor KV y el cableado del SSO: hay que rehacer los
> pasos 7 y 8. Son los mismos comandos, diez minutos.

Por defecto OpenBao arranca **sellado** y una persona teclea las claves. Eso no es friccion
gratuita: es la propiedad que hace que un gestor de secretos sirva de algo. Pero en esta maquina
tiene un coste concreto — Google reinicia la VM por mantenimiento, y hasta que alguien desella, la
app arranca sin poder leer credenciales y el registro se llena de `Missing vaultkv value`.

La alternativa es el **desellado automatico contra Cloud KMS**: OpenBao le pide a KMS que descifre
su clave maestra y se abre solo al arrancar. Lo que cambia es quien manda:

| | Sellado a mano | Con KMS |
|---|---|---|
| Tras un reinicio | alguien teclea las claves | arranca solo |
| Quien puede abrirla | quien tenga las claves | quien pueda actuar como la cuenta de servicio de la VM |
| `init` entrega | claves de desellado | **claves de recuperacion** (se guardan igual de lejos) |

**Lo que NO hay que hacer** es el atajo obvio: dejar las claves en un fichero de la propia VM y
desellar con un script al arrancar. Eso pone la llave al lado del cofre y convierte el cifrado en
decoracion.

#### Activarlo

Crear la clave y darle acceso **solo a ella** a la cuenta de servicio de la VM:

```sh
# La cuenta de servicio de esta VM, preguntada al servidor de metadatos (no hay que buscarla).
SA=$(curl -s -H 'Metadata-Flavor: Google' \
  http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/email)
echo "$SA"

gcloud services enable cloudkms.googleapis.com
gcloud kms keyrings create ih --location southamerica-west1
gcloud kms keys create openbao-unseal --location southamerica-west1 \
  --keyring ih --purpose encryption

gcloud kms keys add-iam-policy-binding openbao-unseal \
  --location southamerica-west1 --keyring ih \
  --member "serviceAccount:$SA" \
  --role roles/cloudkms.cryptoKeyEncrypterDecrypter
```

El rol va **sobre la clave**, no sobre el proyecto: esa cuenta puede cifrar y descifrar con esa
clave y nada mas. No se descarga ningun fichero de credenciales — el SDK de Google usa las de la
instancia, que llegan por el servidor de metadatos.

**El ambito de acceso de la VM: por `gcloud`, no por la consola.** Hace falta que la instancia lleve
el ambito `cloudkms`, y la lista de "permisos de acceso por API" de la consola **no tiene entrada para
Cloud KMS** — comprobado. Por ahi la unica opcion seria *acceso total a todas las APIs*, que en una
maquina que guarda la boveda es justo lo que no se quiere: si la cuenta de servicio por defecto tiene
rol de Editor en el proyecto, ese ambito la convierte en editora de todo.

`gcloud` si acepta ambitos concretos. Con la VM **apagada** —los ambitos no se tocan en caliente—:

```sh
gcloud compute instances stop <instancia> --zone <zona>

gcloud compute instances set-service-account <instancia> --zone <zona> \
  --service-account=<la-misma-cuenta-de-arriba> \
  --scopes=https://www.googleapis.com/auth/cloudkms,https://www.googleapis.com/auth/devstorage.read_only,https://www.googleapis.com/auth/logging.write,https://www.googleapis.com/auth/monitoring.write,https://www.googleapis.com/auth/servicecontrol,https://www.googleapis.com/auth/service.management.readonly,https://www.googleapis.com/auth/trace.append

gcloud compute instances start <instancia> --zone <zona>
```

Eso **anade** `cloudkms` conservando los ambitos por defecto —los de registro y monitorizacion que
necesita el agente de operaciones—. Comprobar despues, desde la propia VM, que llego:

```sh
curl -s -H 'Metadata-Flavor: Google'   http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/scopes
```

Si `cloudkms` no aparece ahi, el sello fallara al arrancar y el error hablara de permisos, no de
ambitos.

Luego copiar la plantilla dentro del directorio de configuracion, rellenarla y reiniciar:

```sh
cp openbao/seal-gcpckms.hcl.example openbao/config/seal-gcpckms.hcl
nano openbao/config/seal-gcpckms.hcl
docker compose -f docker-compose.cloud.yml --env-file .env restart openbao
docker compose -f docker-compose.cloud.yml --env-file .env logs --tail=30 openbao
```

En el arranque el registro tiene que mencionar el sello `gcpckms`. Si en su lugar aparece un error
de permisos de KMS, **parar aqui**: inicializar con el sello a medias deja una boveda que no se abre
por ninguno de los dos caminos.

Coste: una clave de KMS son unos **0,06 USD al mes**. La decision no es economica.

> ⚠️ **Nunca destruyas una version antigua de esa clave.** La rotacion automatica —90 dias por
> defecto— es segura: KMS conserva las versiones anteriores y sigue descifrando con la que toque.
> Destruir una vieja, en cambio, deja la boveda sin forma de abrirse, y el fallo no aparece al
> destruirla sino en el siguiente arranque.

### El asistente

Entrar en `https://<tu-dominio>/openbao` y seguir el asistente.

**Las claves y el token raiz se muestran UNA vez.** Guardarlos en un gestor de contrasenas antes de
continuar. No hay forma de recuperarlos: sin ellas, los secretos guardados son irrecuperables — y
eso vale igual para las claves de recuperacion del camino con KMS.

---

## 7. El motor de secretos y el token de la aplicacion

### 7a. Montar el motor KV

**Recien inicializada, la boveda solo trae `cubbyhole`.** El motor `secret/` no existe hasta que
alguien lo monta, y sin el la politica del punto siguiente concede lectura sobre rutas que no
llevan a ninguna parte.

Lo peor es cuando da la cara: no al montar la stack —nada falla— sino mucho despues, al ejecutar
el primer proceso que resuelve un `${vaultkv:...}`, con un `Missing vaultkv value` que manda a
revisar el token, que estara bien.

```sh
read -rsp 'token raiz: ' BAO_TOKEN && echo && export BAO_TOKEN

docker exec -i -e BAO_TOKEN -e BAO_ADDR=http://127.0.0.1:8200 ih-openbao \
  bao secrets enable -path=secret -version=2 kv
```

`-version=2` no es opcional: la politica apunta a `secret/data/...` y `secret/metadata/...`, que
son las rutas de KV v2. Con la v1 esas rutas no existen y el fallo seria identico.

> **`-e BAO_ADDR` explicito, siempre.** El contenedor trae `BAO_ADDR` en `https`, y `docker exec -e
> VAR` sin valor solo pasa la variable si existe en TU shell. Sin esto, el CLI habla HTTPS contra un
> OpenBao que escucha en HTTP plano —el TLS lo termina nginx— y falla con
> `http: server gave HTTP response to HTTPS client`, que no sugiere en absoluto lo que pasa.

### 7b. La politica y el token

La app **no** usa el token raiz. El raiz lee, escribe, borra y administra la boveda; viviendo en una
variable de entorno de un contenedor, cualquier volcado de configuracion se vuelve control total.

Se hace por linea de comandos y no por la consola web: ahi la creacion de tokens no esta donde uno
la busca, y el fichero de la politica ya esta montado dentro del contenedor.

> **Si cambia `policy-integration-hub.hcl`, hay que volver a escribirla.** Un despliegue de la
> aplicacion no la aplica: la politica vive dentro de OpenBao, no en la imagen. Basta el primer
> comando de abajo —`bao policy write`—; **no** hace falta crear un token nuevo, porque OpenBao
> evalua la politica en cada peticion contra el nombre que el token lleva atado. Lo pide, por
> ejemplo, ADR-031 D4, que anadio `secret/subkeys/*` para que la interfaz pueda ofrecer los nombres
> de campo sin leer los valores.

```sh
docker exec -i -e BAO_TOKEN -e BAO_ADDR=http://127.0.0.1:8200 ih-openbao \
  bao policy write integration-hub /openbao/setup/policy-integration-hub.hcl

T=$(docker exec -i -e BAO_TOKEN -e BAO_ADDR=http://127.0.0.1:8200 ih-openbao \
  bao token create -policy=integration-hub -ttl=768h -field=token)

sed -i "s|^OPENBAO_TOKEN=.*|OPENBAO_TOKEN=$T|" .env
unset T BAO_TOKEN

docker compose -f docker-compose.cloud.yml --env-file .env up -d platform-app
```

Ni el token raiz ni el de la app llegan a mostrarse: el primero se teclea sin eco y viaja como
variable de entorno —no queda en el historial ni en `docker inspect`—, y el segundo se escribe
directo en `.env`.

**Ese token CADUCA a los 768 horas (32 dias).** Cuando expire, la aplicacion dejara de leer
credenciales y el registro se llenara de `Missing vaultkv value` sin que nadie haya tocado nada.
Conviene anotar la fecha al desplegar y repetir las cuatro ultimas lineas antes de que llegue.

### Comprobar que quedo montado

```sh
docker exec -i -e BAO_TOKEN -e BAO_ADDR=http://127.0.0.1:8200 ih-openbao bao secrets list
```

Deben aparecer `cubbyhole/` y `secret/`. En la consola web salen en **Secrets**, y que un usuario
entrado por SSO los vea confirma de paso que su politica funciona: listar motores exige permiso
sobre `sys/internal/ui/mounts`, que solo concede `ih-secrets-admin`.

### Si aparece "Missing vaultkv value"

Ese mensaje es el mismo para **cinco** causas distintas: token ausente, token sin permiso, OpenBao
sellado, secreto inexistente y campo mal escrito. No es un fallo de seguridad —el consumidor rompe
en vez de dejar pasar una credencial vacia— pero durante una puesta en marcha es cuando mas duele.
Comprobar en ese orden: **sello, token, ruta**.

Y `bao kv get` **no** sirve para probar el token de la app: hace un preflight contra
`sys/internal/ui/mounts` que la politica no concede, asi que da 403 aunque el acceso real funcione.

---

## 8. Cablear el SSO de OpenBao

Con esto se entra en la consola de secretos con la cuenta de Keycloak, en vez de pegando un token.
Lo que se puede hacer dentro sale del **rol**, no de una lista de personas mantenida en un segundo
sitio.

```sh
docker exec -i \
  -e BAO_TOKEN \
  -e BAO_ADDR=http://127.0.0.1:8200 \
  -e PUBLIC_BASE_URL="https://<tu-dominio>" \
  -e OPENBAO_OIDC_CLIENT_SECRET \
  ih-openbao sh /openbao/setup/setup-oidc.sh
```

El `-e BAO_ADDR` explicito es imprescindible, por lo mismo que en el paso 7: sin el, el script
hereda el `https` que trae el contenedor y muere con `http: server gave HTTP response to HTTPS
client`, un error que no sugiere en absoluto que el problema sea el esquema de la direccion.

`-e VAR` sin `=valor` toma el valor de tu shell: ni el token raiz ni el secreto quedan en el
historial ni en `docker inspect`. Antes de ejecutarlo, exportarlos en la sesion:

```sh
read -rs BAO_TOKEN && export BAO_TOKEN
export OPENBAO_OIDC_CLIENT_SECRET="$(grep '^OPENBAO_OIDC_CLIENT_SECRET=' .env | cut -d= -f2-)"
```

El script comprueba **antes de escribir nada** que OpenBao alcanza a Keycloak por la URL publica y
que el `issuer` coincide. Ese es el punto que mas falla, y el error nativo no distingue entre "no
llego", "no me fio del certificado" y "el issuer no coincide".

### Quien recibe permiso

El rol OIDC reparte solo `default`, que no alcanza ningun secreto. La politica de operador cuelga
de un grupo externo cuyo alias es el rol **`platform-admin`** de Keycloak. Entrar por SSO no
concede nada por si mismo: **fail-closed**.

Dar o quitar acceso a las credenciales es dar o quitar ese rol en Keycloak — el mismo sitio que ya
decide quien entra a la aplicacion.

### Comprobarlo

```sh
docker exec -e BAO_TOKEN ih-openbao sh /openbao/setup/verify-oidc.sh
```

Dice si el grupo lleva la politica y **quien ha entrado y la ha recibido**. Hace falta porque
"entre y funciono" no prueba lo que parece: entrar funciona siempre, y la diferencia solo aparece al
abrir un secreto, cuando ya no sabes si fallo la politica, el claim, el rol o el mapper.

---

## 9. La primera cuenta

El realm de este paquete siembra **un** usuario, `admin`, con la contrasena de
`KC_SEED_ADMIN_PASSWORD` marcada como **temporal**: Keycloak obliga a cambiarla en el primer inicio
de sesion, asi que ese valor no sobrevive al primer dia.

El realm del entorno de integracion trae seis usuarios con contrasena escrita en claro en el JSON.
Ahi es comodo; aqui seria publicar el acceso. **Los demas usuarios se crean desde la consola de
Keycloak**, que es donde se gestionan personas.

---

## 10. Dia a dia

### Tras cada reinicio de la maquina

**Si NO se activo el desellado automatico del paso 6: desellar OpenBao.** Es lo unico que no se
recupera solo. Mientras siga sellado, la app arranca pero no puede leer credenciales, y el registro
se llena de `Missing vaultkv value`.

Con KMS no hay nada que hacer, pero conviene comprobarlo la primera vez que la maquina se reinicie
de verdad — no darlo por hecho:

```sh
docker compose -f docker-compose.cloud.yml --env-file .env exec openbao \
  bao status -address=http://127.0.0.1:8200
```

`Sealed  false` y `Seal Type  gcpckms`.

**`openbao/config/seal-gcpckms.hcl` no esta versionado**, y es deliberado: nombra recursos concretos
de un proyecto de GCP. Si algun dia se redespliega desde un clon limpio hay que volver a crearlo, o la
boveda arrancara sellada y sin nadie que sepa por que.

### El certificado

Se renueva solo: el contenedor `certbot` reintenta cada 12h y actua cuando faltan menos de 30 dias.
Para eso **el puerto 80 debe seguir abierto**. El correo de `CERTBOT_EMAIL` es el unico aviso que
llega si la renovacion deja de funcionar; conviene que sea uno que alguien lea.

### Actualizar la aplicacion

```sh
cd ~/integration-hub/ops/fase-7-deploy/dist/vm
nano .env                                                        # IMAGE_TAG=<la version nueva>
docker compose -f docker-compose.cloud.yml --env-file .env pull platform-app audit-consumer
docker compose -f docker-compose.cloud.yml --env-file .env up -d platform-app audit-consumer
docker compose -f docker-compose.cloud.yml --env-file .env restart nginx
```

**Esa tercera linea no es opcional.** El `proxy_pass` de nginx apunta a `platform-app` por nombre y
sin directiva `resolver`, asi que resuelve la IP UNA sola vez, al cargar la configuracion. Al
recrear el contenedor la IP cambia y nginx sigue mandando trafico a la anterior: **502 indefinido,
con la aplicacion viva detras**. Sin ese reinicio, el despliegue parece correcto —los contenedores
arrancan— y el sitio queda caido.

**No se para la stack.** `up -d` recrea solo los dos contenedores cuya imagen cambio; Postgres,
Kafka, Keycloak y OpenBao siguen corriendo, asi que **OpenBao no hay que desellarlo otra vez** — que
era el coste real de cada actualizacion en el plan anterior, cuando habia que tumbar todo para
compilar.

El rollback es el mismo comando con el tag anterior. Por eso `IMAGE_TAG` no puede ser `latest`: con
un tag movil no hay a donde volver.

Keycloak conserva usuarios y grupos: corre en modo produccion sobre Postgres, no con la base efimera
del entorno de integracion.

### Copias de seguridad

Lo que duele perder vive en tres volumenes: `pg_data` (datos y cuentas), `openbao_data` (secretos) y
`kafka_data` (auditoria en transito). Y **fuera de la maquina**: las claves de desellado de OpenBao,
sin las cuales el volumen de secretos es un fichero cifrado sin llave.

---

## Que NO trae este despliegue

- **Nada de alta disponibilidad.** Una maquina, una instancia de cada cosa. Un reinicio es una
  interrupcion, y ademas exige desellar a mano.
- **Ni MinIO ni fuentes SFTP/FTP de prueba.** Para almacenamiento de objetos la app tiene destino
  propio de Google Cloud Storage, ademas de S3, Azure y OCI.
- **Ni los plugins de demostracion ni el mock del banco.** Son andamiaje para ejercitar el motor en
  local.
- **`strictHostKeyChecking` en false** para la entrega SFTP. Es una concesion acotada a pruebas:
  antes de enviar a un banco de verdad hay que fijar la huella y activar la comprobacion. Sin ella,
  un intermediario puede hacerse pasar por el destino, y lo que viaja son ordenes de pago.
