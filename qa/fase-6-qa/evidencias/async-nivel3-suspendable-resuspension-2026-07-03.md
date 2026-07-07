# Nivel 3: async para tareas suspendibles (re-suspensión) — 2026-07-03

## Contexto y decisión

Los suspendibles (`MT101_STATUS`) **ya son no-bloqueantes** por su suspend/resume nativo (el suspend
libera el hilo; un scheduler/callback reanuda). Ofrecerles async offload añade complejidad por beneficio
marginal — y el guard que los mantenía `UNSUPPORTED` era el diseño correcto. Se documentó ese trade-off
y, por decisión explícita, se implementó igual.

## Qué se implementó

Cuando un `SuspendableTaskProvider` marcado `async:true` (once) se offloada y su **primer intento** (que
corre en el consumer) devuelve `suspended`, el motor ahora **re-suspende** la tarea en vez de marcarla
DEAD; el callback/scheduler la reanuda normalmente hasta completar.

### 1. Re-suspensión en la completación async

`ProcessExecutionResumeService.completeTransactional` ya no rechaza resultados `suspended`: los deriva a
`reSuspend(...)`, que **espeja** la re-suspensión ya probada del resume por callback
(`resumeTransactional`): `markResumed` de la suspensión async + `suspendTask` con token/estado/expiry
nuevos, **preservando la `suspendedContinuation`** para que el resume posterior siga el downstream.
Devuelve `RE_SUSPENDED`.

### 2. Contexto en el camino once (Approach B, sin tocar wire ni redrive)

`MT101_STATUS` lee `taskOutputs` (qué pagos consultar). En vez de cambiar el payload del envelope once
(que comparte el redrive del DLQ, sin contexto vivo), el consumer **carga el contexto desde la
continuación persistida**: `AsyncTaskCompletion.loadSuspendedContext(peId, tdId)` lee
`taskOutputs`/`executionVariables` de `suspendedContinuation` (capturada al suspender por async) y el
consumer rehidrata el `TaskContext` antes de `execute`. No viaja `sourcePayload`.

### 3. Consumer (camino once)

- Rehidrata el contexto (`hydrateOnceContext`) antes de `provider.execute`.
- Si el resultado es `suspended`: llama a la completación (que re-suspende) y marca el inbox
  **PROCESSED** (el offload cumplió su primer intento) — ya **no DEAD**. La reentrega se deduplica por
  `idempotencyKey`.

### 4. Guard + capacidad

- El guard deja de bloquear suspendibles en `once`; sigue bloqueando **suspendible + scatter** (la
  re-suspensión no aplica a una slice).
- `MT101_STATUS.asyncOffloadSupport()` → **SUPPORTED**. Los suspendibles sin capacidad declarada (p.ej.
  `RemoteTaskProvider`, ya async por su transporte) siguen `UNSUPPORTED`.

## Semántica de reentrega

At-least-once (igual que la completación async existente): si hay crash entre re-suspender y registrar el
inbox, una reentrega re-ejecuta el primer intento (una lectura idempotente para `MT101_STATUS`) y
re-suspende con otro token. Documentado; benigno para status-checks idempotentes.

## Pruebas

- **`AsyncTaskConsumerTest` 14/14** (+2 nuevos): `suspendedResultReSuspendsInsteadOfDeadLettering`
  (PROCESSED + se pasa el suspended a la completación, no DEAD) y `onceRehydratesSuspendedContextForTheProvider`
  (el contexto capturado se rehidrata en el `TaskContext`). Se **eliminó** el test obsoleto
  `suspendedInsideConsumerIsDeadUntilContinuationLands` (afirmaba el DEAD que Nivel 3 cambia).
- **`ProcessTaskRuntimeAsyncGuardTest` 6/6** (+2): suspendible SUPPORTED en once se permite; suspendible
  en scatter se rechaza; suspendible sin capacidad sigue bloqueado.
- **`AsyncSuspendableReSuspendE2EIT` 1/1** (nuevo, Testcontainers): async → consumer ejecuta 1er intento
  → suspende → **re-suspende** (nuevo token, proceso SUSPENDED) → `resume(token)` → provider.resume →
  proceso **COMPLETED**.
- **Regresión 34/34**: `ProcessExecutionSuspendResumeIT` 5, `Mt101StatusTaskProviderTest` 20, y todos los
  async ITs (execution 3, scatter 1, dlq 4, kafka 1) — sin cambios.

## Doble check

- **`MT101_STATUS = SUPPORTED` verificado (riesgo clase-REST_CALL descartado)**: `execute` lee del
  contexto **solo** `taskOutputs` (líneas 1096/1130), vía `input.sourceTaskRef`/`sourceOutput` de la
  config; no usa `sourcePayload`, `readResult` ni helpers (`Mt101MessageInputResolver`/`TaskOutputSupport`).
  Y `readRecords`/`correctivePaySource` procesan cada valor con `instanceof Map` → **Map-tolerantes**, por
  lo que el round-trip JSON de la continuación (que degrada objetos tipados a Maps) es compatible (el path
  síncrono ya requería Maps). ⇒ la capacidad es correcta.
- **Flujo `completeTransactional` limpio**: un solo `markResumed` por rama; `reSuspend` usa el
  `suspendTask` <b>plano</b> (sin async/scatter dispatch) → no re-encola un work-item (sin loop de offload).
- **Brecha de cobertura cerrada**: el E2E se reforzó para que el suspendible **lea** el `taskOutputs`
  rehidratado y el test **asserte** que llegó no vacío — probando juntos contexto + re-suspensión (el caso
  real de `MT101_STATUS`), no por separado.

## Estado

Los suspendibles (`MT101_STATUS`) son async-capaces en once: el offload ejecuta el primer intento y, si
suspende, la tarea re-suspende y reanuda por callback/scheduler, todo sin re-invocar al provider desde el
consumer. Cierra los tres niveles del roadmap async (1 guard/capacidad, 2 contexto scatter, 3 suspendibles).
