# Grupo 3 (operabilidad): DLQ admin + recuperación de suspensiones colgadas — 2026-07-02

Cierra 3c (admin del DLQ async) y 3a (recuperación de procesos atascados), además de 3b/3d/3e ya
entregados (métricas + resiliencia del conector).

## 3c — visibilidad y redrive del DLQ async

- **`AsyncTaskDlqService`** + **`AsyncTaskDlqResource`** (`/api/query/tasks-dlq`, role-gated):
  - `GET /summary` → conteos DEAD del outbox e inbox + POISON del inbox.
  - `POST /outbox/redrive` → reanima filas `DEAD` del outbox a `PENDING` (attempts=0) → el relay
    reintenta publicar. Idempotente aguas abajo (el consumer descarta por idempotencyKey).

## 3a — recuperación de una suspensión async colgada (la red que faltaba)

Las suspensiones async **no** fijan `_resumeAfterSeconds`, así que el `SuspensionExpiryScheduler` no
las toca (y además reanuda re-invocando al provider, inválido para async). Si un work-item muere en el
consumer (tipo/config → `DEAD` en inbox) o su trama se pierde, el proceso queda **suspendido sin
auto-recuperación**. Ahora:

- `POST /suspensions/{peId}/{tdId}/requeue` → `requeueSuspension`: si la tarea sigue suspendida,
  **reconstruye** el `AsyncTaskEnvelope` determinista desde la configuración de la tarea
  (`AsyncTaskDispatchService.buildEnvelope`, ungated), **limpia el dedup** en ambos lados (borra la
  fila previa del outbox —cualquier estado, si no chocaría el enqueue por idempotencyKey— y la fila
  `DEAD`/`POISON` del inbox) y **encola** fresco. El relay lo publica y el consumer lo procesa hasta
  completar el proceso.

## Detalle de correctitud

- El `enqueue` dedup por `idempotencyKey` en **cualquier** estado, por eso el requeue borra primero la
  fila previa del outbox; la secuencia es *bulk-delete → persist* (Panache ejecuta el DELETE de
  inmediato, el INSERT va al commit) → sin chocar el índice único.
- El requeue devuelve `false` si no hay suspensión activa (idempotente / seguro).

## Pruebas

- **`AsyncTaskDlqIT`** (Postgres) **3/3**: `redriveOutboxDead` reanima solo los DEAD (deja SENT);
  `requeueSuspension` devuelve false sin suspensión; y para una suspensión async real (creada por el
  motor con el flag on) cuyo item se "murió" (outbox→DEAD + inbox DEAD), el requeue deja **una** fila
  `PENDING` fresca con la misma clave y **limpia** el DEAD del inbox.
- (3b) `AsyncTaskMetricsIT` 1/1 y (config 3d/3e) sin regresión del canal (`AsyncTaskKafkaConsumerE2EIT`
  1/1) ya verificados en el commit previo.

## Estado del grupo 3

| # | Item | Estado |
|---|---|---|
| 3a | Recuperación de suspensión async colgada | **Hecho** (requeue) |
| 3b | Métricas Micrometer (outbox/inbox) | Hecho |
| 3c | Admin/redrive del DLQ async | **Hecho** |
| 3d | failure-strategy del conector | Hecho (config + doc) |
| 3e | Discovery de topics por patrón | Hecho (config) |

Pendiente opcional: automatizar el requeue (un scheduler que detecte suspensiones async atascadas y
llame a `requeueSuspension`) — hoy es manual por API, suficiente como red de recuperación.
