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
 * Acceso al spool durable de auditoria. El relay drena en orden (keyset por id)
 * para preservar el orden de emision.
 */
@ApplicationScoped
public class AuditSpoolRepository implements PanacheRepository<AuditSpool> {

    /** Lote de pendientes en orden de emision (keyset por id, igual que el flujo masivo). */
    public List<AuditSpool> findPending(int limit) {
        return find("spoolStatus = ?1 order by id asc", AuditSpool.PENDING)
                .page(0, limit)
                .list();
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
        update("spoolStatus = ?1, sentAt = ?2 where id = ?3",
                AuditSpool.SENT, LocalDateTime.now(), id);
    }

    public void markAttempt(Long id, String error) {
        update("attempts = attempts + 1, lastError = ?1 where id = ?2", error, id);
    }
}
