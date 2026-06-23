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
| P0.3 | Ejecutar PAY directamente desde el plan persistido (no recomponer) | **MITIGADO → documentado** | El claim ya valida el `dispatch_plan_hash` completo (transport\|ruta\|destino\|correlación\|payload) recomputado contra el persistido: "plan aprobado = plan usado" demostrable. Leer `transport`/`destino`/`correlación` DIRECTAMENTE del ledger (en vez de recomputar de la config congelada) es un refinamiento de fuente-de-ejecución. Documentado |
| P1 | Excepción de transporte por tipo (no garantiza pre-dispatch) | **DOCUMENTADO** | Hoy: `IllegalArgumentException` (validación, antes de I/O) → REJECTED; cualquier otra → UNCERTAIN. Una jerarquía tipada (`PreDispatchConfigurationException`/`AmbiguousTransportException`) es más explícita; los transportes propios solo lanzan `IllegalArgumentException` antes de conectar. Documentado |

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
- Dominio swift completo (provider + service + repository + transport): **240** tests, 0 fallos.
- Integración end-to-end (Flyway real V51..V57): `BankProfileHomologationIT` + `Mt101OutboundEndToEndIT`
  = **3** tests, 0 fallos, `BUILD SUCCESS`.

## Documentado (refinamiento, no bloqueante)

1. **PAY desde el plan persistido (P0.3).** El claim ya valida el `dispatch_plan_hash` completo recomputado
   contra el persistido (demostrable). Que el provider lea `transport`/`destino`/`correlación` directamente
   del ledger PREPARED (única fuente de ejecución) es un endurecimiento adicional.
2. **Excepciones de transporte tipadas (P1).** Hoy `IllegalArgumentException`→REJECTED (config, antes de I/O)
   y cualquier otra→UNCERTAIN. Una jerarquía explícita es más robusta ante transportes de terceros.
3. **HMAC/WORM/rol DB** para la cadena hash (infra).

## Conclusión

El v27 detectó correctamente la **carrera scheduler↔dispatcher** y la **regresión de secretos** en los
snapshots; ambas corregidas con prueba, más la clasificación SFTP. La propiedad bancaria estricta —un
fragmento se envía una sola vez, con el plan aprobado, y toda duda posterior se resuelve por estado/
conciliación— queda reforzada: ya no hay carrera que deje un run inválido con un pago enviado, y la
conciliación/consulta diferida puede autenticarse usando el perfil aprobado con secretos re-resueltos.
