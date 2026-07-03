package com.integrationhub.platform.service.execution.async;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.entity.TaskDispatchOutbox;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Adaptador JPA de {@link TaskOutboxStore} (tabla {@code task_dispatch_outbox}, patrón
 * {@code audit_spool}). Reclama con {@code for update skip locked} para que varias réplicas no
 * publiquen la misma fila, y recupera leases atascados (IN_FLIGHT antiguos). El
 * {@link TaskOutboxRelay} (ya unit-tested contra el puerto) es quien lo drena.
 */
@ApplicationScoped
public class JpaTaskOutboxStore implements TaskOutboxStore, PanacheRepository<TaskDispatchOutbox> {

    /** Tras este tiempo un IN_FLIGHT se considera lease atascado y se re-reclama. */
    private static final Duration LEASE_TIMEOUT = Duration.ofMinutes(5);

    private final ObjectMapper objectMapper;
    private final String node;

    @Inject
    public JpaTaskOutboxStore(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.node = "task-relay-" + Long.toHexString(System.nanoTime());
    }

    /** Encola un work-item (idempotente por {@code idempotencyKey}). */
    @Transactional
    public void enqueue(AsyncTaskEnvelope envelope) {
        if (count("idempotencyKey", envelope.idempotencyKey()) > 0) {
            return;
        }
        var row = new TaskDispatchOutbox();
        row.idempotencyKey = envelope.idempotencyKey();
        row.transport = envelope.transport();
        row.envelopeJson = writeJson(envelope);
        persist(row);
    }

    @Override
    @Transactional
    @SuppressWarnings("unchecked")
    public List<PendingTask> claimPending(int batchSize) {
        if (batchSize <= 0) {
            return List.of();
        }
        var sql = """
                update task_dispatch_outbox
                   set status = ?1, locked_by = ?2, locked_at = current_timestamp
                 where id in (
                       select id from task_dispatch_outbox
                        where (status = ?3 and next_attempt_at <= current_timestamp)
                           or (status = ?1 and locked_at < ?4)
                        order by id asc
                        for update skip locked
                        limit ?5
                 )
                returning *
                """;
        List<TaskDispatchOutbox> claimed = getEntityManager()
                .createNativeQuery(sql, TaskDispatchOutbox.class)
                .setParameter(1, TaskDispatchOutbox.IN_FLIGHT)
                .setParameter(2, node)
                .setParameter(3, TaskDispatchOutbox.PENDING)
                .setParameter(4, Timestamp.valueOf(LocalDateTime.now().minus(LEASE_TIMEOUT)))
                .setParameter(5, batchSize)
                .getResultList();

        var pending = new ArrayList<PendingTask>(claimed.size());
        for (var row : claimed) {
            pending.add(new PendingTask(row.id, row.attempts, readJson(row.envelopeJson)));
        }
        return pending;
    }

    @Override
    @Transactional
    public void markSent(long outboxId, String reference) {
        update("status = ?1, sentAt = ?2, reference = ?3, lockedBy = null, lockedAt = null where id = ?4",
                TaskDispatchOutbox.SENT, LocalDateTime.now(), reference, outboxId);
    }

    @Override
    @Transactional
    public void markRetry(long outboxId, int nextAttempt, long backoffMillis) {
        update("status = ?1, attempts = ?2, nextAttemptAt = ?3, lockedBy = null, lockedAt = null where id = ?4",
                TaskDispatchOutbox.PENDING, nextAttempt,
                LocalDateTime.now().plus(Duration.ofMillis(Math.max(backoffMillis, 0))), outboxId);
    }

    @Override
    @Transactional
    public void markDead(long outboxId, String error) {
        update("status = ?1, lastError = ?2, lockedBy = null, lockedAt = null where id = ?3",
                TaskDispatchOutbox.DEAD, error, outboxId);
    }

    private String writeJson(AsyncTaskEnvelope envelope) {
        try {
            return objectMapper.writeValueAsString(envelope);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("No se pudo serializar el AsyncTaskEnvelope", ex);
        }
    }

    private AsyncTaskEnvelope readJson(String json) {
        try {
            return objectMapper.readValue(json, AsyncTaskEnvelope.class);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("AsyncTaskEnvelope corrupto en el outbox", ex);
        }
    }
}
