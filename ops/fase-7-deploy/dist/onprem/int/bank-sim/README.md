# bank-sim — simulador del "cerebro" del banco (DEV/TEST ONLY)

Simula el lado banco del canal SWIFT/FIN por **SFTP** para poder ejercer el money-path
banco-a-banco (PAY/STATUS/CORR) sin el banco real.

## Qué hace

El `ih-int-sftp-bank` es un SFTP **pasivo** (solo guarda archivos: `inbox`/`outbox`). El bank-sim
es un **sidecar** que comparte su volumen (`sftp_bank_data` en `/home/bank`), vigila el `inbox`
—donde `MT101_PAY` (transport SFTP) deja el FIN con **upload-with-rename**— y escribe el
**ACK/NACK** en el `outbox`, que es lo que `MT101_STATUS` (SFTP) lee para reconciliar.

```
MT101_PAY --SFTP put (.part -> rename)--> sftp-bank:/home/bank/inbox/<:20:>.fin
                                                 |
                                          bank-sim (watcher)
                                                 v
sftp-bank:/home/bank/outbox/<:20:>.ack  <--ACK/NACK JSON {"status":...}
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

PAY (task MT101_PAY): `transport:'SFTP'`, `sftp:{ host:'sftp-bank', port:22, username:'bank',
password:'${secret:tasks/sftp/bank/password}', dropPathTemplate:'/inbox/${sendersReference}.fin',
tmpExtension:'.part', strictHostKeyChecking:true, knownHostsPath:'${config:tasks.sftp.bank.known-hosts}' }`.

STATUS (task MT101_STATUS): `mode:'query', resolveNormalPay:true`, `routeQuery:{ SFTP_BANK:{ transport:'SFTP',
sftp:{...mismas creds...}, responseFileTemplate:'/outbox/${sendersReference}.ack',
acceptedTokens:['ACK'], rejectedTokens:['NAK'] } }`.

> El `password` y `knownHostsPath` DEBEN ser referencias COMPLETAS `${secret:...}` / `${config:...}`
> (el `Mt101DispatchPlanCompiler` rechaza literales en campos credenciales). El secreto del vault
> `tasks/sftp/bank/password` y la entrada `sftp-bank` en `int/sftp/known_hosts` ya existen.

## Levantarlo

```bash
docker run -d --name ih-int-bank-sim \
  --network integration-hub-int_ihnet \
  -v integration-hub-int_sftp_bank_data:/home/bank \
  alpine:latest sh /home/bank/bank-sim.sh
# (el script se copia al volumen: docker exec -i ih-int-sftp-bank sh -c 'cat > /home/bank/bank-sim.sh' < bank-sim.sh)
```

## ⚠️ Alcance / OBS de homologación

Esto **simula** el canal; **NO reemplaza la prueba real banco-a-banco**. Falta, contra el banco real:
- conexión **SFTP/mTLS reales** (host keys reales, certificados),
- **ACK/NACK reales** generados por los sistemas del banco (formato/latencia reales),
- **ventanas de corte / cut-off** reales,
- reintentos/PDE con la semántica operativa real del banco.

**DEV/TEST ONLY** — quitar del stack antes de prod (junto con el resto de config de prueba).
