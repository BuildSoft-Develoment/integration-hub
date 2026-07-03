# F3 (retención) + F4 (throughput del relay) — 2026-07-02

Implementa los dos hallazgos de operación a volumen del doble check a escala.

## F3 — retención de las tablas async

Sin cleanup, `task_inbox` (una fila por work-item procesado) y `task_dispatch_outbox` (filas SENT)
crecen sin límite a 1M+. Se replica el patrón de `AuditSpoolMaintenanceScheduler`.

- **`TaskInboxRepository`**: `cleanupProcessedOlderThan` (borra `PROCESSED`/`FAILED` viejos — el grueso
  del volumen, transitorios) y `cleanupDeadOlderThan` (borra `DEAD`/`POISON` con retención más larga —
  DLQ forense acotado). Borrado en lotes (`delete ... where id in (select ... limit)`).
- **`TaskDispatchOutboxRepository`**: `cleanupSentOlderThan` (SENT, transitorio) + `cleanupDeadOlderThan`.
- **`AsyncTaskRetentionScheduler`** (`@Scheduled every={tasks.retention.cleanup.every}`): purga las 4
  categorías con `retention-days` (default 7) y `dead-retention-days` (default 30), en lotes de
  `batch` (10000). Gated por `tasks.retention.cleanup.enabled` (default true; no-op si las tablas
  están vacías → seguro con el feature apagado).

## F4 — throughput del relay

Antes: `batch-size=100` × `every=5s` = ~20 msg/s → **~14 h para 1M**. Ahora el relay **drena en
bucle** dentro de un tick hasta vaciar el outbox o alcanzar `max-batches-per-tick`.

- `TaskDispatchRelayScheduler.drain()`: repite `relay.drain(...)` hasta que un lote reclame menos de
  `batch-size` (outbox drenado) o se alcance `max-batches-per-tick`. Un tick mueve hasta
  `batch-size × max-batches` = **1000 × 50 = 50k** work-items → ~10k msg/s → **1M en ~100 s**.
- Defaults nuevos: `tasks.relay.batch-size=1000` (antes 100), `tasks.relay.max-batches-per-tick=50`.
- El corte por "lote incompleto" evita bucle infinito; los retried (con `next_attempt_at` futuro) no
  se re-reclaman en el mismo tick; `concurrentExecution=SKIP` evita solaparse con el siguiente tick.

## Pruebas

- **`AsyncTaskRetentionIT`** (Postgres) **2/2**: la limpieza del inbox borra PROCESSED/FAILED viejos y
  conserva el reciente y los DEAD (hasta su retención de 30d, con un POISON de 40d sí purgado); la del
  outbox borra solo el SENT viejo y el DEAD de 40d, conservando el SENT reciente.
- **`TaskDispatchRelaySchedulerTest`** (unit, Mockito) **3/3**: drena en bucle hasta un lote incompleto;
  se detiene en `max-batches-per-tick` aunque queden más; no drena si está deshabilitado.
- Sin regresión: `TaskOutboxRelayTest` 4/4, `AsyncTaskConsumerTest` 8/8, `AsyncTaskDispatchServiceTest`
  6/6.

## Estado

F3 y F4 cerrados. Del doble check a escala quedan F1/F2 (ya corregidos antes) y F5 (límite de diseño
documentado: async por-tarea `once`, no por-record). El feature async está completo, verificado
end-to-end sobre Kafka, con retención y throughput aptos para volumen; todo gated OFF por defecto.
