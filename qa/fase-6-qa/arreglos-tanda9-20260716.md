# Tanda-9 — gobierno/UX del maker-checker (v71) — 2026-07-16

Cierra los hallazgos de código de la [v71](analisis-v71-y-plan-tanda9-20260716.md): **C** (trama SUPERSEDED),
**D** (settings fail-closed) y **B** (segregación por rol, Opción A). Ninguno es money-safety; suben el listón de
gobierno/UX hacia homologación. Regla aplicada: sin caminos legacy/fallback; lo implementado se valida con tests.

## C — trama append-only PAY_CONFLICT_ACK_SUPERSEDED

**Problema (v71):** al re-solicitar, la solicitud PENDING previa quedaba `SUPERSEDED` en tabla pero **sin** trama
append-only. Existían `PAY_CONFLICT_ACK_REQUESTED` y `PAY_CONFLICT_RESOLVED`, no la del reemplazo.

**Solución:** `Mt101PayConflictAudit.supersededEnvelope(...)` (stage `PAY_CONFLICT_ACK_SUPERSEDED`) con
`supersededMaker`, `supersededReason`, `supersededTicketRef`, `newMaker`. En `requestAcknowledge` se lee el PENDING
previo **antes** de superseder y, **solo si existía**, se emite la trama en la MISMA transacción que el nuevo
`PAY_CONFLICT_ACK_REQUESTED`. Auditoría fina: cuándo y por quién fue reemplazada una solicitud.

## D — settings maker-checker fail-closed

**Problema (v71):** si `/pay-conflicts/settings` fallaba, la UI caía a `OFF` (flujo single-actor). El backend igual
protege (400), pero para banca es mejor **fail-closed**.

**Solución:** `makerCheckerState` ahora es `LOADING | OFF | ON | ERROR`. En error → `ERROR`: el panel **bloquea**
todas las acciones de acknowledge y muestra "No se pudo confirmar la política…" con botón **Reintentar**
(`retrySettings()`). Trade-off aceptado: si maker-checker está OFF y settings falla, se bloquea el acknowledge
legítimo hasta reintentar (fail-closed a propósito).

## B — segregación por ROL (Opción A: roles dedicados maker/checker)

**Problema (v71):** los 3 endpoints ack compartían `{PLATFORM_ADMIN, INTEGRATION_ADMIN, PAYMENTS_OPERATOR}` → la
segregación era **solo por identidad** (maker≠checker), no por rol.

**Solución (Opción A):**
- `PlatformRoles`: nuevos `pay-conflict-maker` y `pay-conflict-checker`.
- `request-acknowledge` → `@RolesAllowed({PAY_CONFLICT_MAKER})`; `approve-acknowledge` → `@RolesAllowed({PAY_CONFLICT_CHECKER})`.
  El `acknowledge` single-actor (maker-checker OFF) mantiene los roles operativos. **El platform-admin ya NO queda
  implícitamente autorizado** en los endpoints maker-checker: se asigna el rol explícitamente (SoD estricta).
- Doble barrera: **rol** (maker≠checker) **+ identidad** (checker≠maker) — no se relaja la identidad.
- Realm Keycloak (`keycloak/…realm.json` + `ops/…/int/keycloak/…realm.json`): roles + 2 usuarios fixture demo
  `pay-maker`/`pay-checker` para demostrar four-eyes en el lab.
- Frontend: la consola ofrece "Solicitar" solo con rol maker, "Aprobar" solo con rol checker (+ el disable por
  identidad existente); si el usuario no tiene ninguno, lo explica (evita mostrar un botón que daría 403).

> **Cambio de comportamiento (documentado):** en prod bancaria (maker-checker ON) los endpoints request/approve ya
> **no** aceptan platform-admin/payments-operator por sí solos — requieren los roles dedicados. Asignarlos en el IdP.

## Evidencia de tests

| Suite | Resultado |
|---|---|
| `Mt101PayConflictMakerCheckerIT` | **13/13** — +1 (C): la 1ª solicitud no emite SUPERSEDED; la 2ª sí, y nombra al maker reemplazado |
| `Mt101OpenPayConflictsConsoleIT` | **14/14** — +5 (B, RBAC HTTP): maker pasa request-gate; checker→request 403; operator→request 403; checker pasa approve-gate; maker→approve 403 |

Frontend: `lint feature-audit` OK; `nx build web` (strictTemplates) — ver corrida.

## No-código (operacional/evidencia) — de la v71, no en tanda-9
- **A** dos réplicas reales + caída de nodo · **E** banco-a-banco real → [checklist UAT](uat-banco-a-banco-checklist.md).
- Métricas operativas del 1M (GC/PG wait events/CPU-IO/throughput) → enriquecer una próxima corrida.
- `require-normal-pay-resolver` inline → decisión de ambiente, ya configurable (#10).
