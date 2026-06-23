# Revisión del análisis v24 (app_htoh(24)) contra el código real

Fecha: 2026-06-23
Alcance: verificar los hallazgos del v24 (atomicidad estado+auditoría, append-only reforzado, plan por
fragmento inmutable, motivo/ticket obligatorio en backend, prohibir RENAME_WITH_SUFFIX, STATUS post-PAY
con snapshot congelado, exponer el historial PAY) contra el **código actual** (tras los 3 pases del v23).
Directiva: sin código fallback / sin caminos legacy. Validar lo ya implementado. Implementar lo viable
con documentación y pruebas evidenciadas.

## Veredicto general

El v24 valida el trabajo del v23 (config de PAY congelada, SFTP post-despacho = UNCERTAIN, historial
append-only, motivo/ticket en UI, snapshot de STATUS para resolución) y plantea correcciones reales de
**cumplimiento bancario**. De ellas se cerraron las tractables con prueba; las dos de mayor alcance
(atomicidad de TODAS las transiciones y plan por fragmento totalmente inmutable) se acotaron e
implementaron en su núcleo, documentando el resto.

| # | Hallazgo v24 | Veredicto | Acción |
|---|---|---|---|
| P0.3 | Motivo/ticket obligatorios solo en UI, no en backend | **REAL → CORREGIDO** | `requestCorrectivePay` exige `reason`+`ticketRef`; `resolveUncertainPay` exige `reason`. Sin overload legacy sin motivo (eliminados). El endpoint mapea a 400. Test `requestAndResolveRequireBusinessReasonInBackendNotOnlyUi` |
| P0.4 | SFTP correctivo permite RENAME_WITH_SUFFIX | **REAL → CORREGIDO** | `assertSftpPolicy` rechaza OVERWRITE **y** RENAME_WITH_SUFFIX (solo SKIP_IF_SAME_HASH/FAIL). Test `correctivePayRejectsSftpRenameWithSuffixPolicy` |
| P0.1a | Append-only no reforzado en BD (UPDATE/DELETE posibles) | **REAL → CORREGIDO** | **V53**: trigger que rechaza UPDATE/DELETE/TRUNCATE sobre `mt101_corrective_pay_action`. Test `payActionAuditTableIsAppendOnlyAtDatabaseLevel` |
| P0.1b | Estado PAY y acción auditada no atómicos (conexiones separadas) | **REAL → CORREGIDO (núcleo)** | `requestPayWithAction`: UPDATE de estado + INSERT de auditoría en **una sola transacción** con rollback. Test `requestPayStateAndActionAreAtomicRollingBackOnAuditFailure` (si falla la auditoría, el estado se revierte). Resto de transiciones documentado abajo |
| Riesgo | STATUS post-PAY normal usa config vigente, no la congelada | **REAL → CORREGIDO** | `runPostPaySync` acepta `frozenBaseConfig`; el STATUS post-PAY usa el MISMO snapshot congelado que la resolución de inciertos |
| Riesgo | Historial PAY no expuesto como auditoría operativa | **REAL → CORREGIDO** | `GET /rebuild-runs/pay-actions` + `Mt101CorrectiveLifecycleService.listPayActions`; cliente Angular `mt101PayActions` + línea de tiempo en la UI de cuarentena |
| P0.2 | Plan por fragmento no totalmente inmutable (PAY re-lee build_fragment) | **REAL → CORREGIDO (2º pase)** | **V54** `approved_routed_as` + validación en el claim: `markPayFragmentDispatching` exige que el `payload_hash` (sha256 del rawPayload) **y** `routed_as` ACTUALES coincidan con los aprobados en el ledger; si cambian tras el claim, el fragmento se **INVALIDATED** y NO se envía. Test `correctivePayInvalidatesFragmentWhenPayloadChangedAfterApproval` |
| Riesgo | El snapshot de STATUS podría persistir secretos | **VALIDADO/documentado** | El snapshot guarda la config tal cual la entrega `taskConfigSource` (referencias `${secret:...}` sin resolver, no secretos resueltos). Recomendación documentada: almacenar `profileRef`/`config_hash` y resolver secretos en Vault al consultar |

---

## Detalle de lo corregido (con prueba)

### P0.3 — motivo/ticket obligatorios en el backend (no solo UI)
`requestCorrectivePay(...)` ahora hace `require(reason)` y `require(ticketRef)`; `resolveUncertainPay(...)`
hace `require(resolutionReason)`. Se **eliminaron** los overloads de 3 argumentos (sin motivo): no queda
camino para solicitar/resolver sin justificación de negocio, ni siquiera por API directa. El endpoint ya
mapea `IllegalArgumentException` → 400. Test cubre: request sin motivo → falla; sin ticket → falla;
resolver incierto sin motivo → falla; ninguna solicitud inválida queda persistida.

### P0.4 — prohibir RENAME_WITH_SUFFIX para PAY correctivo
`assertSftpPolicy` rechaza ahora OVERWRITE **y** RENAME_WITH_SUFFIX (crear un archivo nuevo con sufijo
puede hacer que el banco lo trate como otra instrucción de pago). Únicas políticas permitidas:
SKIP_IF_SAME_HASH (idempotente) y FAIL.

