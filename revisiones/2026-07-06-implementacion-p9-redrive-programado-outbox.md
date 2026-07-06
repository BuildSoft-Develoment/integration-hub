# Implementación — P9 (recovery-side): redrive programado del outbox DEAD

Fecha: 2026-07-06
Alcance: la ÚNICA mejora que el [doble-check de P9](2026-07-06-analisis-p9-fail-closed-async.md) dejó en pie. El fix del
review ("fail-closed en dispatch") se **descartó** (contradice el transactional-outbox y rompe la suite async). Esto es
recovery-side, operabilidad fina, fuera del money-path. Autorizado por el usuario. Sin fallback.

## Contexto (del doble-check)

El despacho async usa un **transactional outbox**: una tarea se encola durable aunque el broker esté caído; el
`TaskOutboxRelay` entrega después (retry, `max-attempts=20` + backoff). Un outage **transitorio** se auto-recupera. Un
outage **sostenido** agota los intentos → la fila queda `DEAD` → el proceso queda **retenido** (SUSPENDED). Como las
suspensiones async no tienen expiry, el `SuspensionExpiryScheduler` no las rescata → hoy la recuperación depende de un
**redrive manual** por la consola de DLQ (`AsyncTaskDlqService.redriveOutboxDead`).

## Cambio (SOLID)

**`AsyncOutboxDeadRedriveScheduler`** (NUEVO): un `@Scheduled` que reanima periódicamente las filas `DEAD` del outbox a
`PENDING` (delegando en `redriveOutboxDead`, que ya resetea `attempts=0`). Cuando el broker vuelve, el proceso retenido se
recupera **solo**, sin operador; si sigue caído, el relay vuelve a agotar intentos y la fila regresa a `DEAD` — churn
acotado por el intervalo.

- **SRP**: el scheduler solo hace **gate + delegar**; el `DEAD→PENDING` real vive en `AsyncTaskDlqService`/repositorio (ya
  probado en `AsyncTaskDlqIT`).
- **Gated OFF por default** (`tasks.relay.dead-redrive.enabled=false`), como los demás schedulers async: se habilita junto
  con el despacho async. Intervalo `tasks.relay.dead-redrive.every` (default 300s), `max-per-sweep` (default 100). Un
  sistema sano sin filas `DEAD` lo ve como no-op (redriven=0, sin log).
- **No toca la decisión de dispatch**: offloadar con el broker caído es intencional en el patrón outbox (el doble-check lo
  confirmó); esto solo cierra el hueco de recuperación automática.

## Pruebas

- **`AsyncOutboxDeadRedriveSchedulerTest` (NUEVO, 3)**: barrido con `enabled` → llama `redriveOutboxDead(maxPerSweep)`;
  `disabled` → no-op (no lo llama); un fallo del barrido **no propaga** (el scheduler sobrevive al próximo tick).
- El `DEAD→PENDING` real ya está cubierto por `AsyncTaskDlqIT` (servicio/repositorio).
- Boot CDI/@Scheduled confirmado al levantar el app.

## Alcance / honestidad

- **Baja prioridad / operabilidad fina**: reduce el hueco residual (proceso retenido ante outage sostenido → recuperación
  manual) a recuperación automática cuando el broker vuelve. No es correctitud ni money-path.
- **No implementa** el "fail-closed en dispatch" del review — descartado por el doble-check (rompería el outbox y los tests).

## Estado

Backlog del review **cerrado**: P2 y P3 (los P0 reales) implementados + verificados; P5 y P9 descartados/degradados por sus
doble-checks (con esta mejora menor de P9 hecha); P1/P7/P8 ya estaban. Pendientes agendables menores: expiry acotado para
suspensiones async (P9-b), línea física CSV (P10), validación STATUS por banco (P11).
