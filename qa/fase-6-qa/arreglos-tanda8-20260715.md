# Tanda-8 — operación del maker-checker + gobernanza de evidencia (v70) — 2026-07-15

Cierra los hallazgos accionables de la [v70](analisis-v70-y-plan-tanda8-20260715.md). Ninguno era money-safety;
son **completar el uso operativo del maker-checker** (opt-in, default off) + reproducibilidad de la evidencia.
Regla aplicada: sin caminos legacy/fallback en el fuente; lo implementado se valida con tests.

## #7 — La consola muestra la solicitud PENDING (antes invisible)

**Problema (v70, confirmado):** `openPayConflicts`/`openCorrectivePayConflicts` no unían con
`mt101_pay_conflict_ack_request` → con maker-checker ON, la consola ofrecía "Aprobar" pero **sin** los datos de la
solicitud (maker, ticket, motivo, cuándo). El checker no veía qué aprobaba; el operador no sabía si ya había un
PENDING; el maker podía intentar aprobar el suyo → 400.

**Solución:**
- **Backend** (`Mt101FragmentRepository`): LEFT JOIN a la solicitud `status='PENDING'` en ambas consultas
  (NORMAL por `fragment_set_id`; CORRECTIVE por `rebuild_run_id` + `corrective_senders_reference`). Sin fan-out —
  el índice parcial `ux_mt101_ack_request_pending` garantiza ≤1 PENDING por conflicto. `OpenPayConflictRow` gana
  5 campos: `ackStatus, ackRequestedBy, ackRequestedAt, ackTicketRef, ackReason` (null si no hay). Se serializan
  directo al JSON del endpoint (sin DTO intermedio).
- **Frontend** (`mt101-pay-conflicts`): chip **"Pendiente aprob."** en la fila (tooltip con maker/ticket/motivo)
  para verlo de un vistazo; en el panel de resolución, un bloque con el detalle del PENDING; el botón **"Aprobar"**
  solo aparece si hay PENDING y se **deshabilita si el actor actual es el maker** (`isMakerOf`, comparando contra
  `AuthService.username()`) con tooltip de segregación; si no hay PENDING, la acción primaria es "Solicitar".

## #9 — approveAcknowledge fail-loud (sin doble-cierre silencioso)

**Problema (v70, confirmado):** `approveAcknowledge` ignoraba el retorno de `markAckRequestApproved` y no
verificaba `rows.isEmpty()`. En una carrera de dos checkers, el 2º podía marcar APPROVED / retornar
`AcknowledgeResult(0)` en silencio.

**Solución:** tras `acknowledge*` + `markAckRequestApproved`, se exige **ambos** efectos o se aborta:
`if (!approved) throw` y `if (rows.isEmpty()) throw` (IllegalArgumentException → el catch hace **rollback**, el
resource lo mapea a 400, misma familia que "no pending"). El perdedor de la carrera falla explícito; el flag se
limpia **una sola vez** y no queda un PENDING marcado APPROVED en falso.

## #8 — Estado LOADING del modo maker-checker

**Problema (v70, confirmado):** el componente arrancaba `makerCheckerEnabled=false` y luego consultaba settings →
un instante con el flujo single-actor antes de conocer el modo.

**Solución:** `makerCheckerState = LOADING | OFF | ON` (arranca LOADING). Mientras LOADING, el panel muestra un
botón deshabilitado "Cargando modo…" y **no ofrece ninguna acción de reconocimiento** (evita el flujo equivocado).
En error de settings cae a OFF (el backend igual rechaza el endpoint equivocado con 400: se pierde el matiz, no la
seguridad).

## #5 — Reportes crudos del 1M archivados

Los reportes de Surefire **sin editar** de la corrida de 1M quedan en
[`evidencias/reportes-crudos-1M-20260715/`](evidencias/reportes-crudos-1M-20260715/) (XML completo:
`time=782.48s, tests=3, failures=0`; money-path 1M 757.1 s; entorno JDK 25 / Windows 10). Referenciados desde el
doc resumen.

## Evidencia de tests

| Suite | Resultado |
|---|---|
| `Mt101PayConflictMakerCheckerIT` | **12/12 (BUILD SUCCESS, 27.9 s)** — 8 previos + 4 nuevos |
| `Mt101OpenPayConflictsConsoleIT` | **9/9 (BUILD SUCCESS, 31.7 s)** — 8 previos (3 stale arreglados, ver abajo) + 1 nuevo (#7 HTTP) |

Tests nuevos:
- `openPayConflictsExposesThePendingAckRequestAndNullWhenNone` (#7 NORMAL: PENDING poblado + null sin solicitud).
- `openCorrectivePayConflictsExposesThePendingAckRequest` (#7 CORRECTIVE).
- `exposesPendingAckRequestFieldsThroughTheEndpoint` (#7 **stack HTTP completo**: el GET `/pay-conflicts/open`
  devuelve los campos ack poblados por el JOIN + serialización del record; null sin solicitud, sin fan-out).
- `approveIsFailLoudWhenTheConflictWasAlreadyResolvedOutOfBand` (#9: flag ya limpio → aborta, PENDING intacto, 0 APPROVED).
- `concurrentApproveByTwoDifferentCheckersGrantsExactlyOne` (#9 **carrera real de 2 hilos**: exactamente 1 aprueba,
  el otro falla fuerte, flag limpio una vez, 1 APPROVED, 0 PENDING colgado).

Frontend: `lint feature-audit` OK; `nx build web` (strictTemplates) BUILD SUCCESS.

## Doble check — hallazgo colateral: 3 tests **preexistentes** en rojo (arreglados)

El doble check corrió `Mt101OpenPayConflictsConsoleIT` y encontró **3 fallos que NO son de tanda-8** (se
reprodujeron idénticos con mis cambios stasheados → preexistentes). Eran **tests stale contra el contrato actual**
del flujo de acknowledge que tanda-7 evolucionó:
- `acknowledgesNormalConflictAndClearsIt` y `acknowledgesCorrectiveConflict`: mandaban los datos por **query-params**
  y el endpoint ya toma **cuerpo JSON** (`AcknowledgePayConflictRequest`, con `reason` fuera de la URL por seguridad
  y `ticketRef` obligatorio) → **HTTP 415**. Arreglados: cuerpo JSON + `ticketRef`.
- `listsBankConfirmationsAsEvidenceForAConflict`: no pasaba `processExecutionId` (hoy obligatorio para acotar la
  evidencia al :20: de ESA ejecución) y `seedArchive` no seteaba `process_execution_id`. Arreglados ambos.

El endpoint y la UI ya usaban el contrato correcto; solo los tests estaban desactualizados. Se validan ahora
(no se relaja el contrato). Verificación: mismos 3 fallos en baseline limpio (`git stash`) → 9/9 tras el arreglo.

## Sin cambios — pendientes de homologación FINAL
- **#10 / B.4:** `prod-template` con flags productivas explícitas (`direct-list=false`, `maker-checker=true`, …) +
  revertir config de test + separar int-lab/prod-template. (Operativo de entrega, no de código.)
- **(B)** dos réplicas reales + caída de nodo (la garantía ya está probada por `AsyncInboxClaimIT`).
- **UAT banco-a-banco real** (ACK/NACK, SFTP/mTLS).
