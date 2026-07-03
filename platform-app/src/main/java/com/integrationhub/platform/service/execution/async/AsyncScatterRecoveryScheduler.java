package com.integrationhub.platform.service.execution.async;

import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.Duration;

/**
 * Auto-recuperación de la <b>page-chain</b> del scatter por table-streaming (ADR-015). Bajo
 * {@code failure-strategy=dead-letter-queue}, si una página muere/DLQ antes de encolar su sucesora la
 * cadena se rompe y el scatter queda <b>estancado</b> (PENDING, unsealed, sin más páginas). Este sweep
 * detecta esos scatters (sin progreso por &gt; {@code stall-threshold}) y re-inyecta su última página
 * ({@link AsyncTaskDlqService#recoverStalledStreamingScatters}) → la cadena reanuda automáticamente, sin
 * intervención de ops.
 *
 * <p><b>Gated OFF</b> por {@code tasks.async.recovery.enabled} (default {@code false}): el modo por
 * defecto ({@code failure-strategy=fail}) ya reanuda por restart+redelivery, así que el auto-resume solo
 * hace falta bajo {@code dead-letter-queue}. Seguro ante falsos positivos: re-inyectar una página de un
 * scatter que en realidad progresó/cerró es idempotente (dedup + cortocircuito por {@code isScatterTerminal}).</p>
 */
@ApplicationScoped
public class AsyncScatterRecoveryScheduler {

    private static final Logger LOG = Logger.getLogger(AsyncScatterRecoveryScheduler.class);

    private final AsyncTaskDlqService dlqService;
    private final boolean enabled;
    private final Duration stallThreshold;
    private final int maxPerSweep;

    @Inject
    public AsyncScatterRecoveryScheduler(
            AsyncTaskDlqService dlqService,
            @ConfigProperty(name = "tasks.async.recovery.enabled", defaultValue = "false") boolean enabled,
            @ConfigProperty(name = "tasks.async.recovery.stall-threshold", defaultValue = "5m") Duration stallThreshold,
            @ConfigProperty(name = "tasks.async.recovery.max-per-sweep", defaultValue = "50") int maxPerSweep) {
        this.dlqService = dlqService;
        this.enabled = enabled;
        this.stallThreshold = stallThreshold;
        this.maxPerSweep = Math.max(1, maxPerSweep);
    }

    @Scheduled(every = "{tasks.async.recovery.every:120s}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void sweep() {
        if (!enabled) {
            return;
        }
        try {
            dlqService.recoverStalledStreamingScatters(stallThreshold, maxPerSweep);
        } catch (RuntimeException error) {
            LOG.warnf(error, "Async scatter recovery: sweep falló; se reintenta en el próximo tick");
        }
    }
}
