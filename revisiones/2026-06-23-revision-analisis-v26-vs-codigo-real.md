# Revisión del análisis v26 (app_htoh(26)) contra el código real + StatusTransport SFTP

Fecha: 2026-06-23
Alcance: (a) implementar el **StatusTransport SFTP** (consultar el estado de pagos enviados por SFTP
leyendo el archivo ACK/NACK del banco, no por HTTP) — autorizado por el usuario porque la plataforma es
configurable REST/SFTP; (b) revisar los pendientes del v26 contra el código real e implementar lo viable.
Directiva: sin código fallback / sin caminos legacy. Validar lo ya implementado.

## Veredicto general

El v26 valida el trabajo previo (lease atómico, INVALIDATED vs UNCERTAIN, cadena hash, drift, política
SFTP) y plantea cuatro pendientes. Se cerraron los tractables con prueba y se entregó la feature SFTP de
STATUS pedida.

| # | Hallazgo v26 / pedido | Veredicto | Acción |
|---|---|---|---|
| Feat | STATUS para SFTP sigue siendo HTTP (falta leer ACK/NACK) | **IMPLEMENTADO** | `Mt101StatusSftpGateway` + `routeQuery.<RUTA>.transport=SFTP`: STATUS lee el archivo de respuesta del banco vía SFTP y clasifica por tokens (ACCP/ACK→ACCEPTED, RJCT/NACK→REJECTED) o `statusField`. Archivo ausente = pendiente (no error). Tests `correctiveStatusResolvesSftpRouteFromBankAckFile`, `...KeepsFragmentPendingWhenBankHasNotAckedYet` |
| 2 | La cadena hash no se serializa por rebuild (carrera podría bifurcarla) | **REAL → CORREGIDO** | `recordPayAction` toma un **advisory lock transaccional** por `rebuild_run_id` (`pg_advisory_xact_lock`) antes de leer el hash previo e insertar: dos transacciones concurrentes del mismo run no pueden bifurcar la cadena. La inserción standalone (PAY_DISPATCHING) ahora también es transaccional |
| 3 | Excepción inesperada de transporte se clasifica como REJECTED | **REAL → CORREGIDO** | El `dispatch` del provider distingue: `IllegalArgumentException` (config, antes de I/O) → REJECTED seguro; **cualquier otra** RuntimeException inesperada → **UNCERTAIN** (no se puede demostrar que no salió al banco). Tests `capturesUnexpectedTransportExceptionAsUncertain`, `capturesTransportConfigErrorAsRejection`, `unexpectedTransportExceptionIsUncertainNotRejected` |
| 1 | El provider reconstruye el plan (no lo lee del ledger) | **MITIGADO → documentado** | El config está congelado (no se re-lee de BD durante el PAY) y el claim valida `payload_hash` + `approved_routed_as` + (V55) `dispatch_plan_hash`/`dispatch_destination` persistidos. El provider resuelve el plan de la config congelada + `routed_as` persistido (determinista). "Despachar leyendo el plan del ledger" es un refinamiento de demostrabilidad. Documentado |
| 4 | RECONCILE aún usa config vigente (no congelada como STATUS) | **DOCUMENTADO** | Simétrico al snapshot de STATUS; congelar `reconciliation_config` por run es la misma técnica. No afecta el envío. Documentado |

---

## StatusTransport SFTP (feature principal)

**Contexto:** tras enviar un PAY, `MT101_STATUS` resuelve el estado del pago. Para bancos H2H por SFTP no
hay endpoint HTTP: el banco deja un **archivo de respuesta (ACK/NACK / MT199 / pacs.002)** en un directorio
de confirmaciones. Antes, un fragmento ruteado por SFTP no se podía resolver por STATUS (fallaba ruidoso
sin `url`).

**Implementación (sin fallback):**
- `Mt101StatusSftpGateway.fetchResponse(sftp, responseFilePath)`: conecta por SFTP, descarga el archivo de
  respuesta; si **aún no existe** devuelve `found=false` sin error (pendiente, el banco no respondió); solo
  un fallo real de conexión/SFTP es error.
