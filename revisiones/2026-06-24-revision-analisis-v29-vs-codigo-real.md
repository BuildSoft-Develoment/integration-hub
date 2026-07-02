# Revisión del análisis v29 (app_htoh(29)) contra el código real

Fecha: 2026-06-24
Alcance: el v29 valida que el P0 principal del v28 (carrera scheduler↔dispatcher) quedó cerrado en diseño y
prueba concurrente real, y plantea **un riesgo residual operativo nuevo y concreto**: la **aceptación tardía
tras vencer el lease**. Directiva: sin código fallback / sin caminos legacy. Validar lo ya implementado.

## Veredicto general

El v29 confirma los cierres previos (carrera, secretos, clasificación de error, SFTP, cadena hash) y aporta
**un hallazgo real**: el caso extremo de aceptación tardía dejaba una **inconsistencia operativa** sin
resolución. Se corrige con regla automática + prueba que reproduce el escenario.

| # | Punto v29 | Veredicto | Acción |
|---|---|---|---|
| Carrera scheduler↔dispatcher | Cerrado en diseño y prueba concurrente real | **VALIDADO** | Claim atómico (fragmento+run+lease) + advisory lock por run; prueba de 2 hilos/Postgres (25 iteraciones) |
| Aceptación TARDÍA tras vencer lease: `fragmento=SENT, run=UNCERTAIN` | **REAL → CORREGIDO** | `updatePayFragmentResults` escribía el fragmento SENT **sin guarda** (un ACCEPTED tardío sobrescribía el UNCERTAIN del scheduler) mientras `markPayCompleted` (guarda `EXECUTING`) dejaba el run atascado en UNCERTAIN. Nuevo `resolveLateAcceptedPayRun`: si el run quedó UNCERTAIN y **todos** los fragmentos quedaron SENT, **resuelve UNCERTAIN→SENT** con acción `PAY_RESOLVED` append-only, **sin reenviar**; si queda algún pendiente, **mantiene UNCERTAIN** (conciliar por STATUS). Serializado por el **mismo advisory lock** que el scheduler |
| Ejecutar PAY directamente desde el ledger persistido | **VALIDADO — hardening, no brecha** | El propio v29 lo califica *"hardening final, no brecha de trazabilidad"*. El claim ya exige plan ACTUAL == aprobado bit-a-bit (transport\|ruta\|destino\|correlación\|payload) y, ante drift, INVALIDA sin enviar |

---

## Detalle de lo corregido (con prueba)

### Aceptación tardía tras vencer el lease — regla de resolución determinista
**Escenario (validado en el código):**
1. El worker reclama el fragmento (PREPARED→DISPATCHING) con lease vigente.
2. `Transport.send()` se bloquea/demora.
3. El lease vence; el scheduler (advisory lock) marca el run **UNCERTAIN** y el fragmento DISPATCHING→UNCERTAIN.
4. El transport responde **ACCEPTED**; `persistPayDetail`→`updatePayFragmentResults` (sin guarda) escribe el
   fragmento **SENT**.
5. El cierre del worker `markPayCompletedWithAction("SENT")` es **no-op** (su guarda exige `pay_status=
   'EXECUTING'`, pero el run ya es UNCERTAIN) → quedaba `fragmento=SENT, run=UNCERTAIN`, **sin resolución**.

**Fix (sin fallback):** tras el bloque de completado, el servicio llama `resolveLateAcceptedPayRun`:
- Toma el **mismo advisory lock** por run que el scheduler (lectura run+fragmentos consistente, sin solape).
- Solo actúa si el run quedó **UNCERTAIN** (no toca runs terminales del flujo normal).
- Regla v29: si `total > 0` y **todos** los fragmentos son SENT → `update ... pay_status='SENT'` (UNCERTAIN→SENT,
  limpia `pay_uncertain_reason`, `pay_lease_until=null`, sella `pay_resolved_*`) + acción `PAY_RESOLVED`
  append-only. **Sin reenvío** (el banco ya recibió).
- Si queda algún fragmento no-SENT → **no resuelve**: el run sigue UNCERTAIN para conciliar por MT101_STATUS.

No hay reenvío ciego: el pago no se repite; solo se reconcilia el estado del run con el de los fragmentos ya
confirmados, con evidencia append-only.

## Pruebas que evidencian el cierre (todas en verde)

- `Mt101CorrectiveLifecycleServiceTest` — **35** (incluye la **prueba del escenario tardío end-to-end**:
  `lateAcceptanceAfterLeaseExpiryResolvesRunToSentWithoutResend` — el provider falso simula que el lease vence
  durante `send()` y corre el scheduler (run+fragmento UNCERTAIN) antes del ACCEPTED; se verifica run=SENT,
  ambos fragmentos SENT, **una sola** invocación de PAY (sin reenvío), y acciones append-only PAY_UNCERTAIN
  (scheduler) + PAY_RESOLVED (UNCERTAIN→SENT); y la **regla conservadora**:
  `lateLeaseExpiryWithStillPendingFragmentKeepsRunUncertainForReconciliation`).
