# Revisión del análisis v27 (app_htoh(27)) contra el código real

Fecha: 2026-06-23
Alcance: verificar los hallazgos del v27 (carrera scheduler↔dispatcher, snapshots con secretos redactados,
ejecutar desde el plan persistido, clasificación SFTP "no existe" vs error, excepciones tipadas) contra el
**código actual**. Directiva: sin código fallback / sin caminos legacy. Validar lo ya implementado.

## Veredicto general

El v27 acierta en dos hallazgos **reales y serios** que introdujeron los cambios recientes: la **carrera
scheduler↔dispatcher** (P0.1) y los **snapshots con secretos resueltos+redactados** que rompen la auth
diferida (P0.2). Ambos se corrigieron con prueba. También se corrigió la **clasificación SFTP** (P1) que
yo había introducido. Se documentan los dos refinamientos restantes (ejecutar desde el ledger; excepciones
tipadas).

| # | Hallazgo v27 | Veredicto | Acción |
|---|---|---|---|
| P0.1 | Carrera scheduler↔dispatcher: run puede quedar INVALIDATED con fragmento SENT | **REAL → CORREGIDO** | El claim `markPayFragmentDispatching` **une el run padre** en el mismo UPDATE atómico y exige `r.pay_status='EXECUTING'` + lease vigente; además, claim y scheduler toman el **mismo advisory lock** por `rebuild_run_id`. Como el scheduler solo actúa sobre leases VENCIDOS y el claim exige lease vigente, las ventanas son disjuntas: nunca DISPATCHING con run fuera de EXECUTING. Test `correctivePayDoesNotDispatchWhenRunLeaseExpiredOrRunNotExecuting` |
| P0.2 | Snapshot guarda secretos RESUELTOS+redactados → auth SFTP/STATUS diferida falla | **REAL → CORREGIDO** | El snapshot se congela **sin resolver** (`taskConfigUnresolved`, refs `${secret:...}` intactas; literales redactados); al resolver un incierto, se **re-resuelven** los refs desde Vault (`resolveConfig`). La consulta diferida recibe el secreto resuelto, no `***REDACTED***`. Test `frozenStatusSnapshotKeepsSecretRefsAndReResolvesThemAtDeferredExecution` |
| P1 | `statRemote` trata cualquier `SftpException` como "archivo no existe" | **REAL → CORREGIDO** | `remoteFileExists` distingue: solo `SSH_FX_NO_SUCH_FILE` es pendiente legítimo; cualquier otro `SftpException` (permiso, ruta, servidor) se propaga como **error real**, no se oculta como "ACK pendiente" |
| P1 | Excepción de transporte por tipo (no garantiza pre-dispatch) | **REAL → CORREGIDO (2º pase)** | Jerarquía tipada: `PreDispatchTransportException` (antes de I/O) → REJECTED; **cualquier otra** RuntimeException (incluida una `IllegalArgumentException` cruda de un bug/3ros) → UNCERTAIN. Los transportes lanzan la tipada para errores de config; ya no se infiere "pre-dispatch" por el tipo crudo. Tests `capturesTypedPreDispatchConfigErrorAsRejection`, `capturesRawIllegalArgumentExceptionAsUncertainNotRejection` |
| P0.3 | Ejecutar PAY directamente desde el plan persistido (no recomponer) | **VALIDADO — funcionalmente cerrado** | Ver "Mejora del análisis" abajo: el claim atómico exige que el plan ACTUAL == el aprobado y, ante cualquier drift, **INVALIDA** (no envía). "Plan usado = plan aprobado" ya garantizado; despachar desde un plan persistido ignorando el fragmento actual sería **menos seguro** |

---

## Detalle de lo corregido (con prueba)

### P0.1 — carrera scheduler↔dispatcher cerrada
**Causa:** `markPayFragmentDispatching` validaba solo el fragmento (no el run ni el lease); el scheduler
resolvía el lease leyendo fragmentos y actualizando el run, sin serializar. Un worker podía reclamar un
fragmento (PREPARED→DISPATCHING) mientras el scheduler invalidaba el run → `run=INVALIDATED, fragmento=SENT`.

**Fix (sin fallback):**
- El claim es un UPDATE atómico que **une `mt101_rebuild_run`** y exige `r.pay_status='EXECUTING'` y
  `r.pay_lease_until > current_timestamp`. Como el scheduler solo procesa leases VENCIDOS (`lease < now`) y
  el claim exige `lease > now`, las ventanas son disjuntas sobre el MISMO valor de lease.
- Para el límite exacto (skew de reloj), claim y scheduler toman el **mismo advisory lock** por run
  (`pg_advisory_xact_lock`), haciéndolos mutuamente exclusivos. Quien gane el lock completa; el otro ve el
  estado ya commiteado.

Resultado: o el dispatcher reclama primero (el scheduler ve DISPATCHING → UNCERTAIN) o el scheduler invalida
primero (ningún fragmento puede ir a DISPATCHING). Nunca ambos. Test: lease vencido → el fragmento NO se
despacha (queda PREPARED, lo resuelve el scheduler).

