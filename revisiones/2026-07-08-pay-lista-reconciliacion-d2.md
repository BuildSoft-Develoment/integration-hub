# PAY directo por lista — reconciliación gobernada del intent (D2-min)

**Fecha:** 2026-07-08
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Alcance:** D2 (auto-cierre gobernado del intent-ledger), validado con doble-check contra código real.

## Doble-check que corrigió el diseño (dos errores míos)

1. **"`mt101_archive` no tiene `process_execution_id`" era FALSO.** Solo miré V12. **V36** añadió la columna
   (`alter table mt101_archive add column process_execution_id`) + índice `(senders_reference, process_execution_id)`.
   → el join intent→archive es **acotado por ejecución e indexado**; se cae toda la ambigüedad que había planteado y,
   con ella, la necesidad de añadir `archive_id` al intent (sobre-ingeniería descartada).
2. **"Leer `mt101_confirmation`" era el camino equivocado.** `confirmed_status` es el string crudo del banco y exige la
   config `acceptedStatuses/rejectedStatuses` para clasificar. En cambio **V17** documenta que `mt101_archive.status`
   ya es el terminal **clasificado** por el pipeline (`PAY→SENT/REJECTED`, `STATUS→CONFIRMED/REJECTED`). Leer
   `archive.status` da el terminal sin config ni parseo.

## Hallazgo

En la topología de lista (`SPLIT → PAY → STATUS`), MT101_STATUS confirma el pago **inline** por `${sendersReference}`
y deja `mt101_archive.status` en el terminal, pero **no toca `mt101_pay_dispatch_intent`** → el intent queda
`UNCERTAIN`/`DISPATCHING` bloqueando el reenvío "hasta conciliar", aunque el destino del pago ya se conoce. D2 cierra
ese lazo del ledger. No es seguridad money-path (el dinero ya está resuelto y auditado); es **higiene del ledger**.

## Cambio (SOLID)

- **Store** (`Mt101PayDispatchIntentStore`, SRP ampliado a "reconciliar contra el archive autoritativo"):
  `findStuckByKey`, `archiveTerminalStatus(sendersRef, execId)` (join por `(senders_reference, process_execution_id)`,
  mapea `SENT/CONFIRMED→SENT`, `REJECTED→REJECTED`, no-terminal→`null`), `reconcileToTerminal` (transiciona **solo**
  desde `UNCERTAIN`/`DISPATCHING`, evidencia durable en `error_message`).
- **Servicio** `Mt101PayDispatchIntentReconcileService` (orquestación + gobernanza): `reason`+`executedBy`
  obligatorios; outcomes `RECONCILED` / `NOT_STUCK` / `NO_EXECUTION` / `NO_TERMINAL`. Sin ejecución/match/terminal →
  **no-op** (manual). Nunca re-consulta el gateway ni re-despacha.
- **Endpoint** `POST /api/query/mt101-pay-dispatch-intents/reconcile` (roles de operación, **sin AUDITOR** por ser
  escritura money-path; actor del principal; `reason` obligatorio).
- **Frontend**: acción "Reconciliar" por fila atascada en la vista D1, gateada por `canAuditOperate`, con motivo
  obligatorio y feedback por outcome; i18n en/es.

## Seguridad / límites (honestos)

- Solo actúa con un terminal **definitivo** del archive; ambiguo/no-concluyente → no-op (nunca desbloqueo ciego).
- `process_execution_id` NULL (el caso de D1) → `NO_EXECUTION`, manual.
- STATUS `gatewayReference`-based que nunca dejó terminal → `NO_TERMINAL`, manual.
- Solo cubre el `mt101_archive` por defecto de la plataforma (archives por conexión → no-op, manual).

## Pruebas (evidencia)

| Suite | Resultado | Qué prueba |
|---|---|---|
| `Mt101PayDispatchIntentStoreIT` | **11 / 0 / 0** | +3 D2: `reconcileToTerminal` transiciona desde stuck; `archiveTerminalStatus` clasifica CONFIRMED→SENT/REJECTED y descarta no-terminal / otra ejecución; no-op si no está atascada |
| `Mt101PayDispatchIntentLookupIT` | **3 / 0 / 0** | +2 D2 E2E REST: `POST /reconcile` → `RECONCILED`/`SENT` y `stuck` baja a 0; archive no-terminal → `NO_TERMINAL`, sigue atascado |
| PAY sin regresión (`Mt101PayDirectListDurableTest`, `Mt101PayTaskProviderTest`, `Mt101PayNormalDurableTest`, `Mt101StatusTaskProviderTest`) | verde | el store D2 es aditivo; el PAY/STATUS no cambian |
| `web` (vitest) | **516 / 0 (104 archivos)** | +3 specs del reconcile (exige motivo, RECONCILED, NO_TERMINAL); paridad i18n en/es |
| lint + `nx build web` (AOT) | OK | typecheck + build prod limpios |

## Doble-check E2E (premise verificado contra el pipeline real + una mejora)

Mis ITs siembran `mt101_archive.status`. Verifiqué que eso es **fiel** a lo que el pipeline produce de verdad:

1. **El ARCHIVE puebla `process_execution_id`** (`Mt101ArchiveRepository.insertArchive`, columna en el insert +
   `setLong`), así que el join `(senders_reference, process_execution_id)` matchea para archives del pipeline (no solo
   en los tests). Linchpin confirmado.
2. **STATUS deja `archive.status` en el terminal exacto que D2 lee**: `syncArchiveStatus` hace
   `updateArchiveStatus(..., confirmed ? "CONFIRMED" : "REJECTED")` — los strings `CONFIRMED`/`REJECTED` que
   `archiveTerminalStatus` clasifica. El seed de los ITs reproduce esto 1:1.
3. **Mejora encontrada**: el vocabulario del archive (V17) incluye `RECONCILED` (post-conciliación bancaria = pago
   liquidado). Mi query lo dejaba fuera → un pago RECONCILED habría quedado `NO_TERMINAL` (manual) sin motivo. Se
   añadió `RECONCILED` a los terminales "enviado"; `UNMATCHED` se mantiene fuera (ambiguo → manual). WHERE derivado de
   las constantes (sin drift) + `order by id desc` (defensivo si hubiese >1).

**Caveat honesto**: `archive.status` es una clasificación **binaria** del pipeline (accepted→CONFIRMED, resto→REJECTED).
D2 confía en ese veredicto autoritativo (es una acción gobernada por un humano con motivo), no añade juicio propio. Un
proceso con `archiveStatusTable` custom (≠ `mt101_archive`) → D2 no lo ve → `NO_TERMINAL`, manual.

Evidencia actualizada: store IT **11/11** (incl. `RECONCILED→SENT` y `UNMATCHED→null`), lookup IT **3/3**, re-corridos
con el fix; PAY/STATUS **59/59** sin regresión; frontend **516/516** + build prod limpio.

## Resumen

D2-min cierra el lazo del intent-ledger leyendo el terminal ya clasificado del archive (join V36, sin config, sin
gateway, sin migración), gobernado (reason + evidencia durable). **Sin fallback silencioso**: sin terminal definitivo
→ manual. El doble-check corrigió dos decisiones de diseño (columna V36 ignorada; leer archive.status en vez de
confirmation) y, en el segundo pase, verificó el premise contra el pipeline real y añadió `RECONCILED` como terminal.
