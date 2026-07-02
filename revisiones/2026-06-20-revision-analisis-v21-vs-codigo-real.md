# Revisión del análisis v21 (app_htoh(21)) contra el código real

Fecha: 2026-06-20
Alcance: verificar los 4 P0 + P1 del v21 (ledger completo vs muestra, error post-dispatch,
ROUTE ejecutable, snapshot de destino/config) contra el **código actual**.
Directiva: sin código fallback / sin caminos legacy.

## Veredicto general

El v21 es el análisis **más certero** hasta ahora: a diferencia del v19/v20 (que revisaban
snapshots ya superados), **dos de sus P0 eran bugs REALES y abiertos** en el código actual —
incluido el crítico de **pérdida de fragmentos inciertos fuera de la muestra**. Se
implementaron y se evidencian con pruebas. Los otros dos P0 (ROUTE ejecutable y snapshot de
config) son **features mayores** y quedan documentados como siguiente trabajo.

| # | Hallazgo v21 | Veredicto | Acción |
|---|---|---|---|
| P0.1 | PAY_UNCERTAIN pierde fragmentos fuera de la muestra | **REAL → CORREGIDO** | El PAY persiste el resultado **por fragmento de toda la página** (`Mt101CorrectivePayStore.markResults` + `persistCorrectiveLedger`), no la muestra acotada; y `refreshPayFragmentsFromCorrectiveSet` ya **no clobbea** DISPATCHING/SENT/REJECTED/UNCERTAIN. Test `correctivePayPersistsEveryFragmentResultNotJustTheOutputSample` (5 inciertos, muestra=2 → 5 UNCERTAIN en el ledger) |
| P0.2 | Excepción tras envío marca FAILED reusable (doble pago) | **REAL → CORREGIDO** | El catch consulta `hasDispatchedPayFragments`: si hubo dispatch (DISPATCHING/SENT/UNCERTAIN) marca **UNCERTAIN**, nunca FAILED. Test `payFailureAfterDispatchBecomesUncertainNotReusableFailed` |
| P0.3 | ROUTE persiste `routed_as` pero PAY no lo consume | **ABIERTO (feature)** | Hoy ARCHIVE/PAY leen el set por estado y PAY usa `configuration.transport` para todos; ROUTE es decisión **auditada**, no ejecutable. Cierre = selección de transporte por fragmento desde el ledger. Documentado |
| P0.4 | PAY congela payload, no destino/config | **ABIERTO (feature)** | `pay_requested_payload_hash` se congela; transport/endpoint/idempotency-template/config no. Cierre = `config_hash` congelado en `requestPay` + invalidación si cambia. Documentado |
| P1 | Resolución incierta no usa post-PAY seguro | **Parcial** | `resolveUncertainPay` ya consulta `UNCERTAIN` **+ `DISPATCHING`** (corregido); aún usa `runOptionalStageWithInput` para el RECONCILE final (menor; debería reusar `runPostPaySync`) |
| P1 | El refresh no debe sobrescribir estados terminales/inciertos | **CORREGIDO** | `refresh` con `where pay_status not in ('DISPATCHING','SENT','REJECTED','UNCERTAIN')` |
| P1 | STATUS debe resolver también DISPATCHING | **CORREGIDO** | `resolveUncertainPay` incluye `DISPATCHING` en `correctivePayStatuses` |

---

## Detalle de lo corregido en este pase

### P0.1 — ledger completo, no muestra (bug crítico)
**Causa raíz confirmada:** `persistPayDetail` llamaba `refreshPayFragmentsFromCorrectiveSet`
**después** del dispatch, y el `on conflict do update set pay_status = excluded` traía el estado
de `mt101_build_fragment` (donde un fragmento incierto queda `ARCHIVED`, porque el branch
incierto no lo marca). Eso **clobbeaba** los `DISPATCHING` a `ARCHIVED`. Luego el ledger solo se
completaba con la **muestra** (`records`/`errors`/`uncertain`, acotada a `maxRecordsInOutput`).
Resultado: con 20.000 fragmentos y 5.000 inciertos, solo ~1.000 quedaban `UNCERTAIN`; los ~4.000
restantes volvían a `ARCHIVED` y `resolveUncertainPay` (que consulta `pay_status` en
UNCERTAIN/DISPATCHING) **nunca los veía**.