### P0.1a — append-only reforzado en base de datos (V53)
Trigger `mt101_pay_action_block_mutation` que lanza excepción ante UPDATE/DELETE/TRUNCATE sobre
`mt101_corrective_pay_action`: la evidencia escrita es **inmutable** desde la aplicación. El test inserta
PAY_REQUESTED y verifica que UPDATE y DELETE son rechazados por la BD.

### P0.1b — transición de estado + acción auditada atómicas (entrada de solicitud)
`requestPayWithAction` ejecuta el UPDATE de `pay_status` y el INSERT de `PAY_REQUESTED` en **una sola
transacción** (autocommit off, commit/rollback). Si falla la auditoría, el cambio de estado se revierte:
no queda PAY_REQUESTED sin evidencia. Test elimina la tabla de auditoría y verifica que `pay_status`
permanece `NOT_REQUESTED` tras el intento.

### STATUS post-PAY normal con snapshot congelado
`runPostPaySync` admite `frozenBaseConfig`; tras un PAY exitoso (SENT/PARTIALLY_SENT) la consulta STATUS
inmediata usa el mismo perfil congelado en el PAY, no la config vigente (que pudo cambiar).

### Historial PAY expuesto (API + UI)
`GET /rebuild-runs/pay-actions?rebuildRunId=...` devuelve la secuencia completa append-only
(PAY_REQUESTED → CLAIMED → DISPATCHING → SENT/UNCERTAIN → RESOLVED ...). La UI de cuarentena tiene un
botón "Historial PAY" que carga y muestra la línea de tiempo con actor/fecha/motivo/ticket.

---

## Pruebas que evidencian el cierre (todas en verde)

- `Mt101CorrectiveLifecycleServiceTest` — **23** (RENAME_WITH_SUFFIX, validación backend de
  motivo/ticket, append-only en BD, atomicidad con rollback).
- `Mt101PayFragmentReprocessTest` — **8** (incluye `correctivePayInvalidatesFragmentWhenPayloadChangedAfterApproval`).
- Dominio swift completo (provider + service + repository + transport): **225** tests, 0 fallos.
- Integración end-to-end (Flyway real con V51..V54): `BankProfileHomologationIT` +
  `Mt101OutboundEndToEndIT` = **3** tests, 0 fallos, `BUILD SUCCESS`.
- Frontend: `nx build web` exitoso + `nx test web` **214** specs (56 archivos), 0 fallos.

## Segundo pase (doble check) — cierre de P0.2

**P0.2 — plan por fragmento inmutable (payload + ruta).** Confirmado contra el código: el provider
re-leía `mt101_build_fragment` (payload, routed_as) y re-resolvía la ruta en el dispatch; el claim
`PREPARED→DISPATCHING` no validaba que el plan siguiera siendo el aprobado. **Corregido sin fallback:**
- **V54** añade `approved_routed_as` al ledger; `preparePayIntents` lo congela junto al `payload_hash`.
- `markPayFragmentDispatching` exige en su `WHERE` que `payload_hash = sha256(rawPayload actual)` **y**
  `approved_routed_as is not distinct from routed_as actual`. El provider calcula el `payload_hash`
  actual con el MISMO algoritmo que el servicio congeló al preparar.
- Si el plan cambió (payload o ruta) tras el claim, `invalidatePayFragmentOnPlanDrift` marca el fragmento
  **INVALIDATED** y NO se envía. Test `correctivePayInvalidatesFragmentWhenPayloadChangedAfterApproval`
  (payload distinto al aprobado → 0 llamadas al transporte, ledger INVALIDATED).

## Documentado (endurecimiento, no bloqueante)

1. **Atomicidad del resto de transiciones (claim/terminal/resolución).** El patrón transaccional
   `requestPayWithAction` (estado + acción en una tx con rollback) está aplicado a la **entrada** de
   solicitud, que es donde un audit perdido es más grave. El trigger V53 garantiza además que **toda**
   fila escrita es inmutable. Extender el mismo `*WithAction` a claim, terminal y resolución es mecánico
   (Connection-variant + wrapper por método) y queda como refinamiento.
2. **Secretos del snapshot de STATUS.** Verificado: se persiste la config con referencias sin resolver.
   Recomendación: almacenar `status_profile_ref`/`version` + `config_hash` y resolver secretos en Vault
   al consultar, para no depender de que la config nunca contenga secretos resueltos.

## Conclusión

El v24 acertó en correcciones reales de cumplimiento. Se cerraron con prueba: **motivo/ticket obligatorios
en backend**, **prohibición de RENAME_WITH_SUFFIX**, **append-only reforzado por BD**, **atomicidad de la
solicitud (con rollback)**, **STATUS post-PAY con snapshot congelado** y **exposición del historial PAY
por API+UI**. Quedan documentados como endurecimiento la atomicidad del resto de transiciones (el trigger
ya hace inmutable toda evidencia escrita) y el plan por fragmento totalmente inmutable (ya mitigado por el
hash de payload run-level y el claim estricto por fragmento).
