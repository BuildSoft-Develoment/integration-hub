package com.integrationhub.platform.service.execution.async;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.entity.TaskDispatchOutbox;
import com.integrationhub.platform.repository.TaskDispatchOutboxRepository;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Adaptador JPA del puerto {@link TaskOutboxStore} (ADR-015). Responsabilidad única: **mapear**
 * entre el dominio ({@link AsyncTaskEnvelope}) y las filas del outbox, delimitar la transacción, y
 * derivar la identidad de lease. El acceso a datos (SQL, {@code skip locked}) vive en
 * {@link TaskDispatchOutboxRepository}; la (de)serialización {@code envelope ↔ JSON} se delega al
 * {@link AsyncTaskMessageCodec} (única fuente de verdad, compartida con el wire-format). El
 * {@link TaskOutboxRelay} depende solo del puerto (DIP).
 */
@ApplicationScoped
public class JpaTaskOutboxStore implements TaskOutboxStore {

    /** Tras este tiempo un IN_FLIGHT se considera lease atascado y se re-reclama. */
    private static final Duration LEASE_TIMEOUT = Duration.ofMinutes(5);

    private final TaskDispatchOutboxRepository repository;
    private final ObjectMapper objectMapper;
    private final String node;

    @Inject
    public JpaTaskOutboxStore(TaskDispatchOutboxRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.node = "task-relay-" + Long.toHexString(System.nanoTime());
    }

    /** Encola un work-item (idempotente por {@code idempotencyKey}). */
    @Transactional
    public void enqueue(AsyncTaskEnvelope envelope) {
        if (repository.existsByIdempotencyKey(envelope.idempotencyKey())) {
            return;
        }
        var row = new TaskDispatchOutbox();
        row.idempotencyKey = envelope.idempotencyKey();
        row.transport = envelope.transport();
        row.envelopeJson = AsyncTaskMessageCodec.encode(envelope, objectMapper);
        repository.persist(row);
    }

    @Override
    @Transactional
    public List<PendingTask> claimPending(int batchSize) {
        var claimed = repository.claimDue(batchSize, node, LocalDateTime.now().minus(LEASE_TIMEOUT));
        var pending = new ArrayList<PendingTask>(claimed.size());
        for (var row : claimed) {
            pending.add(new PendingTask(row.id, row.attempts,
                    AsyncTaskMessageCodec.decode(row.envelopeJson, objectMapper)));
        }
        return pending;
    }

    @Override
    @Transactional
    public void markSent(long outboxId, String reference) {
        repository.markSent(outboxId, reference);
    }

    @Override
    @Transactional
    public void markRetry(long outboxId, int nextAttempt, long backoffMillis) {
        repository.markRetry(outboxId, nextAttempt,
                LocalDateTime.now().plus(Duration.ofMillis(Math.max(backoffMillis, 0))));
    }

    @Override
    @Transactional
    public void markDead(long outboxId, String error) {
        repository.markDead(outboxId, error);
    }
}
