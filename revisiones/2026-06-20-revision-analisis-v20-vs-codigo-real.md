# Revisión del análisis v20 (app_htoh(20)) contra el código real

Fecha: 2026-06-20
Alcance: verificar los 5 P0 + P1 del v20 (ROUTE con fragmentos persistidos, ledger pre-envío,
idempotency real, STATUS de todos los SENT, RECONCILE scopeado, recuperación de UNCERTAIN/parcial)
contra el **código actual** (migraciones V44/V45/V46).
Directiva: sin código fallback / sin caminos legacy.

## Veredicto general

El v20 es el análisis **más afilado** hasta ahora — sus hallazgos son técnicos y concretos, no
genéricos. Pero (como v15/v16/v19) revisó un **snapshot anterior**. Contra el código actual
(round V45 "corrective route + pay intent" y V46 "uncertain resolution + child corrective"),
**los 5 bloqueantes P0 y los riesgos P1 ya están implementados**. No quedan caminos legacy.

| # | Hallazgo v20 | Estado | Evidencia |
|---|---|---|---|
| P0.1 | MT101_ROUTE no acepta la fuente persistida de fragmentos | **YA RESUELTO** | `Mt101RouteTaskProvider:103-105` → `routeFromFragmentStore(...)` lee `mt101_build_fragment` paginado por `fragmentSetId` |
| P0.2 | El detalle de PAY se persiste DESPUÉS del envío | **YA RESUELTO** | `preparePayIntents(...)` crea la intención durable por fragmento (PREPARED + idempotency_key + transport + endpoint_ref) **antes** del `runStage(payProvider, ...)` (V45) |
| P0.3 | La idempotency_key guardada ≠ la enviada | **YA RESUELTO** | `Mt101PaymentCorrelation` es la **única fuente**: el intent persiste `correlationKey(...)` y `RestPaymentTransport:85` envía `restIdempotencyKey(...)` (misma clase) → persistida = enviada |
| P0.4 | MT101_STATUS solo recibe una muestra (1000) | **YA RESUELTO** | el lifecycle pasa `correctivePaySource(runId, ...)` (no `payResult.records`); `Mt101StatusTaskProvider.executeCorrectiveQuery` pagina `mt101_corrective_pay_fragment` por `correctivePayRunId` (todos los SENT) |
| P0.5 | MT101_RECONCILE no limitado al correctivo | **YA RESUELTO** | `Mt101ReconcileTaskProvider` resuelve `correctiveScope(...)` desde `correctivePaySource` y restringe el reconcile a ese `scope` (no todo el portafolio del día) |
| P1 | PAY incierto no emite evento RECORD | **YA RESUELTO** | `recordEnvelope(...)` emite `RECORD_SEND_UNCERTAIN` / status `UNCERTAIN` (no como rechazo). *(Una regresión que introduje con el `continue` ya fue corregida en el round actual.)* |
| P1 | UNCERTAIN sin acción de resolución | **YA RESUELTO** | endpoint "Resuelve PAY_UNCERTAIN consultando MT101_STATUS. No reenvia MT101_PAY" (`Mt101QuarantineResource:306`) + V46 |
| P1 | Parcial sin correctivo de 2º nivel | **YA RESUELTO** | V46 `mt101_uncertain_resolution_and_child_corrective` (parent/child corrective; los SENT quedan inmutables) |
| P1 | STATUS/RECONCILE post-PAY sin visibilidad separada | **YA RESUELTO (este pase)** | V47: `status_sync_status` + `reconciliation_status` (+ error). `runPostPaySync` ejecuta STATUS/RECONCILE tras PAY enviado capturando OK/FAILED/SKIPPED **sin** lanzar ni revertir el pago. Test `postPayStatusFailureDoesNotRevertSentAndIsVisibleSeparately` |

---

## Detalle de lo ya implementado (mejora del análisis)

**P0.1 — ROUTE outbound con fragmentos.** El v20 dice que ROUTE "solo acepta lista o inbound";
el código actual tiene una **rama de fragment source** (`routeFromFragmentStore`) que lee
`mt101_build_fragment` paginado por `fragmentSetId` y persiste la decisión de ruta. No falla con
`{fragmentSetId, connectionRef}`.

