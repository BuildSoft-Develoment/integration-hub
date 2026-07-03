package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.repository.TaskDispatchOutboxRepository;
import com.integrationhub.platform.repository.TaskInboxRepository;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.LocalDateTime;

/**
 * Retención automática de las tablas async (ADR-015, F3 del doble check a escala): purga
 * periódicamente los registros terminales transitorios del outbox ({@code SENT}) y del inbox
 * ({@code PROCESSED}/{@code FAILED}), y con retención más larga los del DLQ ({@code DEAD}/{@code POISON}).
 * Sin esto, a 1M+ work-items ambas tablas crecen sin límite (una fila por item, para siempre).
 *
 * <p>Espejo de {@code AuditSpoolMaintenanceScheduler}. Borra en lotes acotados para no bloquear.</p>
 */
@ApplicationScoped
public class AsyncTaskRetentionScheduler {

    private static final Logger LOG = Logger.getLogger(AsyncTaskRetentionScheduler.class);

    private final TaskInboxRepository inboxRepository;
    private final TaskDispatchOutboxRepository outboxRepository;
    private final boolean enabled;
    private final int retentionDays;
    private final int deadRetentionDays;
    private final int batchLimit;

    @Inject
    public AsyncTaskRetentionScheduler(
            TaskInboxRepository inboxRepository,
            TaskDispatchOutboxRepository outboxRepository,
            @ConfigProperty(name = "tasks.retention.cleanup.enabled", defaultValue = "true") boolean enabled,
            @ConfigProperty(name = "tasks.retention.cleanup.retention-days", defaultValue = "7") int retentionDays,
            @ConfigProperty(name = "tasks.retention.cleanup.dead-retention-days", defaultValue = "30") int deadRetentionDays,
            @ConfigProperty(name = "tasks.retention.cleanup.batch", defaultValue = "10000") int batchLimit) {
        this.inboxRepository = inboxRepository;
        this.outboxRepository = outboxRepository;
        this.enabled = enabled;
        this.retentionDays = retentionDays;
        this.deadRetentionDays = deadRetentionDays;
        this.batchLimit = batchLimit;
    }

    @Scheduled(every = "{tasks.retention.cleanup.every}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    public void cleanup() {
        if (!enabled) {
            return;
        }
        var terminalCutoff = LocalDateTime.now().minusDays(Math.max(retentionDays, 1));
        var deadCutoff = LocalDateTime.now().minusDays(Math.max(deadRetentionDays, 1));

        var outboxSent = outboxRepository.cleanupSentOlderThan(terminalCutoff, batchLimit);
        var outboxDead = outboxRepository.cleanupDeadOlderThan(deadCutoff, batchLimit);
        var inboxProcessed = inboxRepository.cleanupProcessedOlderThan(terminalCutoff, batchLimit);
        var inboxDead = inboxRepository.cleanupDeadOlderThan(deadCutoff, batchLimit);

        if (outboxSent + outboxDead + inboxProcessed + inboxDead > 0) {
            LOG.infof("Async task retention: outbox(sent=%d, dead=%d) inbox(processed=%d, dead=%d)",
                    outboxSent, outboxDead, inboxProcessed, inboxDead);
        }
    }
}
