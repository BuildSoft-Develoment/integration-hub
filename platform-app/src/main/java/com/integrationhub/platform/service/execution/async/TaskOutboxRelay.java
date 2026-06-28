package com.integrationhub.platform.service.execution.async;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Drena el outbox de despacho de tareas y publica cada work-item al broker
 * (ADR-015). Espejo del relay de auditoria: ante un fallo de publicacion aplica
 * backoff/reintento y, agotados los intentos, manda a dead-letter; nunca propaga.
 *
 * <p>Depende de los puertos {@link TaskOutboxStore} y {@link BrokerResolver}, asi
 * que su logica es unit-testable con fakes (sin DB ni broker real).</p>
 */
@ApplicationScoped
public class TaskOutboxRelay {

    private final TaskDispatchPublisher publisher;
    private final TaskOutboxRetryPolicy policy;

    @Inject
    public TaskOutboxRelay(
            TaskDispatchPublisher publisher,
            @ConfigProperty(name = "tasks.relay.max-attempts", defaultValue = "20") int maxAttempts,
            @ConfigProperty(name = "tasks.relay.backoff-base-ms", defaultValue = "1000") long backoffBaseMs,
            @ConfigProperty(name = "tasks.relay.backoff-max-ms", defaultValue = "300000") long backoffMaxMs) {
        this(publisher, new TaskOutboxRetryPolicy(maxAttempts, backoffBaseMs, backoffMaxMs));
    }

    public TaskOutboxRelay(TaskDispatchPublisher publisher, TaskOutboxRetryPolicy policy) {
        this.publisher = publisher;
        this.policy = policy;
    }

    public RelayOutcome drain(TaskOutboxStore store, BrokerResolver brokers, int batchSize) {
        int sent = 0;
        int retried = 0;
        int dead = 0;

        for (var pending : store.claimPending(batchSize)) {
            String failure;
            try {
                var broker = brokers.resolve(pending.envelope().transport());
                var result = publisher.publish(broker, pending.envelope());
                if (result.accepted()) {
                    store.markSent(pending.outboxId(), result.reference());
                    sent++;
                    continue;
                }
                failure = result.error();
            } catch (RuntimeException error) {
                failure = error.getMessage();
            }

            int nextAttempt = pending.attempt() + 1;
            if (policy.shouldRetry(nextAttempt)) {
                store.markRetry(pending.outboxId(), nextAttempt, policy.backoffMillis(nextAttempt));
                retried++;
            } else {
                store.markDead(pending.outboxId(), failure == null ? "unknown error" : failure);
                dead++;
            }
        }

        return new RelayOutcome(sent, retried, dead);
    }

    public record RelayOutcome(int sent, int retried, int dead) {
    }
}
