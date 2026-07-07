# Implementación — P0-1 (conflicto tardío PAY normal) y P0-2 (clave de intención vacía)

Fecha: 2026-07-07
Tipo: **implementación** (money-path). Validación de app_htoh(57) contra el código real + corrección de los dos
hallazgos confirmados como bugs activos, bajo el principio "sin fallback silencioso / sin caminos legacy".

Rama: `codex/pay-normal-conflict-and-intent-key`.

## Contexto: validación de app_htoh(57)
El análisis externo señaló 3 P0 + 2 secundarios. Validados contra el código:

| Punto | Veredicto |
|---|---|
| P0-1: resultado tardío de PAY **normal** sobrescribe STATUS terminal | **CONFIRMADO (bug activo)** → corregido |
| P0-2: clave de intención de PAY directo puede quedar vacía | **CONFIRMADO (bug activo)** → corregido |
| P0-3: async scatter/page sin claim antes del efecto | Confirmado, pero **hardening** (MT101_PAY UNSUPPORTED; sin provider batch SUPPORTED) — mismo que §5, diferido |
| Sec.: secretos resueltos antes de ganar el claim async | Confirmado, **menor** (no filtra secretos; el perdedor pega a Vault) — diferido |

## P0-1 — Resultado tardío del PAY normal sobrescribía un terminal ya resuelto

**Bug (verificado):** `Mt101PayTaskProvider` finalizaba el flujo NORMAL con `Mt101FragmentStore.markStatusBatch` →
`Mt101FragmentRepository.updateStatusBatch`, cuyo SQL era `update ... set status=? where fragment_set_id=? and
senders_reference=?` **sin guarda de estado previo**. El ledger de conflicto (`persistCorrectiveLedger`) solo corre
en el camino CORRECTIVO. Escenario: worker claima `ARCHIVED→DISPATCHING`, envía, se cuelga; STATUS/RECONCILE
resuelve `DISPATCHING→REJECTED` (guardado, vía `resolvePayStatus` con `from=[UNCERTAIN,DISPATCHING]`); el ACCEPTED
tardío del worker hacía `SENT` **sobrescribiendo REJECTED en silencio**. La asimetría: STATUS estaba guardado, el
worker no.

**Fix (espejo del PAY_CONFLICT correctivo, V58, sobre el fragmento normal):**
- **V89** (`mt101_pay_normal_fragment_conflict.sql`): columnas `pay_conflict` + `pay_conflict_reason` en
  `mt101_build_fragment`.
- `Mt101FragmentRepository.resolvePayStatusReturning` (batch y per-ref-con-error): transición terminal **GUARDADA**
  (`... and status in (DISPATCHING,UNCERTAIN) ... returning senders_reference`) → devuelve los refs que realmente
  transicionaron. + `markPayConflict` (marca durable sin tocar el status).
- `Mt101PayTaskProvider.finalizeNormalGuarded` (solo `rebuildRunId == null`): usa la transición guardada; los refs
  que NO transicionan (ya en un terminal contradictorio) se marcan `pay_conflict` y NO se propagan a `archive`.
  Fuerza conciliación, sin sobrescritura silenciosa. El camino correctivo queda intacto (rama `else`).

**Evidencia:** `Mt101PayNormalDurableTest.lateTerminalResultDoesNotOverwriteStatusAndFlagsPayConflict` — un SENT
tardío sobre un fragmento ya REJECTED NO transiciona (`updated` vacío), el fragmento **conserva REJECTED**, y queda
`pay_conflict=true`. Happy path (DISPATCHING→SENT) sigue funcionando.

## P0-2 — Clave de intención de PAY directo podía quedar vacía (silenciaba un pago)

**Bug (verificado):** en el camino de LISTA en memoria, `intentKey = transport + "|" + connectionRef + "|" +
correlationKey`; `correlationKey` puede ser `""` (REST con `idempotencyKeyTemplate` vacío, o SFTP sin
`dropPathTemplate`). `claimForDispatch` solo rechazaba una clave **totalmente** blank; `"REST|CONN|"` pasaba → dos
pagos DISTINTOS colisionaban bajo la misma clave y el segundo recibía `ALREADY_SENT`, **reportado aceptado sin
enviarse** (silenciaba un pago que nunca salió).

**Fix (fail-loud):** `Mt101PayTaskProvider.dispatchWithDurableIntent` rechaza ANTES del claim si `correlationKey`
es null/blank → `TransportResult.rejected` (re-solicitable), sin crear intención ambigua ni llamar al banco.

**Evidencia:** `Mt101PayDirectListDurableTest.emptyCorrelationKeyIsRejectedAndNeverSilencesAPayment` — con
`idempotencyKeyTemplate=""`, el pago se **rechaza** (no-éxito), `transport.calls()==0` (nunca se envía) y NO se
crea intención bajo `REST||`.

## Evidencia global
- `Mt101PayNormalDurableTest` 3/3 · `Mt101PayDirectListDurableTest` 2/2.
- Regresión PAY: `Mt101PayFragmentReprocessTest` (correctivo) **35/35**, `Mt101PayTaskProviderTest` 13/13,
  `Mt101RoutePersistedFragmentTest` 2/2, `Mt101PayDispatchIntentStoreIT` 5/5 → **55/55** (camino correctivo intacto,
  V89 aplica limpio).

## Pendiente (diferido, hardening)
- P0-3: claim en scatter/page async (= §5, sin path activo: MT101_PAY UNSUPPORTED).
- Orden de secretos en el consumer (`decode → claim → resolveSecrets`).
- Mínimo-privilegio en plugins remotos; `allSkips` por lote; evidencia fresca de 1M sobre V86/V87/V88/V89.