**Fix:**
1. `Mt101PayTaskProvider` acumula el resultado real **por fragmento de cada página**
   (SENT/REJECTED/UNCERTAIN + gateway_reference + attempts + error) y lo persiste con
   `Mt101CorrectivePayStore.markResults(...)` → `updatePayFragmentResults` (O(pageSize) memoria,
   durable para los 20.000). El output sigue acotado a la muestra; el **ledger es la fuente de
   verdad**.
2. `refreshPayFragmentsFromCorrectiveSet` preserva DISPATCHING/SENT/REJECTED/UNCERTAIN (WHERE en
   el `do update`), así no deshace lo que el PAY persistió.

### P0.2 — error post-dispatch nunca FAILED reusable
El catch de `approveAndPayCorrective` hacía `markPayFailed` incondicional. Si el gateway aceptó
y luego falló la persistencia local, el run quedaba `FAILED` (y FAILED permite re-solicitar PAY →
doble pago). **Fix:** el catch consulta `hasDispatchedPayFragments`; si hubo dispatch, marca
`UNCERTAIN` (run + fragmentos), nunca FAILED.

### P1 — refresh-preserve, STATUS resuelve DISPATCHING
Cubiertos arriba: `refresh` preserva estados en vuelo/terminales y `resolveUncertainPay` incluye
`DISPATCHING` además de `UNCERTAIN` (nunca reenvía a ciegas; consulta STATUS).

---

## Pruebas que evidencian el cierre (todas en verde)

- `Mt101PayFragmentReprocessTest` (4): incluye `correctivePayPersistsEveryFragmentResultNotJustTheOutputSample`
  (5 inciertos, `maxRecordsInOutput=2` → **5 UNCERTAIN en el ledger**, muestra=2) y la actualización
  del test de DISPATCHING (el provider ahora persiste el resultado real por fragmento).
- `Mt101CorrectiveLifecycleServiceTest` (12): incluye `payFailureAfterDispatchBecomesUncertainNotReusableFailed`
  (fallo tras dispatch → run + fragmento `UNCERTAIN`, no FAILED).
- Backend swift en este run: **247** tests, 0 fallos.

## Lo que queda abierto (features, documentado para autorización)

**P0.3 — ROUTE ejecutable.** Persistir la decisión efectiva por fragmento
(`routed_as`/`transport`/`endpoint_ref`/`connection_ref`/`config_hash`) y que PAY seleccione el
transporte **por fragmento** desde el ledger (R1→REST, R2→SFTP). Un fragmento con `route_error`
o `UNROUTED` no debe archivarse ni enviarse. Es un cambio de diseño en ARCHIVE/PAY (hoy usan un
único `configuration.transport`).

**P0.4 — snapshot de destino/config aprobado.** Congelar en `requestPay` también
`transport`/`endpoint_ref`/`connection_ref`/`idempotency`/`config_hash` (no solo el payload), y
en la aprobación invalidar (`PAY_INVALIDATED`) si el `config_hash` cambió. Hoy solo se congela el
payload.

**P1 menor.** `resolveUncertainPay` debería reusar `runPostPaySync` para el RECONCILE final (que
un fallo de RECONCILE tras resolver no lance al operador, igual que en el PAY normal).

## Conclusión

El v21 acertó donde el código aún tenía deuda real: **se cerraron los dos P0 críticos de
seguridad de dinero** (no perder fragmentos inciertos; no marcar FAILED reusable tras un envío),
con pruebas que lo evidencian. Quedan como features acotadas la **ruta ejecutable por fragmento**
(P0.3) y el **snapshot de destino/config** (P0.4), documentadas para tu autorización. La
trazabilidad de una fila dentro de un millón y la evidencia durable por fragmento antes/durante
el contacto con el banco ya son sólidas.
