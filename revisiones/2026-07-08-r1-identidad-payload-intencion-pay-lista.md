# R1 — Identidad de payload en la intención de dispatch del PAY por lista

**Fecha:** 2026-07-08
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Origen:** análisis "PAY por lista como money-path" (validado contra código real).
**Regla aplicada:** sin código fallback / sin camino legacy — se **endurece el único path**, no se ramifica por bandera.

## Hueco cerrado (único de correctitud del análisis)

El ledger `mt101_pay_dispatch_intent` (V87) reclamaba por `dispatch_key = transport|connectionRef|correlationKey`
(la idempotency key del banco). Un re-request bajo la MISMA clave se reportaba `ALREADY_SENT` **sin comparar el
payload** ([Mt101PayTaskProvider:588](../platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101PayTaskProvider.java)):
si dos pagos DISTINTOS resolvían la misma clave (p.ej. `:20:` reutilizado con otro monto/beneficiario), **el segundo
se silenciaba** (`accepted`) sin enviarse. Nunca duplica pago, pero podía callar uno válido.

**Doble-check #1:** `Mt101Message.rawPayload` es **mutable/nullable** y es EXACTAMENTE lo que envían los transportes al
banco (REST cuerpo HTTP; SFTP lanza si es null). Si `rawPayload` viniera vacío, hashear daría "hash de vacío" para
todos → seguiría silenciando. Se agrega un **guard fail-loud** para ese caso (espejo del guard de `correlationKey`
vacía).

**Doble-check #2 (defecto atrapado antes del commit):** hashear el `rawPayload` COMPLETO habría **roto la idempotencia**.
`uetrStrategy` por defecto es `perMessage` → el `UETR` se regenera con `UUID.randomUUID()` en cada build
([Mt101BuildTaskProvider:254-256](../platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101BuildTaskProvider.java)),
y es el **único** campo volátil del payload (los 3 formatters —FIN/JSON/XML— solo inyectan `uetr`; sin timestamps ni
otros random). Un re-request legítimo del MISMO pago (mismo `:20:`, mismo negocio) tendría otro `UETR` → otro hash →
**falso `CONFLICT`** en cada reintento. **Fix:** la identidad **neutraliza el `UETR`** antes de hashear: estable entre
rebuilds del mismo pago, sensible a cualquier diferencia material (monto/beneficiario/cuenta). El fallo seguro sigue
siendo hacia conflicto, nunca hacia silenciar.

## Cambio (SOLID, sin bandera)

- **V91** (`mt101_pay_dispatch_intent_payload_identity.sql`): `add column payload_hash varchar(64)`.
- **`Mt101PayDispatchIntentStore.claimForDispatch(dispatchKey, peId, ref, payloadHash)`**: `payloadHash` obligatorio
  (invariante: sin identidad no se crea intención); se fija al reclamar (`insert ... payload_hash`, y en el re-claim
  desde `REJECTED` se sobrescribe con `excluded.payload_hash`). En un claim bloqueado compara el persistido vs el
  actual y clasifica:
  - `SENT` + mismo hash → `ALREADY_SENT` (idempotente, **probado** no inferido);
  - `SENT` + hash distinto → **`ALREADY_SENT_CONFLICT`** (otro pago colisionando: NO aceptar);
  - `UNCERTAIN` + mismo/distinto → `ALREADY_UNCERTAIN` / **`ALREADY_UNCERTAIN_CONFLICT`**;
  - `payload_hash` persistido NULL (fila previa a la identidad) → no se puede probar igual → conflicto seguro.
- **`Mt101PayTaskProvider.dispatchWithDurableIntent`**: guard fail-loud si `rawPayload` vacío (rechazo, no se envía);
  computa `payloadHash` (reusa el mismo SHA-256 del correctivo) y lo pasa al claim. Los resultados `*_CONFLICT` se
  clasifican **INCIERTO** (no tocan `mt101_archive`, no-éxito, exigen conciliar la colisión); **nunca** `accepted`
  (no silencian) ni `rejected` reusable (no corrompen el archive del pago original ya enviado).

## Por qué INCIERTO y no REJECTED para el conflicto

`REJECTED` en el camino de lista sincroniza `mt101_archive` a REJECTED — corromperia el estado del pago original que
SÍ salió bajo esa clave. `UNCERTAIN` no sincroniza archive, bloquea, es no-éxito y es visible en la consola de
intenciones atascadas (D1) → clasificación segura para forzar conciliación humana de la colisión de clave.

## Pruebas (evidencia)

| Suite | Resultado | Qué prueba |
|---|---|---|
| `Mt101PayDispatchIntentStoreIT` | **15 / 0 / 0** | +4 R1: `SENT`+payload distinto → `ALREADY_SENT_CONFLICT`; `UNCERTAIN`+distinto → `ALREADY_UNCERTAIN_CONFLICT`; mismo payload → `ALREADY_SENT` idempotente; `payloadHash` en blanco → rechazo (no crea fila) |
| `Mt101PayDirectListDurableTest` | **4 / 0 / 0** | +2 E2E provider: (a) 2º pago con MISMA ref y payload DISTINTO → **0 envíos**, no-éxito, original `SENT`; (b) mismo pago con **UETR regenerado** → sigue idempotente (0 envíos, éxito), no falso conflicto |
| `Mt101PayFragmentReprocessTest` | **35 / 0 / 0** | camino persistido/correctivo sin regresión (no pasa por `durableIntent`) |
| `Mt101PayNormalDurableTest` | **6 / 0 / 0** | PAY normal durable sin regresión |
| `Mt101PayTaskProviderTest` | **13 / 0 / 0** | provider sin regresión |
| `Mt101CorrectiveLifecycleServiceTest` | **62 / 0 / 0** | correctivo (maker-checker/plan inmutable) sin regresión |
| `RestPaymentTransportTest` / `SftpPaymentTransportTest` | **15 / 13** | transportes sin regresión |
| `Mt101PayUncertainResolutionServiceTest` | **7 / 0 / 0** | resolución UNCERTAIN sin regresión |
| Flyway | **91 migraciones OK** | V91 aplica limpio sobre Postgres real |

## Alcance / descartado (coherente con la regla)

- **Descartado** `allowDirectListPay = dev|test` — es exactamente el camino legacy con bandera que la regla prohíbe.
- **Descartado / diferido** maker-checker, plan inmutable, query STATUS directa al gateway y lineage completo para la
  lista: **duplican el camino correctivo/persistido**. La respuesta arquitectónica es usar fragmentos persistidos para
  dinero real/masivo (spec T-036/T-053); la lista queda para lotes chicos/rescate, ahora **con identidad probada**.
- **No abordado (borde):** una trama `PAY_CONFLICT` append-only dedicada para la colisión de intención (hoy la
  colisión es INCIERTA + visible en D1 con motivo explícito). Anotado como posible mejora, no de correctitud.
