# Agente de despliegue de la VM

Implementa el lado maquina de [ADR-030](../../../../../docs/fase-3-arquitectura/adr/ADR-030-despliegue-automatizado-vm-pull-aprobacion-rollback.md).
Un temporizador de systemd despierta cada cinco minutos un script que lee que version debe correr
—en la rama huerfana `estado/vm-produccion`— y, si no es la que corre, la aplica.

**La VM tira; nadie empuja** (D1). Ningun workflow tiene clave SSH ni puerto abierto contra esta
maquina, que es la que guarda la boveda.

## Lo que decide, y lo que no

| situacion | que hace | salida |
|---|---|---|
| el `tag` del fichero ya es el que corre | nada | `0` |
| salto hacia adelante, maquina ociosa | aplica y retira `FLYWAY_IGNORE_FUTURE` (D6) | `0` |
| hay ejecuciones `RUNNING`/`PENDING` o un pago correctivo vivo | **aplaza** (D12) | `10` |
| retroceso de clase A | aplica | `0` |
| retroceso de clase B | aplica **con** `FLYWAY_IGNORE_FUTURE=true` (D5) | `0` |
| retroceso de clase C | **se niega** | `20` |
| retroceso sin `clase` declarada | **se niega** | `20` |
| aplico pero `/q/health` no vuelve | lo deja como esta y avisa; **no retrocede solo** (D10) | `30` |

`SUSPENDED` y `NEEDS_RECONCILIATION` no cuentan como trabajo en vuelo: esperan a una persona, no a
un reloj, y bloquear por ellos bloquearia los despliegues para siempre.

**El agente nunca decide retroceder.** Un rollback es alguien escribiendo `tag: <version-vieja>` en
el fichero de estado y fusionando el pull request. El agente solo lo aplica.

**El agente no avanza `tag_estable`** (D13). Cuando un despliegue sale bien lo deja escrito en su
constancia, y avanzarlo es el siguiente pull request.

## Instalacion

### 1. La credencial de lectura

El repositorio es privado y el clon pide credenciales a mano. Hace falta una **deploy key de solo
lectura**: una clave SSH por repositorio, sin caducidad, que no abre nada mas.

En la VM, como el usuario que corre el agente:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ih_estado -N "" -C "agente-vm-integration-hub"
cat ~/.ssh/id_ih_estado.pub
```

Esa clave **publica** se pega en `Settings -> Deploy keys -> Add deploy key` del repositorio,
**sin marcar** *Allow write access*. La privada no sale de la maquina.

Despues, que el clon hable por SSH con esa clave:

```bash
cat >> ~/.ssh/config <<'EOF'
Host github.com
  IdentityFile ~/.ssh/id_ih_estado
  IdentitiesOnly yes
EOF
cd ~/integration-hub
git remote set-url origin git@github.com:BuildSoft-Develoment/integration-hub.git
ssh-keyscan github.com >> ~/.ssh/known_hosts
git fetch --prune origin
git show origin/estado/vm-produccion:estado.yaml
```

Si esa ultima linea imprime el fichero, el transporte esta resuelto.

### 2. La configuracion

```bash
sudo cp agente.conf.example /etc/ih-agente.conf
sudo nano /etc/ih-agente.conf     # revisar REPO, DESPLIEGUE y PUBLIC_HOST
```

### 3. El temporizador

```bash
sudo cp ih-agente.service ih-agente.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now ih-agente.timer
```

### 4. Comprobar sin esperar

```bash
sudo systemctl start ih-agente.service
sudo journalctl -u ih-agente.service -n 40 --no-pager
cat /var/lib/ih-agente/ultimo.txt
```

**El `sudo` del journal no es decoracion.** Sin el, y si el usuario no esta en `adm` ni en
`systemd-journal`, `journalctl` imprime un aviso y **cero lineas** -- que se lee como "el agente no
registra nada" cuando en realidad registra y no te deja verlo. Se resuelve con `sudo` y no metiendo
al usuario en `systemd-journal`, que le daria acceso a TODOS los registros del sistema para leer
los de un script.

Con el fichero de estado pidiendo la version que ya corre, debe decir *"ya corre la version pedida"*
y salir. Ese es el primer ensayo, y no cambia nada.

## Operacion

```bash
systemctl list-timers ih-agente.timer     # cuando toca la siguiente vuelta
sudo journalctl -u ih-agente.service -f   # verlo trabajar (el sudo hace falta, ver arriba)
cat /var/lib/ih-agente/ultimo.txt         # la ultima decision, en una pantalla

# Como fue la ultima vuelta, sin necesidad de leer el journal:
systemctl show ih-agente.service -p Result -p ExecMainStatus -p ExecMainStartTimestamp
```

La constancia no es el log: el journal se rota, y ese fichero es lo que se mira a las tres de la
manana para saber **por que** la version no cambio.

## El banco de pruebas

`./prueba-agente.sh` ejercita la matriz entera sustituyendo `git`, `docker` y `curl` por dobles.
No necesita VM, ni docker, ni red. Corre en segundos y no toca nada.

Se le pasaron tres mutaciones deliberadas —olvidar la variable en el retroceso de clase B, ignorar
el trabajo en vuelo, y aceptar un retroceso de clase C— y las tres salieron rojas. Un banco que no
se ha visto fallar no prueba nada.

## Lo que todavia falta

**El aviso por issue de GitHub** que pide D12 no esta. La deploy key es de **solo lectura**, asi que
la maquina no puede abrir issues: haria falta una segunda credencial con permiso de escritura sobre
la maquina que guarda la boveda. Hoy el aplazamiento queda en la constancia y en el journal. Si se
decide que el aviso vale ese precio, lo mas acotado es un token fino con **solo** `issues: write`
sobre este repositorio.
