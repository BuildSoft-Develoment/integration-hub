# bank-sim — simulador del "cerebro" del banco (DEV/TEST ONLY)

Simula el lado banco del canal SWIFT/FIN por **SFTP** para poder ejercer el money-path
banco-a-banco (PAY/STATUS/CORR) sin el banco real.

## Qué hace, y por qué sigue existiendo

El **servidor** SFTP del banco ya no es un contenedor: es una cuenta gestionada en la nube, porque
un servidor SFTP es justo lo que sí tiene equivalente contratable. Lo que no se contrata es el
**criterio** del banco —decidir si una orden se acepta, se rechaza o queda pendiente— y eso es lo
único que hace bank-sim. Por eso se retiró `ih-int-sftp-bank` y este se quedó.

Vigila el `inbox` de esa cuenta —donde `MT101_PAY` (transport SFTP) deja el FIN con
**upload-with-rename**— y publica el **ACK/NAK** en el `outbox`, que es lo que `MT101_STATUS` lee
para reconciliar. Habla SFTP **por red**: no comparte volumen con nadie.

```
MT101_PAY --SFTP put (.part -> rename)--> <cuenta>:/inbox/<:20:>.fin
                                                 |
                                   bank-sim (watcher, por SFTP)
                                                 v
<cuenta>:/outbox/<:20:>.ack   <--- token pelado: ACK | NAK
                                                 ^
MT101_STATUS --SFTP get (responseFileTemplate)---+
```

## Decisión por `:20:` (nombre del archivo entregado)

| Prefijo de la sender's reference | Contenido del `.ack` | STATUS clasifica |
|---|---|---|
| `NACK*` o contiene `REJ`  | `NAK` | REJECTED (rejectedTokens=['NAK']) |
| `PDE*` / `DLY*`           | (nada N ciclos) luego `ACK` | PENDING → ACCEPTED (pago diferido) |
| resto                    | `ACK` | ACCEPTED (acceptedTokens=['ACK']) |

El contenido es el **token pelado** `ACK`/`NAK` (NO se incluye el `:20:` en el contenido: un ref que
empieza con `NACK` contiene la subcadena `ACK` y clasificaria ambiguo). Se controla el mix desde
`sequenceA.sendersReferenceTemplate` del `MT101_BUILD_FROM_TABLE`.

## Config del money-path (probada — ver scratchpad/mt101-status-sftp.js)

PAY (task MT101_PAY): `transport:'SFTP'`, `sftp:{ host:'eu-central-1.sftpcloud.io', port:22,
username:'<usuario-de-la-cuenta>', password:'${secret:tasks/sftp/bank/password}',
dropPathTemplate:'/inbox/${sendersReference}.fin', tmpExtension:'.part',
strictHostKeyChecking:false }`  — sin `knownHostsPath`.

STATUS (task MT101_STATUS): `mode:'query', resolveNormalPay:true`, `routeQuery:{ SFTP_BANK:{ transport:'SFTP',
sftp:{...mismas creds...}, responseFileTemplate:'/outbox/${sendersReference}.ack',
acceptedTokens:['ACK'], rejectedTokens:['NAK'] } }`.

> El `password` DEBE ser una referencia COMPLETA `${secret:...}` (el `Mt101DispatchPlanCompiler`
> rechaza literales en campos credenciales). El secreto del vault `tasks/sftp/bank/password` ya
> existe: al cambiar de cuenta se **actualiza su valor**, no la definicion del proceso.
>
> **`strictHostKeyChecking` paso de `true` a `false`, y con el desaparece `knownHostsPath`.** Contra
> el contenedor la huella era fija y estaba fijada en `int/sftp/known_hosts`; una cuenta gratuita se
> recrea cada pocas horas y su huella cambia con ella, asi que fijarla obligaria a reeditar el
> proceso constantemente. Es una concesion **acotada a integracion**: contra el banco real la huella
> es estable y el valor correcto vuelve a ser `true` con su `known_hosts`. Sin esa comprobacion, un
> intermediario podria hacerse pasar por el destino, y aqui lo que viaja son ordenes de pago.

## Levantarlo

Ya **no comparte volumen** con ningun contenedor SFTP: `ih-int-sftp-bank` se retiro porque un
servidor SFTP si tiene equivalente gratuito gestionado. bank-sim habla SFTP por red contra esa
misma cuenta, con las credenciales por entorno.

```bash
docker run -d --name ih-int-bank-sim \
  --network integration-hub-int_ihnet \
  -e BANK_SFTP_HOST=eu-central-1.sftpcloud.io \
  -e BANK_SFTP_USER=<usuario-de-la-cuenta> \
  -e SSHPASS=<clave> \
  -v "$PWD/bank-sim.sh:/bank-sim.sh:ro" \
  alpine:latest sh -c "apk add --no-cache openssh-client sshpass >/dev/null && sh /bank-sim.sh"
```

La clave viaja por **entorno al contenedor**, nunca en un fichero del repositorio. `sshpass -e` la
lee de `SSHPASS`, asi que tampoco aparece en la linea de comandos ni en un `ps` desde dentro.

### Lo que cambia al estar en la nube

| | Antes (volumen compartido) | Ahora (SFTP en la nube) |
|---|---|---|
| Leer el inbox | directorio local | `ls -1` remoto por SFTP |
| Publicar el ACK | `printf > fichero` | `put` a `.part` + `rename` |
| Fallo de red | no aplicaba | se reintenta al ciclo siguiente, no muere |
| Huella del host | `known_hosts` fijo | `StrictHostKeyChecking=no` (ver abajo) |

**El ACK se publica con temporal + rename** a proposito, igual que hace PAY al entregar. Sobre un
volumen compartido la escritura era casi instantanea; por red la ventana en la que `MT101_STATUS`
podria leer un `.ack` a medio escribir es real, y un ACK truncado no seria ni `ACK` ni `NAK`: se
leeria como indeterminado, que es el peor de los tres resultados.

**`StrictHostKeyChecking=no` es una concesion acotada a integracion.** La huella de una cuenta
gratuita cambia cuando la cuenta se recrea, asi que fijarla en `known_hosts` no se sostiene. Contra
el banco real la huella es estable y esto NO debe viajar: alli el valor correcto es `yes`.

**La cuenta gratuita caduca.** Usuario y clave cambian cada pocas horas. Si el money-path deja de
entregar de golpe y sin haber tocado nada, eso es lo primero que hay que mirar.

## ⚠️ Alcance / OBS de homologación

Esto **simula** el canal; **NO reemplaza la prueba real banco-a-banco**. Falta, contra el banco real:
- conexión **SFTP/mTLS reales** (host keys reales, certificados),
- **ACK/NACK reales** generados por los sistemas del banco (formato/latencia reales),
- **ventanas de corte / cut-off** reales,
- reintentos/PDE con la semántica operativa real del banco.

**DEV/TEST ONLY** — quitar del stack antes de prod (junto con el resto de config de prueba).
