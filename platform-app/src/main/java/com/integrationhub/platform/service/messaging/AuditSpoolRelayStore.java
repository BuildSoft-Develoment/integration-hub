package com.integrationhub.platform.service.messaging;

import com.integrationhub.platform.entity.AuditSpool;
import com.integrationhub.platform.repository.AuditSpoolRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Capa transaccional del relay. Mantiene las operaciones de claiming/estado en
 * mini-transacciones separadas para no publicar al broker dentro de una TX JDBC.
 */
@ApplicationScoped
public class AuditSpoolRelayStore {

    private final AuditSpoolRepository repository;

    public AuditSpoolRelayStore(AuditSpoolRepository repository) {
        this.repository = repository;
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public List<AuditSpool> claimDue(int limit, String lockedBy, LocalDateTime staleBefore) {
        return repository.claimDue(limit, lockedBy, staleBefore);
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void markSent(Long id) {
        repository.markSent(id);
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void markRetry(Long id, String error, LocalDateTime nextAttemptAt) {
        repository.markRetry(id, error, nextAttemptAt);
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void markDead(Long id, String error) {
        repository.markDead(id, error);
    }
}
