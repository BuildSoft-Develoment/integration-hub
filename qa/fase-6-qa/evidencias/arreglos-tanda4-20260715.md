# Evidencia tanda-4 — simetría de transportFailure en PAY normal y por lista — 2026-07-15

Autorizado: **#7 Opción A** + **#8 Opción 8a**. Cierra los dos hallazgos nuevos de la v67 (verificados contra
el código real y con doble check). Regla respetada: sin caminos legacy/fallback; el camino por lista **no** se
elimina (es funcional, direct-pay), se **alinea**.

## #7 — PAY normal + transportFailure ya no deja el fragmento en DISPATCHING

**Bug:** en el flujo normal persistido, `claimForDispatch` mueve el fragmento `ARCHIVED→DISPATCHING`; ante un
`transportFailure` (pre-despacho, nada salió al banco) el ref no entraba en `sentRefs/rejectedByRef/uncertainRefs`,
así que `finalizeNormalGuarded` no lo tocaba → quedaba **atascado en DISPATCHING**. Como PAY solo lee `ARCHIVED`
y `DISPATCHING` **bloquea el cierre de conciliación**, era un dead-end sin ruta de re-solicitud.

**Fix (Opción A):** los refs `retriable` del flujo normal se recolectan (`invalidatedByRef`) y se **revierten
`DISPATCHING→ARCHIVED`** en `finalizeNormalGuarded`, con transición **guardada** (solo-desde-DISPATCHING: si un
STATUS/RECONCILE tardío ya lo resolvió, no se pisa). Money-safe: `retriable ⟺ pre-despacho`, nada salió → re-pago
sin doble pago. La auditoría ya emitía `RECORD_INVALIDATED`. Corregido el comentario que afirmaba (falsamente
para el normal) que quedaba ARCHIVED.

Archivos: `Mt101PayTaskProvider.java` (`dispatchFragmentPage`, `finalizeNormalGuarded`).

## #8a — camino por lista: transportFailure → INVALIDATED, no REJECTED

**Bug:** el camino por lista (in-memory, direct-pay) mapeaba `transportFailure` a `REJECTED` en dos sitios:
`intentStatus()` (intent ledger) y el `else` que sincronizaba `mt101_archive` a `REJECTED` — pintando un fallo
técnico pre-despacho como rechazo de negocio del banco.

**Fix (8a):**
- `intentStatus(retriable)` → **`INVALIDATED`**.
- El intent store re-reclama ahora `status in ('REJECTED','INVALIDATED')` (`ON CONFLICT`): ambos son "probado
  que no salió", re-solicitables. Sin esto, `INVALIDATED` habría **bloqueado** el re-request (caía a `IN_FLIGHT`).
  Sin migración: `status` es `varchar(20)` sin CHECK.
- En el camino por lista, `retriable` se trata como `uncertain` (no se sincroniza archive a REJECTED).

Archivos: `Mt101PayTaskProvider.java` (`intentStatus`, camino por lista), `Mt101PayDispatchIntentStore.java`
(`claimForDispatch` ON CONFLICT).

> Nota (del doble check): el camino por lista **se mantiene** — es un modo de pago funcional (build en memoria →
> pay, con re-request-safety por intent), no un fallback legacy. La regla "sin caminos legacy" apunta a fallbacks
> riesgosos/duplicados muertos, no a un modo de pago legítimo.

## Validación (Testcontainers Postgres + IT, todo verde)

| Clase | Resultado | Qué valida |
|---|---|---|
| `Mt101PayNormalDurableTest` | **7/7** (+1 nuevo) | #7: transportFailure → fragmento vuelve a ARCHIVED, re-pagable, sin doble pago |
| `Mt101PayDirectListDurableTest` | **5/5** (+1 nuevo) | #8a: retriable → intent INVALIDATED (no REJECTED), re-reclamado y re-pagado |
| `Mt101PayDispatchIntentStoreIT` | **16/16** (+1 nuevo) | #8a: re-claim desde INVALIDATED (ON CONFLICT) |
| `Mt101PayTaskProviderTest` | **14/14** | Regresión: sin cambios de comportamiento del pay task |
| `Mt101CorrectiveLifecycleServiceTest` | **62/62** | Regresión: el money-path correctivo intacto |

Tests nuevos: `transportFailurePreDispatchRevertsFragmentToArchivedAndIsRepayable`,
`transportFailureOnDirectListRecordsInvalidatedIntentNotRejectedAndIsRepayable`,
`reRequestAfterInvalidatedIsAllowed`.

## Propiedad crítica

Cero doble pago confirmado en ambos caminos: el re-pago tras un transportFailure re-despacha **exactamente** el
fragmento/mensaje que no salió (los ya SENT se bloquean por claim/intent). `retriable ⟺ pre-despacho` sostiene la
seguridad: nada se reenvía que pudiera haber llegado al banco.
