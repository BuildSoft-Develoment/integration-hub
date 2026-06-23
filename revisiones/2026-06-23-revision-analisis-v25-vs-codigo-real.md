# Revisión del análisis v25 (app_htoh(25)) contra el código real

Fecha: 2026-06-23
Alcance: verificar los hallazgos del v25 (lease vencido con acción atómica, distinguir PAY no iniciado
de incierto, drift como INVALIDATED y no rechazo, plan completo persistido, hashes en API/UI, STATUS
SFTP, cadena criptográfica) contra el **código actual** (tras los pases del v24).
Directiva: sin código fallback / sin caminos legacy. Validar lo ya implementado. Implementar lo viable
con documentación y pruebas evidenciadas.

## Veredicto general

El v25 valida el trabajo del v24 (atomicidad estado+acción, append-only en BD, motivo/ticket backend,
prohibición OVERWRITE/RENAME_WITH_SUFFIX, validación payload+ruta antes de despachar) y acierta en
varios huecos reales del **scheduler de lease** y de la **clasificación de estados**. Se cerraron los
P0 tractables con prueba; los de mayor alcance (plan completo persistido, StatusTransport SFTP, cadena
HMAC) se documentan.

| # | Hallazgo v25 | Veredicto | Acción |
|---|---|---|---|
| P0.1 | El scheduler vence PAY sin acción append-only y en conexiones separadas | **REAL → CORREGIDO** | `markExpiredPayExecutionsUncertain` procesa cada run en **una transacción** (estado + fragmentos + acción) y registra la acción con actor `system:pay-lease-scheduler`. Test `expiredLeaseAfterDispatchBecomesUncertainWithSchedulerAction` |
| P0.2 | Caída antes del primer despacho deja el PAY como incierto irrecuperable | **REAL → CORREGIDO** | El lease vencido **distingue**: si hubo despacho (DISPATCHING/SENT/UNCERTAIN) → `UNCERTAIN`; si NO → `INVALIDATED` re-solicitable (no hubo llamada al banco). Test `expiredLeaseWithoutDispatchBecomesInvalidatedAndRequestable` |
| P0.3 | Drift de payload/ruta termina como FAILED (parece rechazo bancario) | **REAL → CORREGIDO** | `payFragmentSummary` añade `invalidated`; el outcome global marca `INVALIDATED` (re-solicitable) cuando el drift bloqueó todo, no `FAILED`. Además se protegió `INVALIDATED` del reset de `refreshPayFragmentsFromCorrectiveSet`. Test `planDriftMakesRunInvalidatedNotFailedAndRequestable` |
| P1 | El historial PAY no expone hashes por API/UI | **REAL → CORREGIDO** | `PayAction` expone `payloadHash` y `configHash`; el endpoint `pay-actions` y la línea de tiempo de la UI los muestran |
| P0.4 | Plan aprobado no persistido completamente (solo hashes y ruta) | **MITIGADO → documentado** | El claim atómico valida `config_hash` + `payload_hash` + `approved_routed_as`; el despacho usa el plan congelado en memoria. Persistir el plan completo versionado (`endpoint_profile_ref`/`version`, `connection_profile_version`, `status_profile_ref`, `plan_hash`) es endurecimiento de auditoría/recuperación. Documentado |
| P1 | STATUS para SFTP sigue siendo HTTP (falta StatusTransport SFTP) | **DOCUMENTADO** | `routeQuery` ya falla ruidosamente sin `url` (no consulta endpoint incorrecto). Un StatusTransport SFTP (ACK/NACK file, directorio de confirmaciones) es una feature aparte. Documentado |
| P1 | Append-only no es cadena criptográfica | **DOCUMENTADO** | El trigger evita mutación desde la app; una cadena `action_hash`/`previous_action_hash` + HMAC/WORM + rol DB solo-insert es endurecimiento para auditoría bancaria formal. Documentado |

---

## Detalle de lo corregido (con prueba)

### P0.1 + P0.2 — lease vencido: acción atómica del scheduler y clasificación correcta
**Causa:** `markExpiredPayExecutionsUncertain` hacía `EXECUTING → UNCERTAIN` en una conexión y marcaba
los fragmentos en **otras** conexiones (inconsistencia parcial), **sin** registrar acción append-only;
y convertía **todo** `EXECUTING` vencido en `UNCERTAIN`, incluso si nunca hubo despacho.

