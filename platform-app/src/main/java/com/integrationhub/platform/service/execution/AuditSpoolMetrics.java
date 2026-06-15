package com.integrationhub.platform.service.execution;

import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Expone metricas Micrometer/Prometheus del spool de auditoria para alertas
 * automaticas (lo que el endpoint /audit-spool/summary da manual). Un snapshot
 * periodico evita N consultas por scrape: los gauges leen los campos cacheados.
 *
 * <p>Gauges (visibles en {@code /q/metrics}):
 * {@code audit_spool_pending}, {@code audit_spool_in_flight}, {@code audit_spool_sent},
 * {@code audit_spool_dead}, {@code audit_dead_letter_total},
 * {@code audit_spool_oldest_pending_age_seconds}.</p>
 */
@ApplicationScoped
public class AuditSpoolMetrics {

    private final AuditSpoolOperationsService operationsService;

    private volatile double pending;
    private volatile double inFlight;
    private volatile double sent;
    private volatile double dead;
    private volatile double deadLetter;
    private volatile double oldestPendingAgeSeconds;

    @Inject
    public AuditSpoolMetrics(MeterRegistry registry, AuditSpoolOperationsService operationsService) {
        this.operationsService = operationsService;
        Gauge.builder("audit_spool_pending", this, m -> m.pending).register(registry);
        Gauge.builder("audit_spool_in_flight", this, m -> m.inFlight).register(registry);
        Gauge.builder("audit_spool_sent", this, m -> m.sent).register(registry);
        Gauge.builder("audit_spool_dead", this, m -> m.dead).register(registry);
        Gauge.builder("audit_dead_letter_total", this, m -> m.deadLetter).register(registry);
        Gauge.builder("audit_spool_oldest_pending_age_seconds", this, m -> m.oldestPendingAgeSeconds)
                .register(registry);
    }

    @Scheduled(every = "{audit.metrics.refresh.every}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    public void refresh() {
        var summary = operationsService.summary();
        pending = summary.pending();
        inFlight = summary.inFlight();
        sent = summary.sent();
        dead = summary.dead();
        deadLetter = operationsService.deadLetterCount();
        oldestPendingAgeSeconds = ageSeconds(summary.oldestPendingCreatedAt());
    }

    private double ageSeconds(LocalDateTime oldest) {
        if (oldest == null) {
            return 0;
        }
        return Math.max(0, Duration.between(oldest, LocalDateTime.now()).toSeconds());
    }
}
