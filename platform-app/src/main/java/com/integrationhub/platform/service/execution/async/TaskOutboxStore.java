package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.task.AsyncTaskEnvelope;

import java.util.List;

/**
 * Puerto de persistencia del outbox de despacho de tareas (ADR-015). El adaptador
 * JPA (tabla {@code task_dispatch_outbox}, patron {@code audit_spool}) lo
 * implementa; el relay depende solo de este puerto, por lo que su logica de
 * sent/retry/dead es testeable con un fake en memoria, sin DB.
 */
public interface TaskOutboxStore {

    /** Encola un work-item (idempotente por {@code idempotencyKey}); lado productor. */
    void enqueue(AsyncTaskEnvelope envelope);

    /** Reclama hasta {@code batchSize} work-items pendientes (con lease). */
    List<PendingTask> claimPending(int batchSize);

    void markSent(long outboxId, String reference);

    void markRetry(long outboxId, int nextAttempt, long backoffMillis);

    void markDead(long outboxId, String error);

    record PendingTask(long outboxId, int attempt, AsyncTaskEnvelope envelope) {
    }
}
