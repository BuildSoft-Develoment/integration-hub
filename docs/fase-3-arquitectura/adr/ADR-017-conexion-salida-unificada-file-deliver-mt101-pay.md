# ADR-017 Conexion de salida unificada: fuente OUTPUT reutilizada por FILE_DELIVER y MT101_PAY/STATUS (SFTP)

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR-016 Salida generica: escritura de archivos y entrega por transporte](ADR-016-salida-generica-escritura-archivo-y-entrega.md)
- Siguiente: [Indice docs](../../README.md)
<!-- nav-guided:end -->

## Estado

Propuesto (analisis profundo verificado contra codigo, 2026-07-20). Depende de ADR-016 (capa de salida generica + columna `direction` en `source_definition`). Alcance: fase posterior de integracion del transporte SFTP de pagos.

## Contexto

Tras ADR-016 el sistema tiene **dos mecanicas de conexion de SALIDA** que resuelven la **misma conexion fisica** (el SFTP del banco) por caminos distintos:

| | `FILE_DELIVER` (generico) | `MT101_PAY` / `MT101_STATUS` (money-path) |
|---|---|---|
| De donde sale la conexion | `sinkRef` -> `SinkDefinitionService.resolve(id)` -> fuente `source_definition` con `direction` OUTPUT/BOTH | Bloque `sftp:{...}` **inline** en la config de la task (STATUS: en `routeQuery`) |
| Transporte | `OutputSink` (`SftpSink`): **streaming**, semantica simple | `PaymentMessageTransport` (`SftpPaymentTransport`): **byte[]**, semantica **money-safety** |
| Persistencia | ninguna | `Mt101DispatchPlanCompiler` **compila una spec canonica, la congela y la hashea** para el correctivo |

Verificado en codigo: los campos de **conexion** son identicos entre el `SourceProvider` SFTP, el `SftpSink` y el bloque `sftp` de PAY (`host, port, username, password, privateKeyPath, passphrase, timeoutMillis, strictHostKeyChecking, knownHostsPath`). Solo difiere lo **operacional** (`remotePath` para leer vs `dropPathTemplate`+`tmpExtension`+`remoteDuplicatePolicy` para dejar).

**Consecuencia del hueco:** la conexion del banco (host/credenciales/known_hosts) se **duplica** — se define en `/sources` para leer/entregar y se repite inline en `MT101_PAY`/`MT101_STATUS`. Cambiar el host o rotar una credencial exige tocar N configs de task en vez de una definicion. El transporte de pagos **ya esta codificado y probado**; lo que falta es que **tome su conexion de una fuente `Salida` (OUTPUT/BOTH)**, como ya hace `FILE_DELIVER`.

## Decision

**Unificar la definicion de la CONEXION de salida en una fuente `source_definition` (direction OUTPUT/BOTH), referenciada por `sinkRef`, y reutilizarla tanto en `FILE_DELIVER` como en `MT101_PAY`/`MT101_STATUS`.** La **logica de transporte NO se unifica**: cada camino conserva su SPI (`OutputSink` streaming vs `PaymentMessageTransport` money-safety). Solo se comparte la **resolucion de la conexion**.

La conexion del banco se modela como **una unica fuente `direction=BOTH`** (PAY **escribe** en `/inbox`, STATUS **lee** de `/outbox` — mismo host/credenciales, distinta operacion). Es el caso donde `BOTH` es genuinamente util.

### Config resultante de MT101_PAY

De (hoy, inline):
```json
{"transport":"SFTP","sftp":{"host":"sftp-bank","port":22,"username":"bank",
  "password":"${secret:tasks/sftp/bank/password}","knownHostsPath":"${config:tasks.sftp.bank.known-hosts}",
  "strictHostKeyChecking":true,"dropPathTemplate":"/inbox/${sendersReference}.fin","tmpExtension":".part"}}
```
A (propuesto, referencia + operacion):
```json
{"transport":"SFTP","sinkRef":<id-fuente-BOTH-banco>,
  "sftp":{"dropPathTemplate":"/inbox/${sendersReference}.fin","tmpExtension":".part","remoteDuplicatePolicy":"SKIP_IF_SAME_HASH"}}
```

## El invariante money-safety (lo que hace no-trivial la adaptacion)

`Mt101DispatchPlanCompiler` congela en la spec persistida: `transport` + `endpointRef` + `configuration` **canonica**, con una regla dura (verificada en codigo):

> El **host/dropPath quedan LITERALES y hasheados**; las credenciales viajan como **REFERENCIAS `${secret:...}`** (rechaza literales en `password/passphrase/token/secret/privatekey/apikey/credential/bearer/knownhosts` y en URLs `user:pass@host`). *"Plan persistido = destino aprobado: un secreto no puede mover el host."*

En el correctivo, `materialize()` **re-resuelve solo los secretos, no cambia destino ni transporte**.

### Regla de diseno derivada (NO negociable)

**Se snapshotea el host RESUELTO dentro de la spec, NUNCA el `sinkRef` como referencia viva.** La resolucion de `sinkRef` -> config de la fuente ocurre **una sola vez, en la etapa de compilacion (preparacion del pago)**; el compiler congela el `host`/`dropPath` literales + las credenciales como refs + hashea. Asi:

