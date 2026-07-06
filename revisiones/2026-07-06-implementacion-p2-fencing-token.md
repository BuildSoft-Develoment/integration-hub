# Implementación — P2: el token de proceso como fencing token en todo el runtime

Fecha: 2026-07-06
Alcance: cierra el P0 real del [análisis de homologación mejorado](2026-07-06-analisis-revision-homologacion-v56-mejorado.md).
Autorizado por el usuario (solo P2). Sin fallback/legacy.

## Problema (verificado en el análisis + doble-check)

El `execution_token` existía pero solo se usaba en el **claim** y la **recuperación** (`claimForRunning`/`renewLease`/
`recoverExpiredRunning`). **No se propagaba al runtime ni se validaba en las transiciones**: `run(id)` no recibía token, y
`completeTask/failTask/completeTaskWithErrors/completeProcess/failProcess/completeProcessWithErrors/startTask/suspendTask`
mutaban el estado **incondicionalmente**. → un worker zombi (lease vencido, proceso recuperado por otro nodo) podía
completar/fallar el proceso, marcar tareas o suspender, **sobrescribiendo incluso un `NEEDS_RECONCILIATION`** recuperado.

## Solución (SOLID, uniforme, sin caminos sin fencing)

**Invariante nuevo:** toda ejecución tiene un `execution_token`, y **toda transición de estado es guardada** por
`WHERE execution_token = ? AND status = 'RUNNING'`. 0 filas ⇒ el worker perdió el token ⇒ `FencingTokenLostException`
(aborta sin tocar estado ajeno).

- **`FencingTokenLostException`** (NUEVO): no es fallo de negocio; no se traduce en `failProcess`/`failTask` (eso también
  estaría fenced). Se propaga hasta el runner, que la registra como aborto limpio del zombi.
- **`ProcessExecutionRepository`** (2 métodos guardados NUEVOS):
  - `transitionRunningProcess(id, token, toStatus, details, now)` — transición TERMINAL del proceso guardada por
    token+RUNNING (atómica). Devuelve filas afectadas.
  - `touchRunningOwner(id, token, now)` — confirma (y refresca heartbeat) que el worker sigue siendo dueño RUNNING antes
    de una mutación no-terminal (start/complete/fail de tarea, suspensión).
- **`ProcessExecutionStateService`**: cada transición recibe `executionToken`; las de proceso usan
  `transitionRunningProcess` (helper `transitionProcessTerminal`), las de tarea/suspensión hacen `assertOwner(...)`
  (via `touchRunningOwner`) antes de mutar. `startProcess` fija el token del path **síncrono** (el queued usa el del claim).
- **Propagación del token** (sin ambigüedad, de punta a punta):
  `BackgroundProcessExecutionDispatcher` (token del claim) → `ProcessExecutionRunner.run(id, token)` →
  `ProcessExecutionService.executeQueued/execute/continueAfterResume` → `executeTasks(token)` → cada transición +
  `FileReadTaskFastPath.execute(token)` + `suspendTask(token)`; el **resume** toma el token de la ejecución (persistido y
  conservado en la suspensión; `markResumed` la deja RUNNING).
- **Manejo del fencing**: `executeTasks` (y el fast path) capturan `FencingTokenLostException` **antes** del catch general
  → re-lanzan sin `failProcess`/`failTask`; el dispatcher la loguea como `aborted: fencing token lost`.

## Pruebas (evidenciadas)

- **Unit `ProcessExecutionStateServiceTest`** (16, +3): transiciones de proceso via `transitionRunningProcess` (verify +
  audit) y de tarea via `touchRunningOwner`; **negativos de fencing**: `completeProcessThrowsFencingWhenTokenLost` (0
  filas → excepción, sin auditar) y `completeTaskThrowsFencingWhenTokenLost` (0 filas → excepción, sin tocar la tarea).
- **E2E `ProcessExecutionFencingIT` (NUEVO, Postgres real)** (4): dueño legítimo cierra; **zombi tras recuperación** →
  `FencingTokenLostException` y el `NEEDS_RECONCILIATION` **NO se sobrescribe**; **re-claim por otro nodo** → `failProcess`
  fenced (sigue RUNNING); **completeTask de un zombi** → fenced (la tarea sigue RUNNING). El escenario exacto del análisis.
- **Regresión happy-path** (12 ITs, Postgres real): `Mt101AllTasksProcessE2EIT` (flujo completo `execute→…→completeProcess`
  con token generado) + los 4 scatter (`suspendTask` con el guard real, tokens sembrados) → **BUILD SUCCESS, 0 fallos**.
  El threading no rompió ejecución normal, suspensión, scatter ni resume.

## Alcance / honestidad

- Cubre **todas** las rutas que mutan estado de ejecución: sync (`execute`), queued (`executeQueued`), fast path,
  suspensión y resume/continuación. No queda transición sin guardar (sin fallback token-null).
- **Sin migración**: la columna `execution_token` ya existía (v53-fix); solo se cablea y valida.
- El path de PAY correctivo (money-path) ya estaba blindado a nivel ledger (P1); esto blinda el **estado del motor** que lo
  contiene, cerrando el hueco de un worker zombi alterando el proceso o ejecutando efectos de otras tareas.

## Estado

**P2 cerrado.** Pendientes del análisis que siguen abiertos (no autorizados aún): P5/P6 (secretos en el offload async),
P3 (PAY real solo desde fuente persistida), P9 (backend fail-closed si async no READY).
