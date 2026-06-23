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
| P0.1 | El plan aprobado no es el plan ejecutado (PAY re-lee config dinámica) | **REAL → CORREGIDO (2º pase)** | `approveAndPayCorrective` lee la config de MT101_PAY **una sola vez** (snapshot congelado); ese mismo objeto se hashea, se valida contra el hash de la solicitud, y se usa para preparar intents **y** despachar (overload `runStage(...frozenBaseConfig)`). Sin re-lectura entre hash y envío. Test `payDispatchesTheFrozenApprovedConfigNotAConfigReReadAtDispatch` (config que "deriva" tras el hash → el envío usa la aprobada) |
| P1 | OVERWRITE permitido para PAY (puede re-entregar un pago) | **REAL → CORREGIDO (2º pase)** | `assertCorrectivePayPolicy` rechaza `sftp.remoteDuplicatePolicy=OVERWRITE` (base y por ruta) en solicitud y aprobación, sin fallback. Test `correctivePayRejectsSftpOverwritePolicy` |
| P1 | Auditoría de PAY mutable, no append-only | **REAL → CORREGIDO (2º pase)** | **V51** `mt101_corrective_pay_action`: historial inmutable con una fila por transición (REQUESTED/CLAIMED/**DISPATCHING**/SENT/UNCERTAIN/PARTIALLY_SENT/REJECTED/INVALIDATED/RESOLVED) con actor/motivo/ticket/hashes. Test `payActionsAreRecordedAppendOnlyAcrossRequestClaimUncertainAndResolution` |
| P1 | STATUS usa config actual, no perfil congelado por fragmento | **REAL → CORREGIDO (3er pase)** | **V52** `pay_status_config_snapshot`: el PAY congela el perfil de MT101_STATUS y `resolveUncertainPay` consulta ese snapshot, no la config vigente (que pudo cambiar entre el envío y la resolución). Sin fallback cuando hay snapshot. Test `resolveUncertainPayUsesTheStatusProfileFrozenAtPayNotTheCurrentConfig` |

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
- `Mt101CorrectiveLifecycleServiceTest` — **19** (1er pase: `payStatus` en respuesta + motivo de
  resolución; 2º pase: config congelada, rechazo de OVERWRITE, historial append-only; 3er pase: perfil
  de STATUS congelado).
- Dominio swift completo (provider + service + repository + transport): **220** tests, 0 fallos.
- **Integración end-to-end (Flyway real con V51/V52):** `BankProfileHomologationIT` + `Mt101OutboundEndToEndIT`
  = **3** tests, 0 fallos, `BUILD SUCCESS`.
- Frontend: `nx build web` exitoso + `nx test web` **214** specs (56 archivos), 0 fallos.

## Segundo pase (doble check) — cierre de los P0.1/P1 que quedaban abiertos

### P0.1 — el plan aprobado ES el plan ejecutado (config congelada)
**Hallazgo confirmado contra el código:** `approveAndPayCorrective` leía la config de MT101_PAY **tres
veces** independientes vía `taskConfigSource.taskConfig(...)` (en `payConfigHash`, en `preparePayIntents`,
y en `runStage`). Aunque el claim valida `config_hash`, el despacho re-leía config viva: una "deriva"
entre la lectura del hash y la del envío podía despachar bytes distintos a los aprobados.

**Fix (sin fallback):** se lee la config **una sola vez** → `frozenPayConfig`. Ese mismo objeto se
hashea (`payConfigHashOf`), se valida contra el hash de la solicitud, se usa para `preparePayIntents`
y se despacha con un overload `runStage(..., frozenBaseConfig)` que **no re-lee** el task definition.
"Configuración aprobada = configuración usada para enviar", literal. Test
`payDispatchesTheFrozenApprovedConfigNotAConfigReReadAtDispatch`: un `taskConfigSource` que devuelve
`approved-` en las 2 primeras lecturas y `drift-` a partir de la 3ª; con el snapshot el despacho y el
ledger usan `approved-` (con la versión anterior usarían `drift-`).

### P1 — prohibir OVERWRITE para PAY correctivo
`assertCorrectivePayPolicy` rechaza `sftp.remoteDuplicatePolicy=OVERWRITE` (en la config base y en cada
`routeTransports.*`) tanto al **solicitar** como al **aprobar**, antes de cualquier hash/claim/envío.
Las políticas seguras (`SKIP_IF_SAME_HASH` default idempotente, `FAIL`) siguen permitidas. Test
`correctivePayRejectsSftpOverwritePolicy`.

### P1 — historial append-only `mt101_corrective_pay_action`
**V51** crea la tabla inmutable; `recordPayAction` (repo) inserta una fila por transición y el servicio
la invoca en cada paso: `PAY_REQUESTED`, `PAY_CLAIMED`, `PAY_SENT`/`PAY_UNCERTAIN`/`PAY_PARTIALLY_SENT`/
`PAY_REJECTED`, `PAY_INVALIDATED` y `PAY_RESOLVED`, con actor, motivo, ticket y hashes payload/config.
A diferencia de `mt101_rebuild_run` (que se sobrescribe), el historial conserva **todas** las acciones.
Test `payActionsAreRecordedAppendOnlyAcrossRequestClaimUncertainAndResolution` (request→claim→uncertain
→resolución deja 4 filas ordenadas con su actor; el motivo/ticket del maker queda en la fila de solicitud).

## Tercer pase (cierre del último hardening) — perfil de STATUS congelado

**P1 — la resolución de un incierto usa el perfil de STATUS congelado en el PAY.** **V52** agrega
`pay_status_config_snapshot`. En `approveAndPayCorrective`, tras el claim, se serializa y persiste la
config de MT101_STATUS (el perfil usado al enviar). `resolveUncertainPay` deserializa ese snapshot y lo
pasa como `frozenBaseConfig` al `runStage` de STATUS, de modo que la consulta diferida (que puede correr
mucho después) usa el perfil del PAY, **no** la config vigente. Sin fallback cuando hay snapshot.
Además, `PAY_DISPATCHING` ya queda registrado en el historial append-only. Test
`resolveUncertainPayUsesTheStatusProfileFrozenAtPayNotTheCurrentConfig` (el perfil de STATUS "deriva"
tras el PAY → la resolución usa el congelado, no el derivado).

## Pendientes

Ninguno funcional. Todos los hallazgos del v23 (P0/P1/P2) quedaron cerrados con prueba; no quedan
endurecimientos abiertos.

## Conclusión

El v23 detectó correctamente el **bug de dinero abierto** (SFTP post-despacho como rechazo reusable),
corregido y probado contra un servidor SFTP real. En el primer pase se cerró el ciclo de
**gobierno/evidencia** extremo a extremo (respuesta fresca, API que expone la evidencia, UI que la
captura obligatoriamente, resolución de inciertos con motivo). En el **segundo pase (doble check)** se
cerraron además el **plan congelado** (config aprobada = enviada, sin re-lectura), la **prohibición de
OVERWRITE** para PAY y el **historial append-only** de acciones. Queda como único endurecimiento
documentado el **perfil de STATUS congelado por fragmento**. El "último control crítico" del v23
—garantizar que el correctivo se envíe exactamente como fue aprobado, una sola vez y con evidencia
bancaria recuperable— queda cumplido.
