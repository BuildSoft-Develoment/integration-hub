// @trace RF-008 (observabilidad-y-auditoria: operaciones del spool)
package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.entity.AuditSpool;
import com.integrationhub.platform.repository.AuditSpoolRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** Operaciones de consulta y mantenimiento del spool de auditoria. */
@ApplicationScoped
public class AuditSpoolOperationsService {

    private final AuditSpoolRepository repository;

    public AuditSpoolOperationsService(AuditSpoolRepository repository) {
        this.repository = repository;
    }

    public Summary summary() {
        return new Summary(
                repository.countByStatus(AuditSpool.PENDING),
                repository.countByStatus(AuditSpool.IN_FLIGHT),
                repository.countByStatus(AuditSpool.SENT),
                repository.countByStatus(AuditSpool.DEAD),
                repository.oldestPendingCreatedAt());
    }

    public List<AuditSpool> deadEvents(int limit) {
        return repository.findDead(Math.min(Math.max(limit, 1), 500));
    }

    @Transactional
    public void retryDead(Long id) {
        repository.retryDead(id);
    }

    @Transactional
    public long cleanupSent(int retentionDays, int limit) {
        var days = Math.max(retentionDays, 1);
        var cappedLimit = Math.min(Math.max(limit, 1), 100_000);
        return repository.cleanupSentOlderThan(LocalDateTime.now().minusDays(days), cappedLimit);
    }

    public long deadLetterCount() {
        return repository.countDeadLetterEvents();
    }

    @Transactional
    public long cleanupDeadLetters(int retentionDays, int limit) {
        var days = Math.max(retentionDays, 1);
        var cappedLimit = Math.min(Math.max(limit, 1), 100_000);
        return repository.cleanupDeadLettersOlderThan(LocalDateTime.now().minusDays(days), cappedLimit);
    }

    public record Summary(long pending,
                          long inFlight,
                          long sent,
                          long dead,
                          LocalDateTime oldestPendingCreatedAt) {
    }
}
