# Análisis v70 contra el código real + plan tanda-8 — 2026-07-15

> Entrega **para autorización**. No se ha implementado nada de esta ronda. Regla: sin caminos legacy/fallback en
> el fuente; lo ya implementado se valida.

## Veredicto

La v70 es **precisa**. Describe correctamente el trabajo commiteado (tanda-7 maker-checker end-to-end, 1M, dos
nodos). No trae bugs de money-safety nuevos. Sus hallazgos accionables son de **completar la operación del
maker-checker** (opt-in, default off) + **gobernanza de evidencia/config** — no bloquean el estado actual.
Varios coinciden con los que yo ya había marcado en el doble check de tanda-7.

## Validado — lo que la v70 da por hecho y confirmo implementado

| Punto v70 | Estado real |
|---|---|
| #1 Frontend maker-checker (settings + dos pasos) | **Implementado** (`85df8b76`/`b1276be1`) |
| #2 Trama `PAY_CONFLICT_ACK_REQUESTED` | **Implementado** (`85df8b76`) |
| #3 Historial: PENDING previo → SUPERSEDED (no sobrescribe) | **Implementado** (+ fix `approved_at` NULL en `66f6cbca`) |
| #4 Cobertura maker-checker CORRECTIVE | **Implementado** — `Mt101PayConflictMakerCheckerIT` 8/8 |
| #5 Evidencia 1M | **Hecha** — BUILD SUCCESS 3/3, ~14 min, `-Xmx768m` sin OOM, cero deadlock H7 |
| #6 Evidencia dos nodos | **Cubierta** — pero por `AsyncInboxClaimIT` (ver corrección) |

## Correcciones a la v70

- **#6 (dos nodos):** la v70 critica que `TwoNodeClaimFencingIT` "simula dos nodos con transacciones separadas
  (secuencial)". **Ese IT se eliminó** (era un duplicado más débil). La cobertura real es **`AsyncInboxClaimIT`
  (11/11)** que incluye **contención REAL de 8 hilos** (`concurrentClaimsOnTheSameKeyGrantExactlyOne` → 1 gana),
  fencing por token, recovery de lease vencido y heartbeat. Es **más fuerte** que lo que la v70 critica.
- **#5 (reportes crudos):** correcto — la evidencia 1M documenta el resultado pero no adjunta `surefire-reports`
  crudos. Fácil de cerrar (archivar el `.txt`/`.xml` de la corrida).

## Hallazgos nuevos verificados contra el código

### #7 (P1 operativo, si se activa maker-checker) — la UI no muestra la solicitud PENDING

**Confirmado.** `openPayConflicts`/`openCorrectivePayConflicts` (`Mt101FragmentRepository`) devuelven
`OpenPayConflictRow` **sin** join a `mt101_pay_conflict_ack_request`. La consola muestra los botones "Solicitar"/
"Aprobar" pero **no** los datos de la solicitud PENDING (maker, ticket, reason, requested_at, ackStatus). El
checker no ve qué aprueba; el operador no sabe si ya hay un PENDING; el maker puede intentar aprobar el suyo → 400.

**Propuesta:** extender `openPayConflicts`/`openCorrectivePayConflicts` con LEFT JOIN a la solicitud PENDING →
`ackStatus, ackRequestedBy, ackRequestedAt, ackTicketRef, ackReason` en `OpenPayConflictRow` + DTO. UI: si hay
PENDING → mostrar "Pendiente de aprobación · solicitado por X · ticket Y · motivo Z" y el botón "Aprobar"
(deshabilitado si el usuario actual es el maker); si no hay PENDING → "Solicitar reconocimiento".

### #8 (UX, menor) — settings carga en falso por defecto

**Confirmado.** El componente inicia `makerCheckerEnabled=false` y luego consulta settings. Si el usuario actúa
antes del fetch, ve el flujo single-actor por un instante (el backend igual lo bloquea con 400). **Propuesta:**
estado `makerCheckerState = LOADING | OFF | ON`; deshabilitar las acciones de acknowledge mientras `LOADING`.

### #9 (hardening transaccional) — approveAcknowledge con rows=0

**Confirmado.** `approveAcknowledge` **ignora** el retorno de `markAckRequestApproved` y no verifica
`rows.isEmpty()`. En una carrera rara (dos checkers), el 2º podría hallar el PENDING, `acknowledge*` devolver 0
filas (el flag ya lo limpió el 1º) y aun así marcar la solicitud APPROVED / devolver `AcknowledgeResult(0)` sin
señal explícita. No mueve dinero (el flag no se re-limpia; el terminal se conserva), pero para banca conviene un
resultado explícito. **Propuesta:** verificar `markAckRequestApproved(...) == true` **y** `!rows.isEmpty()`; si
no, fallo/estado idempotente claro ("ya reconocido / sin conflicto abierto / solicitud obsoleta").

### #10 (entrega) — perfil productivo con flags explícitos

**Correcto** (ya en el pendiente B.4). En `application.properties` las flags están comentadas (defaults). Para
prod bancaria: `direct-list.enabled=false`, `maker-checker.enabled=true`, `require-normal-pay-resolver=true` (si
la conciliación es inline; si no, dejar false pero exigir el scheduler de conciliación),
`insert-batch-max-bytes=200000`. Va en el `prod-template` (separar de int-lab), no en el base.

## Propuesta: tanda-8 (pendiente de tu autorización)

1. **#7 (recomendado):** UI muestra la solicitud PENDING (query LEFT JOIN + DTO + consola) — cierra el uso
   operativo real del maker-checker. Backend chico + frontend + IT.
2. **#9:** hardening de `approveAcknowledge` (verificar rows/markApproved, resultado explícito) + test de la carrera.
3. **#8:** estado LOADING en la UI (bloquear acknowledge hasta conocer el modo).
4. **#5 (evidencia):** archivar los reportes crudos de la corrida 1M (surefire `.txt`/`.xml`) en `evidencias/`.
5. **#10 (entrega):** `prod-template` con las flags productivas explícitas (parte de B.4).

## Sin cambios — pendientes de homologación FINAL
- **(B)** dos réplicas reales + caída de nodo (confirmación operativa; la garantía ya está probada por
  `AsyncInboxClaimIT`).
- **UAT banco-a-banco real** (ACK/NACK, SFTP/mTLS).
- Hardening de entrega (revertir config de test, separar int-lab/prod-template).

## Qué autorizar
- **tanda-8 completa** (#7 UI-pending + #9 approve-hardening + #8 LOADING + #5 reportes crudos), o
- **solo #7 + #9** (lo operativo del maker-checker) dejando #8/#5 como pulido, o
- priorizar **#5 (reportes crudos) + #10 (prod-template)** si lo urgente es la entrega, o
- **esperar**.

No implemento nada hasta tu OK.
