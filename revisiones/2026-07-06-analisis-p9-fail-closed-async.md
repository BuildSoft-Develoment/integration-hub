# Análisis — P9: el backend no falla-cerrado si el async no está READY

Fecha: 2026-07-06
Tipo: **análisis** (validación contra código real; sin implementar). Cuarto pendiente del
[análisis de homologación mejorado](2026-07-06-analisis-revision-homologacion-v56-mejorado.md), tras P2/P3 (hechos) y P5
(guardrail). Fuera del money-path.

> **NOTA (doble-check, ver sección final): la recomendación de abajo quedó REVERTIDA.** "Fail-closed en dispatch" (gatear
> `prepare` en READY) es **arquitectónicamente incorrecto** — contradice el transactional-outbox (que POR DISEÑO permite
> encolar con el broker caído) y **rompería la suite async** (los ITs offloadan en estado DEGRADED). El modo de fallo ya
> está acotado por infra existente (relay retry + outbox durable + redrive + expiry scheduler). Severidad 🟠→🔵. **No
> implementar el fix del review.** Detalle y única mejora residual (redrive programado) en la sección de doble-check.

## Problema (confirmado en código)

El backend decide offloadar una tarea al broker mirando **solo** `tasks.async.execution.enabled`, **no** si el async está
realmente **READY** (relay + consumer + producer vivos + broker). Con async on pero el broker/consumer caídos, la tarea se
**offloada igual** → suspende + encola en el outbox → **no hay quien publique/consuma** → el proceso queda **colgado**
(SUSPENDED con outbox pendiente), acotado solo por DLQ/expiry si están configurados.

### Flujo verificado
- **Gate único**: `AsyncTaskDispatchService.prepare(...)` devuelve el envelope si `enabled && plan.isAsync()`, o
  `Optional.empty()` si no ([línea 60-66](platform-app/src/main/java/com/integrationhub/platform/service/execution/async/AsyncTaskDispatchService.java)).
  `enabled` = `tasks.async.execution.enabled` — **no consulta READY**.
- **Un solo punto controla AMBOS offloads**: en `ProcessTaskRuntimeService`, `if (asyncEnvelope.isPresent())`
  ([línea 90](platform-app/src/main/java/com/integrationhub/platform/service/execution/ProcessTaskRuntimeService.java))
  gatea tanto el **per-task async** (línea 137) como el **scatter/page-chain** (líneas 93-135). Si `prepare` devuelve
  empty → cae a la **ejecución síncrona** (línea 145+).
