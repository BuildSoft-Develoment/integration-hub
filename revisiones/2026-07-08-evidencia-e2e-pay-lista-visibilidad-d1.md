# Evidencia E2E — visibilidad del dispatch por lista (D1)

**Fecha:** 2026-07-08 · **Entorno:** JDK 25.0.2 LTS (Temurin), Postgres 16 (Testcontainers) / integration_hub (dev),
Quarkus dev · **Rama:** `feat/pay-normal-symmetric-terminal-resolution`

## Doble-check de la implementación (re-verificado contra el código)

### Defecto encontrado y corregido — `wasNull()` sobre la columna equivocada

En `Mt101PayDispatchIntentStore.stuckIntents`, el mapeo de fila hacía:

```java
var peId = rs.getLong("process_execution_id");
new DispatchIntentRow(
    rs.getString("dispatch_key"),   // ← se evalúa PRIMERO (args L→R)
    rs.wasNull() ? null : peId,     // ← wasNull() ya refleja dispatch_key, no process_execution_id
    ...);
```

Los argumentos del constructor se evalúan **izquierda→derecha**: `rs.getString("dispatch_key")` corría antes que
`rs.wasNull()`, así que `wasNull()` reflejaba `dispatch_key` (columna `NOT NULL` → siempre `false`). Un
`process_execution_id` **NULL** (el camino de lista puede reclamar sin ejecución) se habría serializado como **`0`**
en vez de `null`. Los tests iniciales no lo cazaban (seed con execId=1; la REST IT no asertaba ese campo).

**Fix:** capturar `rs.wasNull()` en un local inmediatamente tras el `getLong`, antes de leer otra columna; además,
leer cada `Timestamp` **una** vez (antes se llamaba `getTimestamp` dos veces por columna).

**Tests de regresión añadidos:** `stuckIntentReportsNullProcessExecutionIdAsNull` (store: reclama sin execId →
`processExecutionId()` es `null`) y aserción `processExecutionId` `nullValue()` en la REST IT (`D-UNC` sembrado sin
ejecución).

### Otros puntos re-verificados (sin defecto)

- **"Atascado" = UNCERTAIN ∪ DISPATCHING**: en un contexto de QUERY, un `DISPATCHING` que sobrevive implica que
  `recordResult` nunca corrió (el dispatch es síncrono: claim→send→recordResult en la misma ejecución) → atasco real
  por crash, no falso positivo. El operador ve la antigüedad por `updatedAt`.
- **Consistencia summary**: `stuck` (= UNCERTAIN+DISPATCHING) es coherente con `byStatus`/`total`.
- **Auth**: `/summary` y `/stuck` con `@RolesAllowed` (5 roles); en vivo → 401 sin rol.
- **Layering/CDI**: el servicio `@ApplicationScoped` inyecta el store `@ApplicationScoped` (precedente: los servicios ya
  dependen de clases del paquete `provider.task`); el arranque `@QuarkusTest` prueba el wiring.

## Pruebas E2E ejecutadas (evidencia)

### Backend (Testcontainers + Postgres real; REST vía @QuarkusTest + @TestSecurity)

| Suite | Resultado | Qué prueba |
|---|---|---|
| `Mt101PayDispatchIntentStoreIT` | **8 / 0 / 0** | claim/re-request-safety (5 previos) + lectores D1: atascados = UNCERTAIN+DISPATCHING (no terminales), `statusCounts` cubre todo, `limit` acota con conteo exacto, **`process_execution_id` NULL → null** (regresión del fix) |
| `Mt101PayDispatchIntentLookupIT` | **1 / 0 / 0** | E2E REST `/summary` (total=3, stuck=2, byStatus SENT/UNCERTAIN/DISPATCHING) + `/stuck` (excluye SENT, expone motivo, `processExecutionId` null) con rol `payments-operator` |
| `Mt101PayDirectListDurableTest` | **2 / 0 / 0** | camino de lista durable (intent) sin regresión |
| `Mt101PayTaskProviderTest` | **13 / 0 / 0** | PAY sin regresión |
| `Mt101PayNormalDurableTest` | **6 / 0 / 0** | PAY normal sin regresión |
| **Total PAY (baseline + D1)** | **29 / 0 / 0** (+ 9 re-corridos con el fix) | sin regresión; el fix valida NULL |

### Frontend (vitest, suite completa)

| Suite | Resultado | Qué prueba |
|---|---|---|
| `web` (vitest) | **513 / 0 (104 archivos)** | 511 previos + 2 specs del componente `mt101-pay-dispatch`; paridad i18n en/es (17 claves `audit.payDispatch.*` + workspace/breadcrumb) |
| lint `feature-audit` + `core-i18n` | OK | typecheck limpio |
| `nx build web` (AOT prod) | OK | build de producción limpio (sin budgets excedidos) |

### Verificación en vivo (`localhost:8080`)

- App reiniciada (quarkus:dev) sirviendo el `dist/browser` nuevo; health 200, `/` (login) 200.
- Ruta nueva `/audit/mt101-pay-dispatch` (entrada de workspace `audit`) desplegada.
- Endpoints `/api/query/mt101-pay-dispatch-intents/summary` y `/stuck` → **401** sin rol (registrado + gated).

## Resumen

Doble-check corrigió un defecto real de NULL-handling (con test de regresión) y verificó el resto sin hallazgos.
E2E: **backend 29** (incl. 9 re-corridos con el fix) + **frontend 513**, 0 fallos, build prod limpio. Sin migración
(reusa V87), sin fallback silencioso. La reconciliación automática (**D2**) queda pendiente condicionada.
