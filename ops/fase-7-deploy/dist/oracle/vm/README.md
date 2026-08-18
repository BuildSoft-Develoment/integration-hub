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

La documentacion de Oracle da el Always Free de Ampere A1 en horas: **1.500 OCPU-hora y 9.000
GB-hora al mes**, que dan para ~2 OCPU y ~12 GB funcionando en continuo. La cifra de 4 OCPU / 24 GB
se cita por todas partes pero no es lo que dice la ficha oficial. **Confirmar el limite real en la
consola del propio tenancy** antes de dimensionar: descubrir que hay la mitad de memoria de la
prevista, con el despliegue a medias, es caro.

Con ~12 GB entra todo, pero el build nativo pica ~9,3 GB y **no cabe a la vez que la stack**. El
paso 3 se hace con la stack parada, y el script se niega a compilar si la encuentra viva.

---

## 1. Crear la instancia

- **Forma:** `VM.Standard.A1.Flex` (Ampere, ARM). Es la que entra en el Always Free.
- **Imagen:** Ubuntu 22.04 o superior, o Oracle Linux. Cualquiera vale; el runbook usa `apt`.
- **Disco de arranque:** generoso. El build nativo escribe mucho y, cuando el disco se agota, **no
  falla al principio**: pasa las ocho fases de compilacion y muere en el ENLACE, con un error de
  `ld` que no menciona el espacio. Ya paso.
- **Clave SSH:** guardarla al crear la instancia. Oracle no la vuelve a mostrar.

---

## 2. Abrir los puertos — SON DOS CAPAS

Este es el paso que mas tiempo hace perder, porque **abrir la primera capa y olvidar la segunda
produce exactamente el mismo sintoma que no abrir ninguna**: la conexion se queda colgada.

### Capa 1 — Security list de Oracle (en la consola web)

Reglas de entrada para `0.0.0.0/0`, TCP, puertos **80** y **443**.

### Capa 2 — El cortafuegos DENTRO de la maquina

Ubuntu y Oracle Linux vienen con iptables filtrando de fabrica en las imagenes de OCI. Por SSH:

```sh
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

Comprobar desde FUERA de la maquina, no desde dentro:

```sh
curl -sS -o /dev/null -w '%{http_code}\n' http://<ip-publica>/
```

Cualquier respuesta HTTP —incluido un 404— significa que las dos capas estan abiertas. Un tiempo de
espera agotado significa que falta una.

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
cd ~/integration-hub/ops/fase-7-deploy/dist/oracle/vm
```

---

## 4. Compilar las imagenes para ARM

**Las imagenes del entorno de integracion no sirven aqui.** Son binarios nativos de GraalVM
compilados para amd64, y un binario nativo no es portable entre arquitecturas: el contenedor
arranca y muere al instante con `exec format error`, un mensaje que no menciona la arquitectura y
parece corrupcion de imagen.

```sh
./build-native-arm64.sh ~/integration-hub
```

Tarda decenas de minutos. Solo necesita Docker: Maven, Node y GraalVM viven dentro del contenedor
de build. Al terminar verifica las dos imagenes **por arquitectura**, no por que el build dijera
que fue bien — una imagen amd64 construida aqui por error pasa todos los pasos y solo falla al
arrancar.

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

Rellenar las doce variables. **Ninguna tiene valor por defecto**, a diferencia del compose de
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

Con el DNS ya apuntando aqui:

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

Entrar en `https://<tu-dominio>/openbao` y seguir el asistente.

**Las claves de desellado y el token raiz se muestran UNA vez.** Guardarlos en un gestor de
contrasenas antes de continuar. No hay forma de recuperarlos: sin las claves, los secretos guardados
son irrecuperables.

Tras cada reinicio de la maquina, OpenBao arranca **sellado** y hay que desellarlo a mano. No es
friccion a eliminar: es la propiedad que hace que un gestor de secretos sirva de algo. Mientras
este sellado, la app no puede leer credenciales y el registro se llena de
`Missing vaultkv value: <ruta>`.

---

## 7. El token de la aplicacion

La app **no** usa el token raiz. El raiz lee, escribe, borra y administra la boveda; viviendo en una
variable de entorno de un contenedor, cualquier volcado de configuracion se vuelve control total.

En la consola de OpenBao, con el token raiz:

1. **Policies → Create ACL policy**, nombre `integration-hub`, y pegar el contenido de
   [`openbao/policy-integration-hub.hcl`](openbao/policy-integration-hub.hcl). Solo `read` sobre
   `secret/data/connections/*` y `secret/data/tasks/*`.
2. **Access → Authentication Methods → token → Create token**, con esa politica.

Ese valor va a `OPENBAO_TOKEN` en `.env`, y despues:

```sh
docker compose -f docker-compose.cloud.yml --env-file .env up -d platform-app
```

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
docker exec -e BAO_TOKEN -e PUBLIC_BASE_URL="https://<tu-dominio>" -e OPENBAO_OIDC_CLIENT_SECRET \
  ih-openbao sh /openbao/setup/setup-oidc.sh
```

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

**Desellar OpenBao.** Es lo unico que no se recupera solo. Mientras siga sellado, la app arranca
pero no puede leer credenciales, y el registro se llena de `Missing vaultkv value`.

### El certificado

Se renueva solo: el contenedor `certbot` reintenta cada 12h y actua cuando faltan menos de 30 dias.
Para eso **el puerto 80 debe seguir abierto**. El correo de `CERTBOT_EMAIL` es el unico aviso que
llega si la renovacion deja de funcionar; conviene que sea uno que alguien lea.

### Actualizar la aplicacion

```sh
cd ~/integration-hub && git pull
cd ops/fase-7-deploy/dist/oracle/vm
docker compose -f docker-compose.cloud.yml --env-file .env down
./build-native-arm64.sh ~/integration-hub
docker compose -f docker-compose.cloud.yml --env-file .env up -d
```

La stack se para **antes** de compilar, y no por prudencia: el build pica ~9,3 GB y el nucleo mata
procesos al azar, no al build. El script se niega si la encuentra viva.

Keycloak conserva usuarios y grupos: corre en modo produccion sobre Postgres, no con la base
efimera del entorno de integracion.

### Copias de seguridad

Lo que duele perder vive en tres volumenes: `pg_data` (datos y cuentas), `openbao_data` (secretos) y
`kafka_data` (auditoria en transito). Y **fuera de la maquina**: las claves de desellado de OpenBao,
sin las cuales el volumen de secretos es un fichero cifrado sin llave.

---

## Que NO trae este despliegue

- **Nada de alta disponibilidad.** Una maquina, una instancia de cada cosa. Un reinicio es una
  interrupcion, y ademas exige desellar a mano.
- **Ni MinIO ni fuentes SFTP/FTP de prueba.** Para almacenamiento de objetos, el de OCI habla el
  protocolo S3 y la app lo usa por esa via.
- **Ni los plugins de demostracion ni el mock del banco.** Son andamiaje para ejercitar el motor en
  local.
- **`strictHostKeyChecking` en false** para la entrega SFTP. Es una concesion acotada a pruebas:
  antes de enviar a un banco de verdad hay que fijar la huella y activar la comprobacion. Sin ella,
  un intermediario puede hacerse pasar por el destino, y lo que viaja son ordenes de pago.
