package com.integrationhub.platform.repository;

import com.integrationhub.platform.entity.AuditSpool;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

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

    public void markSent(Long id) {
        update("spoolStatus = ?1, sentAt = ?2 where id = ?3",
                AuditSpool.SENT, LocalDateTime.now(), id);
    }

    public void markAttempt(Long id, String error) {
        update("attempts = attempts + 1, lastError = ?1 where id = ?2", error, id);
    }
}