**P0.2 — ledger pre-envío.** `preparePayIntents` persiste por fragmento la intención
(`PREPARED`) con `idempotency_key`, `transport`, `endpoint_ref`, `payload_hash` **antes** de
llamar al gateway. Una caída tras el envío deja un ledger durable para conciliar fragmento a
fragmento. (Migración V45.)

**P0.3 — idempotencia real auditada.** `Mt101PaymentCorrelation` centraliza la clave: el intent
la persiste y `RestPaymentTransport` la envía como `Idempotency-Key` con la misma función. Una
conciliación incierta consulta con la **misma** clave que se envió.

**P0.4 — STATUS de todos los SENT.** El lifecycle ya no entrega la muestra de PAY; entrega
`correctivePaySource(runId)` y `Mt101StatusTaskProvider.executeCorrectiveQuery` pagina
`mt101_corrective_pay_fragment where rebuild_run_id = ? and pay_status = 'SENT'`. 20.000 fragmentos
→ STATUS los cubre todos.

**P0.5 — RECONCILE scopeado.** El reconcile recibe el scope del correctivo y solo toca los
archivos de ese run; no reconcilia mensajes ajenos por rango de fechas.

**P1 — recuperación de UNCERTAIN / parcial.** Existe el endpoint de resolución (UNCERTAIN →
consulta STATUS → SENT/REJECTED, sin reenviar PAY) y el **correctivo hijo** (V46) para reparar
solo el fragmento rechazado dejando inmutables los enviados.

---

## Pruebas que evidencian el cierre (todas en verde)

- Backend swift en este run: **244** tests, 0 fallos (incluye `Mt101CorrectiveLifecycleServiceTest`,
  `Mt101PayTaskProviderTest`, `RestPaymentTransportTest`, `Mt101RouteTaskProviderTest`,
  `Mt101StatusTaskProviderTest`, `Mt101ReconcileTaskProviderTest`, `Mt101MultiSourceLineageTest`).
- Frontend: **214**.
- ITs de pipeline (perf + outbound) reparadas en pases anteriores.

## Residual cerrado en este pase (P2)

Se implementó la visibilidad operativa separada (migración **V47**): `mt101_rebuild_run` gana
`status_sync_status` y `reconciliation_status` (+ `*_error`). Tras un PAY enviado, `runPostPaySync`
ejecuta MT101_STATUS y MT101_RECONCILE **capturando** su resultado (OK/FAILED/SKIPPED) **sin lanzar
al operador ni revertir** `PAY=SENT`: ahora se lee "el pago salió; falló la consulta posterior" en
vez de "el PAY falló", y un fallo de STATUS no aborta el RECONCILE. Evidencia:
`postPayStatusFailureDoesNotRevertSentAndIsVisibleSeparately` (PAY=SENT, status_sync=FAILED,
reconciliation=OK, sin excepción). Backend swift: **245** tests, 0 fallos.

Surfaceo a UI (cerrado): `CorrectiveLifecycleResult` lleva `statusSyncStatus`/`reconciliationStatus`
(leídos con `payStageSync`), y el panel "Ciclo del correctivo" los muestra ("Consulta de estado
(STATUS): FAILED", "Conciliación (RECONCILE): OK"), en rojo si FAILED. Frontend 214 + build verde.

No quedan pendientes del v20.

## Conclusión

El v20 diagnostica con precisión, pero **el código ya pasó por delante**: ROUTE con fragmentos,
ledger pre-envío, idempotencia real auditada, STATUS de todos los SENT, RECONCILE scopeado,
auditoría de UNCERTAIN, resolución de UNCERTAIN y correctivo hijo — **todo implementado y verde**.
El reproceso correctivo bancario ya cubre el ciclo completo de forma gobernada, idempotente y
conciliable, sin caminos legacy. El único pendiente es cosmético/UX (estados de sincronización
separados), no de seguridad ni de corrección.
