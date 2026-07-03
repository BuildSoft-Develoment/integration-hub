package com.integrationhub.platform.repository;

import com.integrationhub.platform.entity.TaskDispatchOutbox;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Acceso a datos del outbox de despacho de tareas (ADR-015), en el mismo estilo que
 * {@link AuditSpoolRepository}. Solo conoce la entidad y la persistencia (SRP): la traducción
 * dominio↔fila y las transacciones viven en el adaptador del puerto ({@code JpaTaskOutboxStore}).
 * El {@code claim} usa {@code for update skip locked} para que varias réplicas no publiquen la
 * misma fila.
 */
@ApplicationScoped
public class TaskDispatchOutboxRepository implements PanacheRepository<TaskDispatchOutbox> {

    @SuppressWarnings("unchecked")
    public List<TaskDispatchOutbox> claimDue(int limit, String lockedBy, LocalDateTime staleBefore) {
        if (limit <= 0) {
            return List.of();
        }
        var sql = """
                update task_dispatch_outbox
                   set status = ?1,
                       locked_by = ?2,
                       locked_at = current_timestamp
                 where id in (
                       select id
                         from task_dispatch_outbox
                        where (status = ?3 and next_attempt_at <= current_timestamp)
                           or (status = ?1 and locked_at < ?4)
                        order by id asc
                        for update skip locked
                        limit ?5
                 )
                returning *
                """;
        return getEntityManager()
                .createNativeQuery(sql, TaskDispatchOutbox.class)
                .setParameter(1, TaskDispatchOutbox.IN_FLIGHT)
                .setParameter(2, lockedBy)
                .setParameter(3, TaskDispatchOutbox.PENDING)
                .setParameter(4, Timestamp.valueOf(staleBefore))
                .setParameter(5, limit)
                .getResultList();
    }

    public boolean existsByIdempotencyKey(String idempotencyKey) {
        return count("idempotencyKey", idempotencyKey) > 0;
    }

    public void markSent(Long id, String reference) {
        update("status = ?1, sentAt = ?2, reference = ?3, lockedBy = null, lockedAt = null where id = ?4",
                TaskDispatchOutbox.SENT, LocalDateTime.now(), reference, id);
    }

    public void markRetry(Long id, int attempt, LocalDateTime nextAttemptAt) {
        update("status = ?1, attempts = ?2, nextAttemptAt = ?3, lockedBy = null, lockedAt = null where id = ?4",
                TaskDispatchOutbox.PENDING, attempt, nextAttemptAt, id);
    }

    public void markDead(Long id, String error) {
        update("status = ?1, lastError = ?2, lockedBy = null, lockedAt = null where id = ?3",
                TaskDispatchOutbox.DEAD, error, id);
    }
}