- `Mt101PayFragmentReprocessTest` — **12** (carrera real scheduler↔dispatcher, 25 iteraciones).
- Dominio swift completo: **217** tests, 0 fallos.
- Integración end-to-end (Flyway real **V57**): `BankProfileHomologationIT` + `Mt101OutboundEndToEndIT`
  = **3** tests, 0 fallos, `BUILD SUCCESS`.

## Mejora del análisis (plan persistido como fuente directa)

El v29 reitera "ejecutar PAY directamente desde el ledger" y él mismo lo clasifica como *hardening final, no
brecha de trazabilidad*. Se mantiene la conclusión v27/v28: el claim atómico ya garantiza "plan usado = plan
aprobado" (hash completo) e INVALIDA ante cualquier drift; ejecutar desde un objeto persistido ignorando el
fragmento actual sería **menos seguro** y persistir el raw payload+config almacenaría secretos (prohibido por
el propio análisis). No es una brecha; queda validado.

## Segundo pase (doble check) — "plan persistido como fuente directa" cerrado con evidencia

El v29 reitera como pendiente principal que el PAY *"envíe directamente desde el ledger persistido"*. Tras
verificar el **código real línea a línea**, se concluye que **ya se ejecuta exactamente el plan aprobado** y
que implementar el camino literal sugerido **no es viable** sin (a) persistir secretos y (b) introducir un
segundo camino (fallback/legacy), ambos prohibidos por la directiva.

**Evidencia en el código (`Mt101PayTaskProvider`):**
- El plan se resuelve **una sola vez** por fragmento (`Mt101PayRouteResolver.resolve(...)`,
  [Mt101PayTaskProvider.java:220](platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101PayTaskProvider.java)).
- El claim hashea y valida **ese mismo** objeto contra el ledger aprobado
  (`claimDispatch(..., plan)` línea 228 → `dispatchPlanHash(plan, ...)` línea 298). Si difiere → INVALIDATED,
  no se envía.
- El `send()` despacha **el mismo** objeto (`dispatch(transport, plan.configuration(), message, ...)`,
  línea 231). **No hay re-resolución entre la verificación y el envío → no hay ventana TOCTOU.**

**Por qué el camino literal no es viable (sin fallback / sin secretos):**
- El `dispatch_destination` del ledger se persiste **con credenciales redactadas**
  (`redactUrlCredentials`, [Mt101PayRouteResolver.java:107](platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101PayRouteResolver.java)),
  así que **no puede** ser la fuente del envío (no tiene credenciales). El destino real se reconstruye desde la
  config congelada (secretos re-resueltos desde Vault) y se verifica por hash.
- El **payload** no se persiste (solo su `payload_hash`), por diseño (evita guardar datos sensibles). Se
  reconstruye desde `mt101_build_fragment` (fuente de verdad) y se verifica por hash.
- Añadir un "dispatch directo desde el ledger" sería un **segundo camino** junto al actual (reconstruir+verificar)
  → exactamente el *camino legacy/fallback* que la directiva prohíbe. El diseño actual es **un solo camino**:
  resolver una vez → verificar hash completo == aprobado → enviar ese mismo objeto.

**Prueba positiva añadida** (`Mt101PayFragmentReprocessTest.dispatchedPlanIsBitForBitTheApprovedLedgerPlan`):
el mensaje y la config que **realmente** recibe el transporte re-derivan al **mismo** `payload_hash`,
`dispatch_destination` y `dispatch_plan_hash` que el ledger aprobó. Es la evidencia positiva de "plan usado =
plan aprobado" (las pruebas de drift ya cubrían el caso negativo → INVALIDATED).

## Conclusión

El v29 cierra el último caso extremo operativo: la **aceptación tardía tras vencer el lease** ya no deja el run
atascado en UNCERTAIN con fragmentos SENT. La resolución es **automática, determinista (advisory lock),
append-only y sin reenvío**, con la regla conservadora de mantener UNCERTAIN si algún fragmento sigue pendiente.
El otro pendiente ("plan persistido como fuente directa") queda **validado y cerrado con evidencia**: ya se
ejecuta el plan aprobado bit-a-bit (resolución única + verificación por hash + envío del mismo objeto), y el
camino literal sugerido no es viable sin persistir secretos ni añadir un camino fallback. Con esto, la
propiedad bancaria —un fragmento se envía una sola vez, con el plan aprobado, y toda duda se resuelve por
estado, nunca por reenvío ciego— queda completa.
