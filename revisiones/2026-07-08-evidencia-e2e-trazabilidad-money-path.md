# Evidencia E2E — bloque de trazabilidad money-path (items 1+2+3)

**Fecha:** 2026-07-08 01:24 · **Entorno:** JDK 25.0.2 LTS (Temurin), Postgres 16 (Testcontainers) / integration_hub
(dev), Quarkus 3.33.2 · **Rama:** `feat/pay-normal-symmetric-terminal-resolution`

## Doble-check de la implementación (re-verificado contra el código)

1. **Item 1 — `inTransaction` correcto**: `getAutoCommit()` → `setAutoCommit(false)` → `commit()` en éxito /
   `rollback()` en `SQLException` / `setAutoCommit(previousAutoCommit)` en `finally`
   (`Mt101PayUncertainResolutionService.java:293-303`). `resolvePayStatus` + `insertConfirmations` usan la **misma
   conexión** (pasada por `inTransaction`) → un fallo de la confirmación revierte el update. Las consultas STATUS
   externas quedan FUERA de la tx (correcto). Se eliminó el `persistConfirmations` autocommit (sin camino legacy).
2. **Item 2 — orden de emisión seguro**: la trama `PAY_CONFLICT` se emite **después** de que la tx commitea
   (`markPayConflict` + confirmación durables); si la tx hace rollback, la trama NO se emite (la excepción propaga
   antes). El factory `Mt101PayConflictAudit` es la fuente única (worker + STATUS), sin duplicación.
3. **Item 3 — queries correctas**: `conflictedFragments`/`payConflictCount` filtran `coalesce(pay_conflict,false)=true`.
   El endpoint `/pay-conflicts` está auth-gated (RolesAllowed); `/summary` añade `conflicts` sin romper el shape.

No se encontraron defectos en el re-análisis.

## Pruebas E2E ejecutadas (evidencia)

### Money-path (Testcontainers + WireMock, BD real)

| Suite | Resultado | Qué prueba del bloque |
|---|---|---|
| `Mt101PayUncertainResolutionServiceTest` | **7 / 0 / 0** | item 1 (atomicidad: confirmation-fail → rollback), item 2 (trama `PAY_CONFLICT` `source=STATUS` + actor) |
| `Mt101PayNormalDurableTest` | **6 / 0 / 0** | worker-side vía factory + item 3 (repo `conflictedFragments`/`payConflictCount`) |
| `Mt101CorrectiveLifecycleServiceTest` | **62 / 0 / 0** | correctivo sin regresión |
| `Mt101PayFragmentReprocessTest` | **35 / 0 / 0** | reprocess sin regresión |
| `Mt101StatusTaskProviderTest` | **20 / 0 / 0** | STATUS sin regresión |
| **Total money-path (todas las clases Mt101\*)** | **170 / 0 / 0** | sin regresión global |

### E2E REST (item 3 — stack completo JAX-RS → servicio → repo → BD)

| Suite (`@QuarkusTest` + `@TestSecurity`) | Resultado | Qué prueba |
|---|---|---|
| `Mt101FragmentConflictLookupIT` | **1 / 0 / 0** | `GET /api/query/mt101-fragments/summary` → `conflicts=1`, `total=2`; `GET /api/query/mt101-fragments/pay-conflicts` → lista `K1` (`SENT`) con motivo `…REJECTED…`; con rol `payments-operator` |

### Frontend (vitest, suite completa)

| Suite | Resultado | Qué prueba |
|---|---|---|
| `web` (vitest) | **511 / 0 (103 archivos)** | paridad i18n en/es (keys `cardConflicts`/`conflictAlert`) + componente `mt101-quarantine` |
| lint `core-i18n` + `feature-audit` | OK | typecheck limpio |
| `nx build web` (AOT prod) | OK | build de producción limpio (bundle + budgets) |

### Verificación en vivo (`localhost:8080`)

- App UP (health 200, Flyway 89 migraciones, features incl. quinoa); frontend/login sirve (`/` → 200, `<app-root>`).
- Endpoints nuevos registrados y auth-gated: `/pay-conflicts` y `/summary` → **401** sin rol.

## Resumen

Bloque 1+2+3 implementado y verificado end-to-end: **170** tests money-path + **1** E2E REST + **511** frontend,
0 fallos. Sin migración, sin fallback silencioso. La atomicidad elimina el estado inconsistente, la trama
append-only hace el conflicto conciliable desde ambos lados (worker/STATUS), y API+UI lo hacen visible al operador.
