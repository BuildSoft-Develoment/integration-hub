package com.integrationhub.platform.repository;

import com.integrationhub.platform.entity.AuditSpool;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import org.hibernate.Session;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Acceso al spool durable de auditoria. El relay reclama filas con lock para
 * soportar multiples replicas sin publicar dos veces el mismo evento.
 */
@ApplicationScoped
public class AuditSpoolRepository implements PanacheRepository<AuditSpool> {

    /**
     * Reclama un lote vencido y lo deja IN_FLIGHT en una sola sentencia
     * transaccional. `SKIP LOCKED` evita que dos replicas publiquen la misma fila.
     */
    @SuppressWarnings("unchecked")
    public List<AuditSpool> claimDue(int limit, String lockedBy, LocalDateTime staleBefore) {
        if (limit <= 0) {
            return List.of();
        }
        var sql = """
                update audit_spool
                   set spool_status = ?1,
                       locked_by = ?2,
                       locked_at = current_timestamp
                 where id in (
                       select id
                         from audit_spool
                        where (spool_status = ?3 and (next_attempt_at is null or next_attempt_at <= current_timestamp))
                           or (spool_status = ?4 and locked_at < ?5)
                        order by id asc
                        for update skip locked
                        limit ?6
                 )
                returning *
                """;
        return getEntityManager()
                .createNativeQuery(sql, AuditSpool.class)
                .setParameter(1, AuditSpool.IN_FLIGHT)
                .setParameter(2, lockedBy)
                .setParameter(3, AuditSpool.PENDING)
                .setParameter(4, AuditSpool.IN_FLIGHT)
                .setParameter(5, Timestamp.valueOf(staleBefore))
                .setParameter(6, limit)
                .getResultList();
    }

    /**
     * Inserta un lote de tramas con un unico JDBC batch (eficiente a 1M+). Usado
     * por la emision de auditoria a nivel de registro del flujo masivo.
     */
    public void persistBatch(List<AuditSpool> rows) {
        if (rows == null || rows.isEmpty()) {
            return;
        }
        var sql = "insert into audit_spool"
                + " (event_id, trace_id, topic, partition_key, payload, spool_status, attempts, created_at)"
                + " values (?, ?, ?, ?, ?, ?, 0, ?)";
        getEntityManager().unwrap(Session.class).doWork(connection -> {
            try (PreparedStatement statement = connection.prepareStatement(sql)) {
                for (var row : rows) {
                    statement.setString(1, row.eventId);
                    statement.setString(2, row.traceId);
                    statement.setString(3, row.topic);
                    statement.setString(4, row.partitionKey);
                    statement.setString(5, row.payload);
                    statement.setString(6, row.spoolStatus == null ? AuditSpool.PENDING : row.spoolStatus);
                    statement.setTimestamp(7, Timestamp.valueOf(
                            row.createdAt == null ? LocalDateTime.now() : row.createdAt));
                    statement.addBatch();
                }
                statement.executeBatch();
            }
        });
    }

    public void markSent(Long id) {
        update("spoolStatus = ?1, sentAt = ?2, lockedBy = null, lockedAt = null where id = ?3",
                AuditSpool.SENT, LocalDateTime.now(), id);
    }

    public void markRetry(Long id, String error, LocalDateTime nextAttemptAt) {
        update("spoolStatus = ?1, attempts = attempts + 1, lastError = ?2, nextAttemptAt = ?3, "
                        + "lockedBy = null, lockedAt = null where id = ?4",
                AuditSpool.PENDING, error, nextAttemptAt, id);
    }

    public void markDead(Long id, String error) {
        var now = LocalDateTime.now();
        update("spoolStatus = ?1, attempts = attempts + 1, lastError = ?2, deadReason = ?2, deadAt = ?3, "
                        + "lockedBy = null, lockedAt = null where id = ?4",
                AuditSpool.DEAD, error, now, id);
    }

    public void retryDead(Long id) {
        update("spoolStatus = ?1, nextAttemptAt = null, deadAt = null, deadReason = null, "
                        + "lockedBy = null, lockedAt = null where id = ?2 and spoolStatus = ?3",
                AuditSpool.PENDING, id, AuditSpool.DEAD);
    }

    public List<AuditSpool> findDead(int limit) {
        return find("spoolStatus = ?1 order by deadAt desc, id desc", AuditSpool.DEAD)
                .page(0, Math.max(limit, 1))
                .list();
    }

    public long countByStatus(String status) {
        return count("spoolStatus", status);
    }

    public LocalDateTime oldestPendingCreatedAt() {
        return find("spoolStatus in (?1, ?2) order by createdAt asc",
                AuditSpool.PENDING, AuditSpool.IN_FLIGHT)
                .firstResultOptional()
                .map(row -> row.createdAt)
                .orElse(null);
    }

    public long cleanupSentOlderThan(LocalDateTime cutoff, int limit) {
        var sql = """
                delete from audit_spool
                 where id in (
                       select id
                         from audit_spool
                        where spool_status = ?1
                          and sent_at < ?2
                        order by sent_at asc
                        limit ?3
                 )
                """;
        return getEntityManager()
                .createNativeQuery(sql)
                .setParameter(1, AuditSpool.SENT)
                .setParameter(2, Timestamp.valueOf(cutoff))
                .setParameter(3, Math.max(limit, 1))
                .executeUpdate();
    }
}
