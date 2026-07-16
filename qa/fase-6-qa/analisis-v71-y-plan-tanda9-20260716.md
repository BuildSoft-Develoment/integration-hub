# Análisis v71 contra el código real + plan tanda-9 — 2026-07-16

> Entrega **para autorización**. No se ha implementado nada de esta ronda. Regla: sin caminos legacy/fallback en
> el fuente; lo ya implementado se valida.

## Veredicto

La v71 es **precisa** y evalúa correctamente el trabajo commiteado (tanda-8 maker-checker operable + #10
prod-template). No trae bugs de money-safety nuevos. Sus recomendaciones son de **gobierno/UX/evidencia** para
subir el listón hacia homologación bancaria — ninguna bloquea el estado actual. Coincide con nuestro propio
inventario de pendientes.

## Validado — claims de v71 confirmados contra el código

| Claim v71 | Estado real |
|---|---|
| Consola muestra la solicitud PENDING (ackStatus/By/At/Ticket/Reason) NORMAL+CORRECTIVE, LEFT JOIN `where status='PENDING'` + índice único parcial (sin fan-out) | **Cierto** (tanda-8 #7; `Mt101FragmentRepository.openPayConflicts/openCorrectivePayConflicts`) |
| Frontend bloquea "Aprobar" si el usuario == maker | **Cierto** (`isMakerOf` vs `AuthService.username()`) |
| `makerCheckerState = LOADING\|OFF\|ON`, bloquea acciones en LOADING | **Cierto** (tanda-8 #8) |
| `approveAcknowledge` exige `markAckRequestApproved()==true` **y** `rows` no vacío, si no rollback→400 | **Cierto** (tanda-8 #9) |
| Test concurrente `concurrentApproveByTwoDifferentCheckersGrantsExactlyOne` | **Cierto** (12/12 IT) |
| Historial: PENDING previo → SUPERSEDED, nuevo → PENDING (no sobrescribe) | **Cierto** (`supersedePendingAckRequests`) |
| Reportes crudos 1M (`782.48s, tests=3, failures=0`; 757.126/1.870/1.925 s) | **Cierto** (`evidencias/reportes-crudos-1M-20260715/`) |
| Dos nodos cubierto por `AsyncInboxClaimIT` (11/11, 8 hilos), no por el IT eliminado | **Cierto** |
| prod-template con `direct-list=false`, `maker-checker=true`, `batch=200000`, `require-normal-pay-resolver=false` | **Cierto** (#10) |

## Correcciones a la v71

- **Conteo de tests:** la v71 cita "992 tests / 162 XML" (del ZIP empaquetado). La cifra **autoritativa** es la de
  la **regresión funcional en vivo** que corrí: **935 tests / 155 clases / 0 failures / 0 errors** (`mvn -pl
  platform-app test -DexcludedGroups=perf`, BUILD SUCCESS). La diferencia (~57 tests / 7 clases) son los reportes
  **perf** que quedaron en `target/surefire-reports` de la corrida de 1M/massive (excluidos del funcional a
  propósito, ya evidenciados aparte). No hay tests rojos.
- **Matiz require-normal-pay-resolver:** correcto pero **ya es configurable** — `${MT101_REQUIRE_NORMAL_PAY_RESOLVER:false}`
  en el prod-template. Si el flujo productivo concilia **inline** (`MT101_PAY→MT101_STATUS` con resolver), se setea
  `=true` por ambiente. No es cambio de código; es decisión de despliegue (documentada en #10).

## Hallazgos accionables (CÓDIGO) — confirmados contra el fuente

### B (P1 gobierno) — segregación por IDENTIDAD, no por ROL

**Confirmado.** Los 3 endpoints ack (`acknowledge`, `request-acknowledge`, `approve-acknowledge`) comparten
`@RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, PAYMENTS_OPERATOR})`. La segregación de funciones hoy se apoya
**solo** en la identidad (`checker != maker`, validado en `approveAcknowledge`). No existen roles maker/checker en
`PlatformRoles.java`. Para banca fuerte conviene **segregación por rol**: quién puede *solicitar* ≠ quién puede
*aprobar*, no solo "personas distintas".

**Propuesta (requiere tu decisión de modelo):** dos roles nuevos `pay-conflict-maker` y `pay-conflict-checker`:
- `request-acknowledge` → `@RolesAllowed({..., PAY_CONFLICT_MAKER})`
- `approve-acknowledge` → `@RolesAllowed({..., PAY_CONFLICT_CHECKER})`
- `acknowledge` (single-actor, solo con maker-checker OFF) → sin cambios.
- La identidad (maker≠checker) se **conserva** como segunda barrera (no se relaja).
- Alcance: `PlatformRoles` + los 2 endpoints + realm Keycloak (roles + usuarios fixture de test) + IT que verifique
  403 por rol insuficiente + (opcional) la UI ocultando el botón según rol.

> **Decisión pendiente tuya:** modelo de roles. Opción A: roles dedicados `pay-conflict-maker/checker` (más
> estricto, banca-grade). Opción B: mantener identidad-only y dejar la política de roles al IdP del banco (menos
> código, delega en el banco). Necesito tu elección antes de implementar B.

### C (P2 auditoría) — no hay trama del reemplazo (SUPERSEDED)

**Confirmado.** Cuando un 2º maker solicita, `supersedePendingAckRequests` marca la fila previa `SUPERSEDED` en
tabla, pero **no** se emite una trama append-only. Existen `requestedEnvelope` (PAY_CONFLICT_ACK_REQUESTED) y
`resolvedEnvelope` (PAY_CONFLICT_RESOLVED); falta `supersededEnvelope`. Para auditoría fina conviene un evento
inmutable **PAY_CONFLICT_ACK_SUPERSEDED** con: maker previo (quién quedó reemplazado), maker nuevo, ticket/motivo
previos, y el nuevo. Es aditivo, self-contained, bajo riesgo.

**Propuesta:** `Mt101PayConflictAudit.supersededEnvelope(...)` + en `requestAcknowledge`, si había un PENDING previo
(leerlo antes de superseder), emitir la trama en la MISMA transacción. + test.

### D (P2 UX) — settings en error cae a OFF (no fail-closed)

**Confirmado.** `error: () => makerCheckerState.set('OFF')` → si `/pay-conflicts/settings` falla, la UI muestra el
flujo single-actor. El backend igual rechaza el endpoint equivocado (400), así que **no** es riesgo de dinero; pero
para banca es mejor **fail-closed**: estado `ERROR` (o `UNKNOWN`) que **bloquea** las acciones de acknowledge y
muestra "No se pudo confirmar la política de maker-checker".

**Propuesta:** ampliar `makerCheckerState` a `LOADING | OFF | ON | ERROR`; en `error` → `ERROR`; el panel bloquea
request/approve/single-actor y muestra el aviso (con botón "reintentar"). Frontend-only + i18n. Trade-off aceptado:
si maker-checker está OFF y settings falla, se bloquea un acknowledge legítimo hasta reintentar (fail-closed a
propósito).

## No-código — operacional / evidencia / config (no entra a tanda-9)

| v71 | Clasificación | Estado |
|---|---|---|
| A — dos réplicas reales + caída de nodo | Operacional | Pendiente (B); garantía probada por `AsyncInboxClaimIT`; caso **§4.4** del [checklist UAT](uat-banco-a-banco-checklist.md) |
| E — banco-a-banco real (ACK/NACK, SFTP/mTLS, STATUS, conciliación) | Operacional | Pendiente; [checklist UAT](uat-banco-a-banco-checklist.md) listo |
| Métricas operativas del 1M (GC, wait events PG, CPU/IO, throughput por etapa, lag inbox/outbox) | Evidencia | Enriquecer una próxima corrida 1M con bitácora operativa (instrumentación, no lógica) |
| require-normal-pay-resolver en flujo inline | Config/entrega | Ya configurable por env; decisión de ambiente (#10) |

## Propuesta tanda-9 (pendiente de autorización)

1. **C** — trama `PAY_CONFLICT_ACK_SUPERSEDED` (auditoría append-only del reemplazo) + test. *Recomendado, bajo riesgo.*
2. **D** — settings fail-closed (`ERROR` state en la UI, bloquea acknowledge) + i18n. *Recomendado, frontend-only.*
3. **B** — segregación por rol (`pay-conflict-maker/checker`) — **solo si eliges el modelo de roles (Opción A)**;
   toca endpoints + realm + fixtures + IT.

Cada ítem: documentado + tests evidenciados (IT para B/C, build+lint para D), sin caminos fallback.

## Qué autorizar
- **tanda-9 completa** (C + D + B con Opción A de roles), o
- **C + D** (auditoría + UX, sin tocar el modelo de roles), o
- **solo C** o **solo D**, o
- priorizar lo operacional (métricas 1M / UAT) sobre el código, o
- **esperar**.

Mi recomendación: **C + D ya** (aditivos, bajos de riesgo, cierran gobierno/UX), y **decidir el modelo de roles (B)**
por separado porque depende del esquema de roles del banco. No implemento nada hasta tu OK.