- **La señal READY YA existe** (del #4): `AsyncAvailabilityService.availability().state()` ∈ {DISABLED, DEGRADED, READY},
  `@ApplicationScoped` (inyectable), que exige los tres gates + broker registrado + **consumer y producer conectados EN
  VIVO** (`consumerLive`/`dispatchLive` vía `ChannelHealth`)
  ([AsyncAvailabilityService.java:86-95](platform-app/src/main/java/com/integrationhub/platform/service/messaging/AsyncAvailabilityService.java)).
- **El front ya falla-cerrado por diseño** (advisory): trata `!= READY` como no-listo y delega la barrera real en el
  backend (verificado en el doble-check de P2/análisis previo). → **el fix es puramente backend**.

### Severidad (disciplina P5/P3: ¿activo o config-dependiente?)
Por **default** `tasks.async.execution.enabled=false` → estado DISABLED → `prepare` empty → todo corre **sync** → **sin
riesgo P9**. El cuelgue ocurre **solo** cuando un operador **habilita** async (execution=true) pero el sistema está
**DEGRADED** (relay/consumer/broker caído o no-vivo). → **🟠 real pero config-dependiente** (no el default, no money-path).
Es una madurez de operabilidad: que habilitar async con el broker caído no cuelgue procesos.

## Solución propuesta (SOLID, sin fallback — reusa la ruta sync existente)

**Un solo cambio, un solo punto**: `AsyncTaskDispatchService.prepare(...)` gatea por **`state == READY`** en vez de solo
`enabled`:

- Inyectar `AsyncAvailabilityService`; `if (availability().state() != READY) return Optional.empty();` (antes del
  `plan.isAsync()`).
- Efecto: **DISABLED** (como hoy) y **DEGRADED** (nuevo) → `empty` → la tarea corre **síncrona** por la **misma ruta que ya
  existe** (línea 145+). READY → offload. **No es un fallback nuevo**: es la ruta síncrona que ya se usa cuando async está
  apagado; solo se extiende el gate a "async apagado **o no operativo**".
- **Cubre las dos rutas** (per-task + scatter) porque ambas dependen de `asyncEnvelope.isPresent()`.
- **El redrive del DLQ no se toca**: usa `buildEnvelope` (ungated), separado de `prepare` → un DEGRADED transitorio no
  bloquea el re-encolado de una suspensión ya decidida async.
- **Seguro correr sync**: `asyncOffloadSupport=SUPPORTED` significa que la tarea **puede** offloadarse, pero `execute`/
  `executeRecords` corre igual in-process; el offload es una optimización, no un requisito. (Verificar en el doble-check
  para scatter de alto volumen.)

**Opción (no recomendada para el primer incremento)**: un modo degradado explícito (`tasks.async.allow-degraded-dispatch`)
que permita encolar en DEGRADED con confirmación administrativa. Es un **escape hatch** (cerca de un fallback); mejor
dejarlo fuera y, si se necesita, añadirlo después como política explícita con su propio guard.

## Doble-check — verificación contra código (self-review) — REVIERTE la recomendación

Reté el fix propuesto ("fail-closed en dispatch") contra el diseño y los tests. **Es arquitectónicamente incorrecto**;
el modo de fallo está **mucho más mitigado** de lo que planteé. Severidad corregida **🟠 → 🔵**.

- **Offloadar con solo `execution.enabled` es POR DISEÑO (transactional outbox)**. El perfil de test async
  `AsyncExecutionTestProfile` habilita **solo** `tasks.async.execution.enabled=true` (no dispatch, no consumer) y los ITs
  corren **"sin broker"**, disparando el `AsyncTaskConsumer` directo. → con ese perfil el estado es **DEGRADED**. Si
  `prepare` gateara en `state==READY`, esos ITs correrían **sync** en vez de offloadar → **rompería toda la suite async**.
  El outbox está DISEÑADO para absorber el broker caído: se encola durable y el relay entrega después. "Fail-closed en
  dispatch" **contradice el patrón** (y su razón de ser: resiliencia ante caídas de broker).
- **El modo de fallo está acotado por infra existente**:
  - **Relay con retry** (`TaskOutboxRelay`, `max-attempts=20` + backoff): un blip **transitorio** se auto-recupera (el
    broker vuelve dentro de la ventana → publica).
  - **Sostenido** → outbox `DEAD`, pero **durable**: `AsyncTaskDlqService.redriveOutboxDead` reanima `DEAD→PENDING` → el
    relay entrega cuando el broker vuelve. El proceso **no se pierde**; queda retenido hasta broker-recovery + redrive.
  - **`SuspensionExpiryScheduler`** (@Scheduled 60s) reanuda/falla las suspensiones **expiradas**.
- **Único hueco residual (menor)**: las suspensiones **async** no llevan expiry (`Map.of("asyncDispatch", true, ...)` sin
  `expiresInSeconds` → `SuspensionExpiry.expiresAt`=null) → el `SuspensionExpiryScheduler` **no** las reap-ea. Así, ante un
  outage **sostenido**, el proceso queda **retenido** (SUSPENDED, outbox DEAD) hasta que el broker vuelva **y** se redrive
  (manual, vía consola DLQ). No es un hang que pierda datos (el outbox es durable), pero sí requiere acción de operador si
  el broker no vuelve solo.

### Recomendación corregida: NO implementar "fail-closed en dispatch"

El fix propuesto rompe el diseño (transactional outbox) y la suite de tests, para un problema que el propio diseño ya
absorbe (durabilidad + retry + redrive + expiry). **No procede.** La barrera en dispatch no debe existir: el punto del
outbox es justamente poder encolar con el broker caído.

**Mejoras marginales posibles (baja prioridad, recovery-side, no dispatch-side)** — si se quiere reducir el hueco residual:
1. **Redrive programado de `DEAD` del outbox** (un `@Scheduled` que llame `redriveOutboxDead` con backoff largo) → el
   proceso retenido se recupera **solo** cuando el broker vuelve, sin operador. Es el cambio más útil y acotado.
2. **Expiry acotado para suspensiones async** (poner `expiresInSeconds` en el suspendedState del offload) → el
   `SuspensionExpiryScheduler` las reap-ea si nunca se entregan, dándoles un límite superior.

Ambas son de **operabilidad fina**, no de correctitud, y **fuera del money-path**. Recomiendo **cerrar P9 como "no
requiere el fix del review"** y, si acaso, agendar la (1) como mejora menor de resiliencia.

### Veredicto del meta-análisis
Como P5, el review sobre-dimensionó P9: "fallar cerrada" asume que offloadar con el broker caído es un bug, pero es el
comportamiento **intencional** del transactional outbox (resiliencia). El front ya es advisory; el backend ya es durable
(outbox + relay + redrive + expiry). El único residuo real (suspensión async sin expiry → depende de redrive manual ante
outage sostenido) es menor y se cubre con un redrive programado, no con un guard en dispatch.
