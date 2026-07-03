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

    private final JpaTaskOutboxStore store;
    private final TaskOutboxRelay relay;
    private final MessageBrokerRegistry brokers;
    private final boolean enabled;
    private final int batchSize;

    @Inject
    public TaskDispatchRelayScheduler(
            JpaTaskOutboxStore store,
            TaskOutboxRelay relay,
            MessageBrokerRegistry brokers,
            @ConfigProperty(name = "tasks.dispatch.enabled", defaultValue = "false") boolean enabled,
            @ConfigProperty(name = "tasks.relay.batch-size", defaultValue = "100") int batchSize) {
        this.store = store;
        this.relay = relay;
        this.brokers = brokers;
        this.enabled = enabled;
        this.batchSize = Math.max(batchSize, 1);
    }

    @Scheduled(every = "{tasks.relay.every}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void drain() {
        if (!enabled) {
            return;
        }
        var outcome = relay.drain(store, brokers::resolve, batchSize);
        if (outcome.sent() > 0 || outcome.retried() > 0 || outcome.dead() > 0) {
            LOG.infof("Task dispatch relay: sent=%d retried=%d dead=%d",
                    outcome.sent(), outcome.retried(), outcome.dead());
        }
    }
}
