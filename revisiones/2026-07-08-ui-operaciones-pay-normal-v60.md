# UI de operaciones del PAY normal (v60) — cerrar el endpoint huérfano de conflictos + resolve manual

**Fecha:** 2026-07-08
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Alcance:** completar el frontend de operaciones del PAY normal (validado con doble-check contra código real).

## Hallazgo (doble-check del análisis app_htoh 60)

El doble-check reveló que el backend de operaciones del PAY normal estaba **construido y testeado pero sin consumir**:

| Backend (existe + testeado) | Frontend (antes) |
|---|---|
| `GET /api/query/mt101-fragments/pay-conflicts` (lista con :20:/estado/motivo/fecha) | **huérfano**: `Mt101PayConflict` definido pero usado en NINGÚN lado; sin método API, sin vista |
| `POST /api/query/mt101-quarantine/rebuild-runs/resolve-uncertain-normal-pay` (resolución manual gobernada) | **no cableado**: la UI solo tenía el resolve **correctivo** |
| Conteo `conflicts` en `/summary` | solo card + alerta |

Es decir: el operador **veía** que había N conflictos, pero **no podía listarlos ni actuar** sobre el PAY normal desde
la UI. También se corrigió el análisis original: el UNCERTAIN normal **no** quedaba "en silencio" — el endpoint de
resolución manual ya existía; solo faltaba exponerlo.

## Cambio (SOLID, frontend-only — sin fallback, cero riesgo backend)

- **API client** (`AuditApiService`): `mt101PayConflicts(...)` (consume `/pay-conflicts`) y
  `mt101ResolveUncertainNormalPay(...)` (consume `/resolve-uncertain-normal-pay`, `reason` obligatorio).
- **Modelo**: `Mt101NormalPayResolution` (resultado del resolve); `Mt101PayConflict` (ya existía) ahora **sí** se usa.
- **Componente `mt101-quarantine`** (hogar cohesivo: ya tenía el conteo + el resolve correctivo):
  - **Lista detallada** de conflictos on-demand desde la alerta (botón "Ver conflictos" → tabla :20:/estado/motivo/
    fecha).
  - **Acción gobernada "Resolver incierto (normal)"**: gateada por `canAuditOperate`, motivo obligatorio (reutiliza
    `payResolutionReason`), consulta STATUS (nunca reenvía), y muestra el desglose (sent/rejected/pending/conflicts).
    Recarga lista + conflictos.
- **i18n en/es** (paridad): claves `audit.quarantine.conflicts*`, `col.reason/updated`, `normalPay*` (reusa
  `col.status`/`payResolutionReason` existentes).

## Pruebas (evidencia)

| Suite | Resultado | Qué prueba |
|---|---|---|
| `web` (vitest) | **520 / 0 (104 archivos)** | 516 previos + 4 nuevos del bloque: `loadPayConflicts` puebla la lista; `resolveNormalUncertainPay` exige motivo (sin motivo → no llama + error), llama con motivo y muestra resultado, y respeta la capacidad; paridad i18n en/es |
| lint `feature-audit` + `core-i18n` | OK | typecheck limpio (deduplicó `col.status` preexistente) |
| `nx build web` (AOT prod) | OK | build de producción limpio, **sin budgets excedidos** (se reusó `.q__actions` en vez de clases nuevas) |
| Backend consumido | ya E2E-testeado | `/pay-conflicts` (`Mt101FragmentConflictLookupIT`) y `resolveUncertainNormalPay` (`Mt101PayUncertainResolutionServiceTest`) verdes en trabajo previo |

## Doble-check + E2E (evidencia)

1. **Contrato backend↔frontend verificado campo a campo** (lo crítico en un cambio de wiring — un desajuste de nombres
   rompería la UI en silencio):
   - `PayConflictRow(sendersReference, status, reason, updatedAt)` ↔ `Mt101PayConflict{sendersReference, status,
     reason, updatedAt}` — **exacto**.
   - `NormalPayResolution(resolvedSent, resolvedRejected, stillPending, gatewayErrors, conflicts)` ↔
     `Mt101NormalPayResolution{...}` — **exacto**.
2. **Backend re-corrido** (los endpoints que consume la UI): `Mt101FragmentConflictLookupIT` **1/1** +
   `Mt101PayUncertainResolutionServiceTest` **7/7** = **8/8**, BUILD SUCCESS.
3. **En vivo** (`localhost:8080`, app reiniciada con el frontend nuevo): health 200, `/` (login) 200;
   `GET /pay-conflicts` → **401** y `POST /resolve-uncertain-normal-pay` → **401** sin rol (registrados + gated).

## Resumen

El endpoint de conflictos dejó de ser código muerto y el resolve manual del UNCERTAIN normal ya es accionable desde la
UI, espejo de lo que el correctivo tenía. **Sin camino legacy ni fallback**: puro wiring de endpoints existentes y
probados, con contrato verificado end-to-end. Cierra el item 3 (visibilidad) del lado operativo.