**Fix (sin fallback):** cada run vencido se procesa en **una transacción** (`inTransaction`):
- Si hay algún fragmento despachado (`DISPATCHING`/`SENT`/`UNCERTAIN`) → run `UNCERTAIN` + fragmentos
  `PREPARED`/`DISPATCHING` → `UNCERTAIN` + acción `PAY_UNCERTAIN` (actor `system:pay-lease-scheduler`).
- Si **no** hubo despacho (cayó entre el claim y el primer envío) → run `INVALIDATED` (re-solicitable) +
  fragmentos `PREPARED` → `INVALIDATED` + acción `PAY_INVALIDATED`. No hubo llamada al banco, así que es
  seguro re-solicitar; no queda un incierto irrecuperable.

Tests: `expiredLeaseWithoutDispatchBecomesInvalidatedAndRequestable` (sin despacho → INVALIDATED +
acción del scheduler + re-solicitable) y `expiredLeaseAfterDispatchBecomesUncertainWithSchedulerAction`
(con despacho → UNCERTAIN + acción del scheduler).

### P0.3 — drift de plan = INVALIDATED, no rechazo bancario
`payFragmentSummary` ahora cuenta `invalidated` aparte de `pending`. En el outcome del PAY: si el envío
quedó bloqueado por drift (fragmentos `INVALIDATED`, sin `SENT` ni `REJECTED`), el run se marca
`INVALIDATED` (re-solicitable) con acción `PAY_INVALIDATED`, **no** `FAILED`. Semánticamente: `FAILED` =
el banco rechazó; `INVALIDATED` = el sistema bloqueó el envío porque cambió lo aprobado. Además se
detectó y corrigió que `refreshPayFragmentsFromCorrectiveSet` **reseteaba** los `INVALIDATED` (no estaban
en su lista protegida) — ahora se preservan. Test `planDriftMakesRunInvalidatedNotFailedAndRequestable`.

### P1 — hashes aprobados visibles en API/UI
`PayAction` (record + query `pay-actions`) expone `payloadHash` y `configHash`; el modelo Angular y la
línea de tiempo de cuarentena los muestran, para que el operador vea qué payload/config aprobó el checker.

---

## Pruebas que evidencian el cierre (todas en verde)

- `Mt101CorrectiveLifecycleServiceTest` — **27** (lease sin/con despacho, drift→INVALIDATED, + las previas).
- Dominio swift completo (provider + service + repository + transport): **229** tests, 0 fallos.
- Integración end-to-end (Flyway real V51..V54): `BankProfileHomologationIT` + `Mt101OutboundEndToEndIT`
  = **3** tests, 0 fallos, `BUILD SUCCESS`.
- Frontend: `nx build web` exitoso.

## Documentado (endurecimiento mayor, no bloqueante)

1. **Plan completo persistido por fragmento (P0.4).** Hoy el invariante "aprobado = enviado" lo garantizan
   el `config_hash` + `payload_hash` + `approved_routed_as` validados en el claim y el plan congelado en
   memoria. La tabla `mt101_corrective_pay_plan` (endpoint/connection/status/reconcile profile + version +
   `plan_hash`, sin secretos resueltos) es endurecimiento de auditoría/recuperación.
2. **StatusTransport SFTP (ACK/NACK).** `MT101_STATUS` por ruta es REST (url/method/timeout); falla
   ruidosamente sin `routeQuery.url` (mejor que consultar el endpoint equivocado). Un transporte de
   STATUS por SFTP (archivo de respuesta/ACK) es una feature aparte.
3. **Cadena criptográfica del historial.** El trigger evita mutación desde la app; para auditoría bancaria
   formal: `action_hash`/`previous_action_hash` encadenados, HMAC/firma, export a WORM/Object Lock y rol
   de BD exclusivo de inserción (sin UPDATE/DELETE/TRUNCATE para el usuario aplicativo).

## Conclusión

El v25 acertó en correcciones reales de clasificación e integridad del lease. Se cerraron con prueba:
**lease vencido con acción atómica del scheduler**, **distinción PAY-no-iniciado vs incierto**,
**drift = INVALIDATED (re-solicitable) y no rechazo bancario**, y **hashes aprobados visibles en API/UI**.
Quedan documentados como endurecimiento el **plan completo persistido**, el **StatusTransport SFTP** y la
**cadena criptográfica** del historial. La garantía central —toda interrupción entre aprobación y envío
queda clasificada de forma exacta (no enviado / enviado / rechazado / inválido / incierto)— ya se cumple.
