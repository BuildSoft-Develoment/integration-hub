package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.entity.TaskDispatchOutbox;
import com.integrationhub.platform.entity.TaskInbox;
import com.integrationhub.platform.repository.TaskDispatchOutboxRepository;
import com.integrationhub.platform.repository.TaskInboxRepository;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

/**
 * Métricas Micrometer/Prometheus del pipeline async (ADR-015, grupo 3 del doble check a escala),
 * espejo de {@code AuditSpoolMetrics}. Un snapshot periódico cachea los conteos para que cada scrape
 * no dispare N consultas.
 *
 * <p>Gauges (en {@code /q/metrics}):
 * {@code tasks_outbox_pending|in_flight|sent|dead}, {@code tasks_inbox_processed|failed|dead|poison}.
 * Alimentan alertas: p.ej. {@code tasks_outbox_dead} o {@code tasks_inbox_poison} creciendo = revisar
 * DLQ; {@code tasks_outbox_pending} alto sostenido = el relay no drena a tiempo.</p>
 */
@ApplicationScoped
public class AsyncTaskMetrics {

    private final TaskDispatchOutboxRepository outboxRepository;
    private final TaskInboxRepository inboxRepository;

    private volatile double outboxPending;
    private volatile double outboxInFlight;
    private volatile double outboxSent;
    private volatile double outboxDead;
    private volatile double inboxProcessed;
    private volatile double inboxFailed;
    private volatile double inboxDead;
    private volatile double inboxPoison;

    @Inject
    public AsyncTaskMetrics(MeterRegistry registry,
                            TaskDispatchOutboxRepository outboxRepository,
                            TaskInboxRepository inboxRepository) {
        this.outboxRepository = outboxRepository;
        this.inboxRepository = inboxRepository;
        Gauge.builder("tasks_outbox_pending", this, m -> m.outboxPending).register(registry);
        Gauge.builder("tasks_outbox_in_flight", this, m -> m.outboxInFlight).register(registry);
        Gauge.builder("tasks_outbox_sent", this, m -> m.outboxSent).register(registry);
        Gauge.builder("tasks_outbox_dead", this, m -> m.outboxDead).register(registry);
        Gauge.builder("tasks_inbox_processed", this, m -> m.inboxProcessed).register(registry);
        Gauge.builder("tasks_inbox_failed", this, m -> m.inboxFailed).register(registry);
        Gauge.builder("tasks_inbox_dead", this, m -> m.inboxDead).register(registry);
        Gauge.builder("tasks_inbox_poison", this, m -> m.inboxPoison).register(registry);
    }

    @Scheduled(every = "{tasks.metrics.refresh.every}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    @Transactional
    public void refresh() {
        outboxPending = outboxRepository.countByStatus(TaskDispatchOutbox.PENDING);
        outboxInFlight = outboxRepository.countByStatus(TaskDispatchOutbox.IN_FLIGHT);
        outboxSent = outboxRepository.countByStatus(TaskDispatchOutbox.SENT);
        outboxDead = outboxRepository.countByStatus(TaskDispatchOutbox.DEAD);
        inboxProcessed = inboxRepository.countByStatus(TaskInbox.PROCESSED);
        inboxFailed = inboxRepository.countByStatus(TaskInbox.FAILED);
        inboxDead = inboxRepository.countByStatus(TaskInbox.DEAD);
        inboxPoison = inboxRepository.countByStatus(TaskInbox.POISON);
    }
}
