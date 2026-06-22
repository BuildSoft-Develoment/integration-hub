# Revisión del análisis v19 (app_htoh(19)) contra el código real

Fecha: 2026-06-20
Alcance: verificar los 4 P0 + P1 del v19 (maker-checker de PAY, hash aprobado, PAY incierto,
parciales, pipeline correctivo, identidad multiarchivo) contra el **código actual**.
Directiva: sin código fallback / sin caminos legacy.

## Veredicto general

El v19 **diagnostica bien**, pero (como el v15/v16) revisó un **snapshot anterior**. Contra el
código actual (migraciones V43 + V44, expansión del `Mt101CorrectiveLifecycleService` y la
clasificación tipada de PAY incierto), **los 4 bloqueantes P0 y los 3 riesgos P1 ya están
implementados**. No hay caminos legacy: el PAY incierto no se reintenta solo, el hash aprobado
se congela, y los parciales se modelan por fragmento.

| # | Hallazgo v19 | Estado | Evidencia |
|---|---|---|---|
| P0.1 | PAY incierto tras caída (EXECUTING colgado) | **YA RESUELTO** | V44: `pay_lease_until`, `pay_uncertain_reason`, `pay_claimed_payload_hash`; `claimPayForExecution` con lease; `markExpiredPayExecutionsUncertain` (`Mt101RebuildRepository:732`, `Mt101RebuildService:473`) → `EXECUTING` vencido pasa a **UNCERTAIN**, nunca a REQUESTED automático. Clasificación tipada `TransportResult.uncertain` (timeout/IO tras enviar) → `markPayUncertain` |
| P0.2 | No se congela el payload aprobado→enviado | **YA RESUELTO** | `requestPay` guarda `pay_requested_payload_hash` (hash del lote archivado); `approveAndPayCorrective` recomputa y compara, y si cambió → `invalidatePayRequest` + aborta (`Mt101CorrectiveLifecycleService:184-190`). Regla "hash aprobado = hash enviado" |
| P0.3 | PAY parcial se registra como fallo global | **YA RESUELTO** | `mt101_corrective_pay_fragment` (estado por fragmento: SENT/REJECTED/UNCERTAIN); `markPayCompleted(...,"PARTIALLY_SENT",...)`; cuarentena granular (`REBUILD_SENT`/`REBUILD_REJECTED` por fila). Test `partialPayPersistsFragmentDetailAndKeepsGranularQuarantine` |
| P0.4 | Pipeline correctivo no replica REPAIR/ROUTE/STATUS/RECONCILE | **YA RESUELTO** | `Mt101CorrectiveLifecycleService` orquesta REPAIR→VALIDATE→ROUTE→ARCHIVE (advance) y PAY→STATUS→RECONCILE (approveAndPay), reusando los configs del proceso original |
| P1a | Scheduler no descubre rebuilds en bases no-default | **YA RESUELTO** | `synchronizeActiveLifecycles()` itera `defaultDataSource` **+** `connectionPoolManager.activeJdbcConnectionRefs()`; `markExpiredPayExecutionsUncertain` por datasource (`Mt101RebuildService:455-475`) |
| P1b | Auditoría fría con identidad débil (recordId sin stagingId) | **YA RESUELTO** | `Mt101StagingCorrectionService.emit`: `recordId = fragmentSetId:sourceFileHash:stagingId` + attrs `stagingId`/`sourceTaskDefinitionId`/`sourceName` |
| P1c | UI permite corregir sin If-Match | **YA RESUELTO** | `saveCorrection` exige `correctionVersion() !== null` antes de enviar (bloquea si no se pudo cargar versión); envía `version` como If-Match |

---

## Detalle de lo ya implementado

**P0.1 — PAY incierto seguro.** El claim atómico (`REQUESTED→EXECUTING` condicional, un solo
checker gana) ya existía; V44 añadió el **lease** (`pay_lease_until`) y el estado
**UNCERTAIN**. Un `EXECUTING` cuyo lease vence se marca `UNCERTAIN` (no se reintenta ni vuelve
a REQUESTED). Además la clasificación es **tipada**: el transporte devuelve
`TransportResult.uncertain` ante timeout de lectura / IO tras enviar / interrupción (no
`rejected`), y `dispatch` lo cuenta como `uncertainCount` sin marcar el fragmento SENT/REJECTED;
`approveAndPayCorrective` lo lleva a `markPayUncertain` y **no** corre STATUS/RECONCILE. El
`ConnectException` (nada enviado) sí es rechazo definitivo. Resolver UNCERTAIN→SENT/FAILED es una
acción de conciliación (MT101_STATUS) deliberadamente **no automática** — coherente con "nunca
reenviar a ciegas".

