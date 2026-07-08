# PAY directo por lista — visibilidad del dispatch atascado (D1)

**Fecha:** 2026-07-08
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Alcance:** item D1 (visibilidad del ledger `mt101_pay_dispatch_intent`), validado con doble-check contra código real.

## Hallazgo (confirmado en el doble-check)

El camino **PAY directo por lista** (`MT101_BUILD/SPLIT → MT101_PAY` sobre lista en memoria,
`Mt101PayTaskProvider` rama `else`, `durableIntent=true`) reclama `mt101_pay_dispatch_intent` antes de enviar. Un
dispatch que queda `UNCERTAIN` (o `DISPATCHING` colgado por un crash pre-resultado) **bloquea el reenvío del pago
"hasta conciliar"** — comportamiento de seguridad correcto (no doble-pago). Pero ese estado era **invisible**: solo
5 archivos tocaban la tabla (store, 2 tests, migración V87, un doc); ningún lector de conciliación, scheduler ni
endpoint. A diferencia del camino de fragmentos (items 1-4), esos pagos **no** están en `mt101_build_fragment`
(se leen de `taskOutputs` en memoria), así que `resolveNormalPay` no los ve: el intent-ledger es su único registro
durable.

**Severidad recalibrada (doble-check):** no es P0 (la seguridad funciona, bloquea antes que reenviar). Es un gap de
**recuperación/observabilidad**: baja frecuencia (nace de una falla ambigua de transporte en ruta de lista) pero
irrecuperable e invisible cuando ocurre. D1 cierra la **visibilidad**; la reconciliación automática (D2) queda
pendiente y condicionada (requiere el salto `process_execution_id → task_definition_id` de MT101_STATUS, no verificado).

## Cambio (SOLID, espejo de item 3)

- **Store** (`Mt101PayDispatchIntentStore`, dueño del SQL — SRP): lectores `statusCounts()`, `stuckIntents(limit)`,
  `stuckIntentCount()` + records `StatusCount` / `DispatchIntentRow`. "Atascado" = `UNCERTAIN` ∪ `DISPATCHING`.
- **Servicio** thin `Mt101PayDispatchIntentLookupService` (seam DIP, acota `limit` a [1,1000]): delega en el store.
- **Resource** `Mt101PayDispatchIntentLookupResource` (`/api/query/mt101-pay-dispatch-intents`): `GET /summary`
  (total + `byStatus` + `stuck`) y `GET /stuck` (lista, más antiguos primero). Auth-gated con los mismos 5 roles que
  el lookup de fragmentos.
- **Frontend**: modelos `Mt101PayDispatchSummary`/`Mt101PayDispatchIntent`, métodos en `AuditApiService`, componente
  dedicado `mt101-pay-dispatch` (ruta `/audit/mt101-pay-dispatch` + entrada de workspace) con card (total/atascados +
  desglose por estado), **alerta** cuando `stuck > 0`, y tabla de intenciones atascadas con su motivo. i18n en/es.

## Pruebas (evidencia)

### Backend (Testcontainers, Postgres real)

| Suite | Resultado | Qué prueba |
|---|---|---|
| `Mt101PayDispatchIntentStoreIT` | **8 / 0 / 0** (5 previos + 3 nuevos) | lectores: atascados = UNCERTAIN+DISPATCHING (no terminales), motivo/execId presentes, `statusCounts` cubre todo el ledger, `limit` acota pero el conteo es exacto, `process_execution_id` NULL → null (ver doble-check E2E) |
| `Mt101PayDispatchIntentLookupIT` | **1 / 0 / 0** | E2E REST `/summary` (total=3, stuck=2, byStatus) + `/stuck` (excluye SENT, lista el motivo) con rol `payments-operator` |

### Frontend

| Suite | Resultado | Qué prueba |
|---|---|---|
| `web` (vitest) | **513 / 0 (104 archivos)** | 511 previos + 2 specs nuevos del componente (carga en init, desglose por estado, vacío sin error); paridad i18n en/es (17 claves `audit.payDispatch.*` + workspace/breadcrumb) |
| lint `feature-audit` + `core-i18n` | OK | typecheck limpio |
| `nx build web` (AOT prod) | OK | build de producción limpio (sin budgets excedidos) |

### Verificación en vivo (`localhost:8080`)

- App UP (health 200), login sirve (`/` → 200).
- Endpoints nuevos registrados y auth-gated: `/summary` y `/stuck` → **401** sin rol.

## Resumen

D1 hace observable el atasco del PAY por lista end-to-end: **8** tests backend + **513** frontend, 0 fallos, build
prod limpio. Sin migración (reusa V87). Sin fallback silencioso: los estados terminales no aparecen como atascados;
solo `UNCERTAIN`/`DISPATCHING`. La reconciliación automática (**D2**) queda documentada como pendiente condicionado.