- El **correctivo** usa el **destino congelado**, no una re-resolucion de una fuente que un operador pudo **editar** entre el pago original y el correctivo -> **evita re-pagar a otro banco (doble pago a destino distinto)**.
- Si la fuente se **edita o borra** despues del pago: el correctivo **no se afecta** (host congelado + credenciales via vault, independientes del `source_definition`).
- La regla "credenciales = referencias" se **preserva**: la fuente del banco debe usar `${secret:...}`/`${config:...}` (el compiler lo exige y **QA-006 ya lo bloquea en el form** de `/sources`). Consistente por construccion.

Opcionalmente la spec puede guardar `sinkRef` **ademas** del snapshot, solo como **trazabilidad de auditoria**; el hash y la autoridad son el config congelado.

## Como queda el flujo

**Compilacion (preparacion del pago), una vez:**
1. Resolver `sinkRef` via `SinkDefinitionService.resolve(id)`, validando `allowsOutput()` (OUTPUT/BOTH) — fail-loud si es INPUT o no existe.
2. **Merge**: conexion (de la fuente, con refs) + operacion (de la task).
3. Pasar ese bloque `sftp` resuelto al `Mt101DispatchPlanCompiler`, que **congela + hashea** (identico a hoy).

**Despacho / correctivo:** sin cambios. `SftpPaymentTransport` + `materialize()` reciben exactamente el mismo shape que hoy.

**STATUS:** su `routeQuery.<ruta>` referencia la misma fuente `BOTH`; se resuelve la conexion (host/creds) y se combina con lo operacional de lectura (`responseFileTemplate` del outbox).

## Consecuencias

**Positivas**
- La conexion del banco se define **una vez** en `/sources`; cambiar host o rotar credencial es una edicion, no N configs.
- Gestion de credenciales **consistente** (vault refs + QA-006 + el picker/filtro OUTPUT/BOTH ya implementados).
- El **frontend de MT101_PAY/STATUS** reutiliza el **sink picker** de FILE_DELIVER (filtrado a OUTPUT/BOTH) tal cual.
- **Cero cambio** en el nucleo money-safety (transporte + compile/materialize + hash) — el snapshot congela el destino resuelto.

**Negativas / costos**
- **Money-path homologado**: cualquier cambio en el punto de armado exige tests exhaustivos, en particular que **el correctivo use el destino congelado aunque la fuente cambie/desaparezca** entre pago y correctivo.
- **Migracion**: los configs MT101 existentes usan `sftp` inline. Se soporta el modo dual (`sinkRef` **o** `sftp` inline) durante la transicion, o se migran los configs (con el `direction=BOTH` provisto por ADR-016 V100).
- `knownHostsPath` debe seguir siendo `${config:...}` (esta en la lista de campos-credencial del compiler); una fuente con known_hosts literal seria rechazada al compilar.

## Alcance de implementacion

- **Backend (acotado):** en la etapa de compilacion/preparacion de `MT101_PAY`/`MT101_STATUS`, resolver `sinkRef` via `SinkDefinitionService` + merge, **antes** de compilar. `SftpPaymentTransport`, `Mt101DispatchPlanCompiler.compile/materialize` y el core money-safety **no cambian**.
- **Validacion:** `sinkRef` -> `allowsOutput()`; fail-loud si INPUT/inexistente. Mantener el rechazo de credenciales literales.
- **Frontend:** el form de PAY/STATUS gana un `sinkRef` picker (reusa lo de FILE_DELIVER) + los campos operacionales (dropPathTemplate/tmpExtension/remoteDuplicatePolicy).
- **Tests:** correctivo con fuente editada/borrada tras el pago -> destino congelado; sinkRef INPUT -> rechazo; paridad de hash de la spec entre inline y sinkRef-resuelto.

## Alternativas consideradas

1. **Unificar tambien el transporte (un solo SPI).** Rechazada: la semantica money-safety de PAY (INCIERTO≠rechazado, idempotencia por hash, retry sticky) es esencial y ajena a una entrega generica; forzar un SPI comun degrada la seguridad del dinero.
2. **Guardar `sinkRef` en la spec y re-resolver en el correctivo.** Rechazada: viola el invariante "plan persistido = destino aprobado" — un operador que edita la fuente moveria el destino del correctivo (doble pago a otro banco).
3. **Dejar la duplicacion (status quo).** Rechazada: la conexion del banco se sigue definiendo dos veces; rotar credenciales o mover host es error-prone y desalineado con `/sources`.

## Referencias

- [ADR-016](ADR-016-salida-generica-escritura-archivo-y-entrega.md) (capa de salida generica, `direction`, QA-006).
- [ADR-009](ADR-009-vertical-mensajeria-pagos.md) (vertical de pagos, money-safety).
- Codigo: `SftpPaymentTransport`, `Mt101DispatchPlanCompiler` (compile/materialize + rechazo de literales), `Mt101PayRouteResolver.PayPlan`, `SinkDefinitionService.allowsOutput`, `SftpSink`/`OutputSink`.
