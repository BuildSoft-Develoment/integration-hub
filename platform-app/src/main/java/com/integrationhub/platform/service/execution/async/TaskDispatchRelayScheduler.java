package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.service.messaging.MessageBrokerRegistry;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Drena periódicamente el outbox de despacho de tareas al broker (ADR-015), reutilizando el
 * {@link TaskOutboxRelay} (ya unit-tested) con el store JPA y el {@link MessageBrokerRegistry}.
 *
 * <p>Gated por {@code tasks.dispatch.enabled} (default {@code false}): mientras el loop async
 * completo (consumer + resume) no esté cerrado, no se drena nada, así el feature no afecta a la
 * ejecución existente. Se activa por config cuando el resto del loop esté verificado.</p>
 */
@ApplicationScoped
public class TaskDispatchRelayScheduler {

    private static final Logger LOG = Logger.getLogger(TaskDispatchRelayScheduler.class);

    private final TaskOutboxStore store;
    private final TaskOutboxRelay relay;
    private final MessageBrokerRegistry brokers;
    private final boolean enabled;
    private final int batchSize;
    private final int maxBatchesPerTick;

    @Inject
    public TaskDispatchRelayScheduler(
            TaskOutboxStore store,
            TaskOutboxRelay relay,
            MessageBrokerRegistry brokers,
            @ConfigProperty(name = "tasks.dispatch.enabled", defaultValue = "false") boolean enabled,
            @ConfigProperty(name = "tasks.relay.batch-size", defaultValue = "1000") int batchSize,
            @ConfigProperty(name = "tasks.relay.max-batches-per-tick", defaultValue = "50") int maxBatchesPerTick) {
        this.store = store;
        this.relay = relay;
        this.brokers = brokers;
        this.enabled = enabled;
        this.batchSize = Math.max(batchSize, 1);
        this.maxBatchesPerTick = Math.max(maxBatchesPerTick, 1);
    }

    /**
     * Drena en <b>bucle</b> hasta vaciar el outbox o alcanzar {@code max-batches-per-tick} (ADR-015,
     * F4 del doble check a escala). Un solo tick puede así drenar {@code batchSize × maxBatches}
     * work-items (p.ej. 1000 × 50 = 50k) en vez de un único lote de 100 → sin cuello de botella a
     * 1M. Corte: cuando un lote reclama menos de {@code batchSize} filas, ya no quedan vencidas.
     */
    @Scheduled(every = "{tasks.relay.every}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void drain() {
        if (!enabled) {
            return;
        }
        int sent = 0;
        int retried = 0;
        int dead = 0;
        for (int batch = 0; batch < maxBatchesPerTick; batch++) {
            var outcome = relay.drain(store, brokers::resolve, batchSize);
            var claimed = outcome.sent() + outcome.retried() + outcome.dead();
            sent += outcome.sent();
            retried += outcome.retried();
            dead += outcome.dead();
            if (claimed < batchSize) {
                break; // lote incompleto → no quedan filas vencidas: outbox drenado
            }
        }
        if (sent > 0 || retried > 0 || dead > 0) {
            LOG.infof("Task dispatch relay: sent=%d retried=%d dead=%d", sent, retried, dead);
        }
    }
}
