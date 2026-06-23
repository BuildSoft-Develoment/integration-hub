# Revisión del análisis v23 (app_htoh(23)) contra el código real

Fecha: 2026-06-23
Alcance: verificar los P0/P1/P2 del v23 contra el **código actual** (tras el cierre v22: SFTP/REST
transport, ledger por fragmento, claim atómico `PREPARED → DISPATCHING`, STATUS por ruta, auditoría
de solicitud/resolución de PAY).
Directiva: sin código fallback / sin caminos legacy. Validar lo ya implementado. Implementar lo
viable con documentación y pruebas evidenciadas.

## Veredicto general

El v23 acierta en un **bug real de seguridad de dinero** que estaba abierto: el transporte **SFTP**
clasificaba como `REJECTED` (reusable) cualquier error de red, incluso **después** de iniciar el
`put`/`rename` del archivo final — un envío que sí llegó al banco podía reusarse y **duplicar el
pago**. Se corrigió. También acierta en gaps de **gobierno/UI**: la respuesta de `request-pay` no
reflejaba el `pay_status` recién aplicado y la API/UI no exponía ni capturaba la evidencia
(motivo/ticket/resolución) — corregido extremo a extremo. Los P0/P1 mayores restantes (plan de envío
**congelado** por fragmento, historial **append-only**, perfil de STATUS congelado) son
endurecimientos: el invariante crítico "ninguna llamada al banco sin intención aprobada y única" ya
se cumple con el claim atómico (validado en v22).

| # | Hallazgo v23 | Veredicto | Acción |
|---|---|---|---|
| P0 | SFTP marca REJECTED un envío que pudo llegar al banco | **REAL → CORREGIDO** | Clasificación por **fase**: error pre-despacho = REJECTED reusable; durante/después de `put`/`rename` = **UNCERTAIN**. Tests `networkOrServerErrorAfterUploadStartedIsUncertainNotRejected`, `connectionFailureBeforeDispatchIsRejectedNotUncertain` |
| P2 | `request-pay` devuelve el run leído ANTES del update (muestra ARCHIVED, no PAY_REQUESTED) | **REAL → CORREGIDO** | `correctiveResult` **relee** el run fresco; el resultado refleja el `pay_status` recién aplicado |
| P1 | La API no devuelve la evidencia de PAY (reason/ticket/resolved_*) | **REAL → CORREGIDO** | `CorrectiveLifecycleResult` expone `payStatus` + `payRequestReason/Ticket` + `payResolvedBy/ResolutionReason`; `RebuildRun`/`findRun` leen las columnas V49/V50 |
| P1 | La UI no envía motivo/ticket al solicitar PAY ni motivo al resolver incierto | **REAL → CORREGIDO** | Cliente `mt101RequestCorrectivePay`/`mt101ResolveUncertainPay` envían `reason`/`ticketRef`; el componente los hace **obligatorios**; nueva acción "Resolver PAY incierto"; modelo expone `payStatus`/evidencia |
| P1 | Resolver PAY incierto no recibe motivo de negocio (solo texto técnico) | **REAL → CORREGIDO** | `resolveUncertainPay(...reason)` antepone el motivo del operador AL detalle técnico (la auditoría conserva ambos). Test asserta ambos en `pay_resolution_reason` |
| P0.1 | El plan aprobado no es el plan ejecutado (PAY re-lee config dinámica) | **ABIERTO (hardening)** | Validado en v22: el claim atómico exige `payload_hash` **y** `config_hash` recomputados; el envío ocurre en la misma llamada síncrona inmediatamente tras el claim. El "plan congelado leído del ledger" es endurecimiento adicional. Documentado |
| P1 | Auditoría de PAY mutable, no append-only | **ABIERTO (hardening)** | Recomendado `mt101_corrective_pay_action` (id, action_type, prev/new status, actor, reason, ticket, hashes, created_at). No bloqueante: el ledger por fragmento + V49/V50 ya dan evidencia durable del estado actual. Documentado |
| P1 | STATUS usa config actual, no perfil congelado por fragmento | **ABIERTO (hardening)** | `routeQuery` (cierre v22) ya consulta por ruta del fragmento; falta congelar `status_profile` por fragmento. Mismo concepto que P0.1. Documentado |

---

## Detalle de lo corregido (con prueba)

### P0 — SFTP: error post-despacho = INCIERTO, no rechazo reusable (bug real, dinero)
**Causa:** el `catch (JSchException | SftpException | IOException)` de `attemptUpload` devolvía
`TransportResult.rejected(...)` para **cualquier** error, sin distinguir si ocurrió antes o después
de empezar a transmitir el archivo final. El REST ya distinguía (`ConnectException` previo = rejected;
timeout/IO posterior = uncertain); el SFTP no.

**Fix (por fase, sin fallback por texto del error):**
- Bandera `dispatchStarted`, puesta en `true` justo antes de `channel.put(...)`.
- `catch`: `dispatchStarted ? uncertain : rejected`. Antes del despacho (connect/stat/get) el archivo
  final nunca se tocó → rechazo seguro reusable; durante/después de `put`/`rename` → **INCIERTO**.
- El retry propaga la incertidumbre: si el último intento fue post-despacho, `send` devuelve
  `uncertain`, no `rejected`. El provider ya mapea `result.uncertain()` → `PAY_UNCERTAIN` por
  fragmento, que el lifecycle **nunca reenvía a ciegas** (se resuelve verificando el dropPath
  remoto / STATUS).