- `routeQuery.<RUTA>` admite `transport: SFTP` con `sftp` (host/credenciales), `responseFileTemplate`
  (p. ej. `/in/ack/${sendersReference}.ack`) y `acceptedTokens`/`rejectedTokens` (o `statusField` para JSON).
- El provider, por ruta: REST → HTTP (gateway existente); SFTP → lee el ACK y clasifica
  ACCEPTED/REJECTED/pendiente. Archivo ausente → el fragmento **queda en su estado** (UNCERTAIN) y se
  reintenta; nunca se asume enviado ni rechazado.

**Pruebas (Testcontainers atmoz/sftp, servidor real):** ACK `ACCP` en el SFTP → fragmento resuelto a
`SENT`; sin archivo ACK → fragmento sigue `UNCERTAIN` (pendiente, `errorCount=0`).

## Endurecimientos del v26 (con prueba)

### #2 — serialización de la cadena hash por rebuild
`recordPayAction` ejecuta `select pg_advisory_xact_lock(5259865, hashtext(rebuild_run_id))` al inicio de la
transacción: serializa todos los inserts de acciones de un mismo run (scheduler, aprobación, resolución,
DISPATCHING). El lock se libera al commit/rollback. Sin esto, dos transacciones podían leer el mismo
`previous_action_hash` y crear dos ramas.

### #3 — excepción inesperada de transporte = INCIERTO
Regla bancaria: "si no se puede demostrar que no salió al banco, es UNCERTAIN". El `dispatch` ahora marca
`IllegalArgumentException` (validación de config, antes de cualquier I/O) como REJECTED seguro, y **toda
otra** RuntimeException como UNCERTAIN (nunca REJECTED reusable → evita doble pago).

## Pruebas que evidencian el cierre (todas en verde)

- `Mt101StatusTaskProviderTest` — **19** (+2 STATUS por SFTP con servidor real).
- `Mt101PayTaskProviderTest` — **12** (excepción inesperada → UNCERTAIN; error de config → REJECTED).
- `Mt101PayFragmentReprocessTest` — **9** (excepción inesperada del transporte → UNCERTAIN).
- `Mt101CorrectiveLifecycleServiceTest` — **30** (cadena con advisory lock sigue verde).
- Dominio swift completo (provider + service + repository + transport): **236** tests, 0 fallos.
- Integración end-to-end (Flyway real V51..V56): `BankProfileHomologationIT` + `Mt101OutboundEndToEndIT`
  = **3** tests, 0 fallos, `BUILD SUCCESS`.

## Documentado (refinamiento, no bloqueante)

1. **Despachar leyendo el plan del ledger (#1).** Hoy el invariante "aprobado = enviado" lo garantizan el
   config congelado + `payload_hash`/`approved_routed_as`/`dispatch_plan_hash` validados. Que el provider
   lea `transport`/`destino`/`correlación` directamente del ledger PREPARED (en vez de re-resolver de la
   config congelada) es un endurecimiento de demostrabilidad, no de seguridad.
2. **Congelar el perfil de RECONCILE (#4).** Mismo patrón que el snapshot de STATUS; congelar
   `reconciliation_config` por run. No afecta el envío.
3. **HMAC/WORM/rol DB para la cadena.** La cadena hash es tamper-evident; firmarla con HMAC (clave en
   Vault), exportar a WORM/Object Lock y un rol de BD exclusivo de inserción son endurecimientos de infra.

## Conclusión

Se entregó el **StatusTransport SFTP** (resolver el estado de pagos H2H por archivo ACK/NACK), y se
cerraron los dos endurecimientos reales del v26 (**serialización de la cadena hash** y **excepción
inesperada de transporte = UNCERTAIN**), ambos con prueba. Quedan documentados como refinamiento el
despacho leyendo el plan del ledger y el congelado de RECONCILE. La clasificación de toda interrupción
entre aprobación y envío (no enviado / enviado / rechazado / inválido / incierto) ya es exacta, también
para SFTP.