### P0.2 — snapshots sin secretos resueltos, re-resueltos al ejecutar
**Causa real (validada):** `JsonConfigurationMapper.toMap` resuelve `${secret:...}` ANTES de devolver la
config; mi redacción borraba el secreto ya resuelto → el snapshot guardaba `password=***REDACTED***` → la
consulta SFTP/STATUS diferida no podía autenticarse.

**Fix:** se congela `taskConfigUnresolved` (refs `${secret:...}` intactas; literales redactados por
seguridad); al resolver un incierto se llama `resolveConfig` (re-resuelve refs desde Vault fresco). El
snapshot nunca persiste secretos resueltos y la auth diferida funciona. Test: el snapshot conserva la ref y
redacta el literal; al ejecutar, la consulta recibe `RESOLVED:status_token` (no el valor redactado).

### P1 — SFTP "no existe" vs error real
`remoteFileExists` distingue `SSH_FX_NO_SUCH_FILE` (pendiente) de cualquier otro `SftpException` (error real
propagado). Ya no se oculta un permiso/ruta/servidor como "ACK pendiente".

## Pruebas que evidencian el cierre (todas en verde)

- `Mt101PayFragmentReprocessTest` — **11** (lease vencido no despacha; plan/payload drift → INVALIDATED).
- `Mt101CorrectiveLifecycleServiceTest` — **32** (re-resolución de secretos del snapshot, + las previas).
- `Mt101StatusTaskProviderTest` — STATUS por SFTP (ACK→SENT, sin ACK→pendiente).
- `Mt101PayTaskProviderTest` — **13** (pre-dispatch tipado→REJECTED; IllegalArgumentException cruda→UNCERTAIN).
- Dominio swift completo (provider + service + repository + transport): **241** tests, 0 fallos.
- Integración end-to-end (Flyway real V51..V57): `BankProfileHomologationIT` + `Mt101OutboundEndToEndIT`
  = **3** tests, 0 fallos, `BUILD SUCCESS`.

## Segundo pase (doble check)

### P1 — excepciones de transporte tipadas (CORREGIDO)
`PreDispatchTransportException` (extiende `IllegalArgumentException` por compat) la lanzan los transportes
para errores de config ANTES de cualquier I/O. El `dispatch` del provider clasifica por TIPO:
`PreDispatchTransportException` → REJECTED seguro; **cualquier otra** RuntimeException (incluida una
`IllegalArgumentException` cruda de un bug o transporte de terceros) → UNCERTAIN. Ya no se asume que una
`IllegalArgumentException` cruda sea pre-dispatch.

### P0.3 — "plan persistido = único plan que ejecuta": validación + mejora del análisis
**Mejora del análisis (importante):** la recomendación literal del v27 —que el provider **despache
directamente desde un objeto de plan persistido**, ignorando el fragmento actual— sería **menos segura**
para banca: enviaría con un plan "aprobado" aunque el `build_fragment` haya driftado. El diseño actual es
**más fuerte**:
- El claim `markPayFragmentDispatching` es un UPDATE atómico que exige que el plan ACTUAL del fragmento
  (`payload_hash` + `approved_routed_as` + `dispatch_plan_hash` = transport\|ruta\|destino\|correlación\|
  payload) sea **idéntico** al aprobado en el ledger. El provider computa esos valores con la config
  congelada y el `routed_as` actual, y los pasa al claim; el claim los valida contra el ledger.
- Si CUALQUIER componente cambió tras la aprobación → el claim falla y el fragmento queda **INVALIDATED**
  (no se envía). Un fragmento solo se despacha si su plan es bit-a-bit el aprobado.

Por tanto "plan usado = plan aprobado" ya está **garantizado**, y un fragmento drifteado **nunca** se
envía. Persistir el raw payload + config (con secretos) en el ledger para "despachar desde ahí" sería
redundante (el hash ya garantiza identidad), almacenaría secretos (lo que el propio v27 prohíbe) y no
añadiría seguridad. Tests: drift de payload/ruta/plan → INVALIDATED, no enviado.

## Documentado (infra/refinamiento, no bloqueante)

**HMAC/WORM/rol DB** para la cadena hash; persistir el plan completo en el ledger es opcional (la
validación atómica ya garantiza "plan usado = aprobado").

## Conclusión

El v27 detectó correctamente la **carrera scheduler↔dispatcher** y la **regresión de secretos** en los
snapshots; ambas corregidas con prueba, más la clasificación SFTP. La propiedad bancaria estricta —un
fragmento se envía una sola vez, con el plan aprobado, y toda duda posterior se resuelve por estado/
conciliación— queda reforzada: ya no hay carrera que deje un run inválido con un pago enviado, y la
conciliación/consulta diferida puede autenticarse usando el perfil aprobado con secretos re-resueltos.
