package com.integrationhub.platform.service.execution.async;

import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * P9 (recovery-side) — redrive PROGRAMADO de filas {@code DEAD} del outbox de despacho async.
 *
 * <p>El despacho async usa un <b>transactional outbox</b>: una tarea se encola durable aunque el broker esté caído, y el
 * {@link TaskOutboxRelay} entrega después (con retry). Ante un outage <b>sostenido</b>, el relay agota sus intentos y la
 * fila queda {@code DEAD}; el proceso queda <b>retenido</b> (SUSPENDED) hasta que un operador la reanime por la consola
 * de DLQ. Las suspensiones async no tienen expiry, así que el {@code SuspensionExpiryScheduler} no las rescata.</p>
 *
 * <p>Este barrido reanima periódicamente las {@code DEAD} a {@code PENDING} ({@link AsyncTaskDlqService#redriveOutboxDead})
 * con un intervalo holgado: cuando el broker vuelve, el proceso retenido se recupera <b>solo</b>, sin acción manual. Si el
 * broker sigue caído, el relay vuelve a agotar intentos y la fila regresa a {@code DEAD} — churn acotado por el intervalo.
 * No cambia la decisión de dispatch (offloadar con el broker caído es intencional en el patrón outbox); solo cierra el
 * hueco de recuperación.</p>
 *
 * <p><b>Gated OFF</b> por {@code tasks.relay.dead-redrive.enabled} (default {@code false}), como los demás schedulers
 * async: se habilita junto con el despacho async. Un sistema sano sin filas {@code DEAD} lo ve como no-op.</p>
 */
@ApplicationScoped
public class AsyncOutboxDeadRedriveScheduler {

    private static final Logger LOG = Logger.getLogger(AsyncOutboxDeadRedriveScheduler.class);

    private final AsyncTaskDlqService dlqService;
    private final boolean enabled;
    private final int maxPerSweep;

    public AsyncOutboxDeadRedriveScheduler(
            AsyncTaskDlqService dlqService,
            @ConfigProperty(name = "tasks.relay.dead-redrive.enabled", defaultValue = "false") boolean enabled,
            @ConfigProperty(name = "tasks.relay.dead-redrive.max-per-sweep", defaultValue = "100") int maxPerSweep) {
        this.dlqService = dlqService;
        this.enabled = enabled;
        this.maxPerSweep = Math.max(1, maxPerSweep);
    }

    @Scheduled(every = "{tasks.relay.dead-redrive.every:300s}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    public void sweep() {
        if (!enabled) {
            return;
        }
        try {
            var redriven = dlqService.redriveOutboxDead(maxPerSweep);
            if (redriven > 0) {
                LOG.infof("Async outbox dead-redrive: %d fila(s) DEAD → PENDING (el relay reintenta)", redriven);
            }
        } catch (RuntimeException error) {
            LOG.warnf(error, "Async outbox dead-redrive: barrido falló; se reintenta en el próximo tick");
        }
    }
}