**Pruebas (Testcontainers atmoz/sftp, servidor real):**
- `networkOrServerErrorAfterUploadStartedIsUncertainNotRejected`: se crea un **directorio** en la
  ruta final; el `put` del `.part` se completa pero el `rename` al destino falla → `result.uncertain()`.
- `connectionFailureBeforeDispatchIsRejectedNotUncertain`: puerto cerrado (fallo previo) → `rejected`,
  no `uncertain`.

### P2 + P1-API — la respuesta refleja el estado real y expone la evidencia
**Causa:** `correctiveResult(dataSource, runId, run)` usaba el `run` leído antes del update; y
`CorrectiveLifecycleResult` solo exponía `status` + sync states, no `payStatus` ni la auditoría.

**Fix:** `correctiveResult(dataSource, runId)` **relee** el run fresco (corrige la respuesta en TODAS
las transiciones); el record expone `payStatus`, `payRequestReason`, `payRequestTicket`,
`payResolvedBy`, `payResolutionReason`. `RebuildRun`/`findRun` leen las columnas V49/V50.
Test: `payRequestPersistsBusinessReasonAndTicketAsDurableEvidence` asserta `result.payStatus()==REQUESTED`
+ reason/ticket en la respuesta; `approveAndPayCorrective` → `result.payStatus()==SENT`.

### P1 — resolver PAY incierto con motivo de negocio del operador
`resolveUncertainPay(connectionRef, runId, executedBy, resolutionReason)`: el motivo del operador se
antepone al detalle técnico del sistema (`motivo | resolved by MT101_STATUS...`), de modo que la
auditoría (`pay_resolution_reason`) conserva **ambos**. Endpoint `@QueryParam("reason")`.
Test asserta que `pay_resolution_reason` contiene el motivo de negocio **y** la evidencia técnica.

### P1 — UI: motivo/ticket obligatorios y evidencia visible
- `mt101RequestCorrectivePay(reason, ticketRef)` y nuevo `mt101ResolveUncertainPay(reason)` en el
  cliente; el componente valida que motivo+ticket (solicitud) y motivo (resolución) no estén vacíos.
- Nueva acción "Resolver PAY incierto" visible cuando `payStatus===UNCERTAIN`.
- El modelo `Mt101CorrectiveLifecycle` expone `payStatus` + evidencia; i18n en es/en.
- Evidencia: `nx build web` compila sin errores (solo warnings de budget preexistentes).

---

## Pruebas que evidencian el cierre (todas en verde)

- `SftpPaymentTransportTest` — **13** (incluye los 2 de clasificación por fase).
- `RestPaymentTransportTest` — **15** (sin cambios; paridad de referencia).
- `Mt101CorrectiveLifecycleServiceTest` — **15** (request/approve/resolve reflejan `payStatus`; motivo
  de resolución conserva operador + técnico).
- Dominio swift completo (provider + service + repository + transport): **216** tests, 0 fallos.
- Frontend: `nx build web` exitoso.

## Riesgos abiertos (documentados, no bloqueantes; hardening bancario)

1. **Plan de envío congelado por fragmento (P0.1).** Hoy el invariante crítico lo garantiza el claim
   atómico (`payload_hash` + `config_hash` recomputados; envío en la misma llamada síncrona). El
   endurecimiento sería persistir el plan inmutable (transport, route_profile + version, endpoint_profile
   + version, connection_ref, status_profile, idempotency/drop_path, approved_plan_hash) y que PAY
   lea **solo** ese plan, no `process_task_definition`. Observación válida del v23: `endpoint_ref`
   guarda la clave de correlación (idempotency key / dropPath), no el host/perfil/versión.
2. **Historial append-only `mt101_corrective_pay_action` (P1).** Tabla inmutable con una fila por
   acción (REQUESTED/CLAIMED/DISPATCHING/SENT/UNCERTAIN/RESOLVED/REJECTED/INVALIDATED) con actor,
   motivo, ticket, hashes. Hoy `mt101_rebuild_run` guarda el estado actual (mutable) y el ledger por
   fragmento guarda el resultado por `:20:`.
3. **Perfil de STATUS congelado por fragmento (P1).** `routeQuery` ya consulta por la ruta del
   fragmento; falta congelar `status_profile_ref`/`version` por fragmento (mismo concepto que P0.1).
4. **Prohibir `remoteDuplicatePolicy=OVERWRITE` para PAY correctivo.** El default es `SKIP_IF_SAME_HASH`
   (idempotente y seguro). OVERWRITE no debería permitirse para pagos; documentado.

## Conclusión

El v23 detectó correctamente el **bug de dinero abierto** (SFTP post-despacho como rechazo reusable),
ya corregido y probado contra un servidor SFTP real. Se cerró además el ciclo de **gobierno/evidencia**
extremo a extremo (respuesta fresca, API que expone la evidencia, UI que la captura obligatoriamente y
permite resolver inciertos con motivo). Quedan como endurecimientos acotados el **plan congelado**, el
**historial append-only** y el **perfil de STATUS congelado**, documentados; el invariante bancario
central ("ninguna llamada al banco sin intención aprobada y única, y ningún incierto reenviado a
ciegas") ya se cumple.