**P0.2 — hash aprobado inmutable.** `requestPay` calcula y persiste el hash del set correctivo
archivado; al aprobar+ejecutar se recomputa y, si difiere, se invalida la solicitud (vuelve a
REQUESTED con motivo) y no se envía. Test `invalidatesPayRequestWhenArchivedPayloadHashChanges`.

**P0.3 — parcial por fragmento.** Cada fragmento correctivo tiene su fila en
`mt101_corrective_pay_fragment` con `pay_status` (SENT/REJECTED/UNCERTAIN), `gateway_reference`,
`idempotency_key`, `payload_hash`. 9-SENT/1-REJECTED → run `PARTIALLY_SENT` y la fila rechazada
queda `REBUILD_REJECTED` (reabrible), no "todo el PAY falló".

**P0.4 — pipeline correctivo completo.** REPAIR (opcional) y ROUTE se ejecutan; STATUS y
RECONCILE corren tras un PAY enviado/parcial (no tras incierto). Cada etapa reusa el config de la
tarea hermana del proceso original (`Mt101CorrectiveTaskConfigSource`).

**P1a/P1b/P1c** — cerrados según la tabla (scheduler multi-datasource, recordId con stagingId,
If-Match obligatorio en la UI).

---

## Pruebas que evidencian el cierre (todas en verde)

- `Mt101CorrectiveLifecycleServiceTest` (8): avance VALIDATE+ARCHIVE (+ROUTE), SoD del envío,
  claim atómico que impide doble envío, **invalidación por cambio de hash aprobado**, **parcial
  con detalle por fragmento**, **lease vencido → UNCERTAIN sin reintento**, y **PAY incierto
  (timeout) → UNCERTAIN sin STATUS/RECONCILE**.
- `Mt101PayTaskProviderTest` (11): clasifica UNCERTAIN aparte de REJECTED; excepción genérica del
  transporte sigue siendo rechazo.
- `RestPaymentTransportTest` (15): **timeout de lectura → `uncertain`** (no rechazo).
- `Mt101MultiSourceLineageTest` (1): dos archivos byte-idénticos (mismo hash/fila, distinto
  `stagingId`) conservan ambos linajes con su origen.
- Backend swift en este run: **237** tests, 0 fallos. Frontend: **214**.
- ITs reparadas en este pase: `Mt101MassivePipelinePerfIT` (regresión de B3': faltaban columnas
  V42 en su schema hand-rolled) y el `mt101_archive.process_execution_id` stale (pre-existente,
  era V36) en perf + `Mt101OutboundEndToEndIT`.

## Mejora del análisis (lo que el v19 no refleja por revisar un snapshot previo)

1. El v19 pide "agregar `pay_payload_hash`, `pay_idempotency_key`, `gateway_reference`,
   `pay_lease_until`, `pay_uncertain_reason`": **todos ya existen** (V44 + `mt101_corrective_pay_fragment`).
2. El v19 pide `PARTIALLY_SENT`: **ya existe** con detalle por fragmento.
3. El v19 pide ROUTE/STATUS/RECONCILE en el correctivo: **ya se ejecutan**.
4. El v19 marca el scheduler multi-datasource como P1 abierto: **ya itera `activeJdbcConnectionRefs()`**.
5. Único matiz: la **resolución automática** de un PAY `UNCERTAIN` vía consulta STATUS no es
   automática por diseño (requiere conciliación), lo cual el propio v19 admite como correcto
   ("intervención manual"). No es un hueco, es la postura segura.

## Conclusión

El v19 es un buen análisis, pero **el código ya pasó por delante**: sus 4 P0 y 3 P1 están
implementados, con pruebas que lo evidencian. El reproceso correctivo bancario ya es seguro en
lo esencial: claim atómico, hash aprobado inmutable, PAY incierto sin reenvío a ciegas, parciales
por fragmento, pipeline completo, identidad estricta por `stagingId` y auditoría con origen. No
quedan caminos legacy ni fallback.
