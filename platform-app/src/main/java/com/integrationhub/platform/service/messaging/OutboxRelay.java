package com.integrationhub.platform.service.messaging;

import com.integrationhub.platform.entity.AuditSpool;
import com.integrationhub.platform.spi.messaging.OutboundMessage;
import io.quarkus.runtime.StartupEvent;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.event.Observes;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.net.InetAddress;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Drena el spool durable de auditoria al MQ de forma asincrona, fuera del
 * hot-path de negocio. Reclama PENDING/IN_FLIGHT vencidos con lease, publica via
 * el SPI del broker resuelto por configuracion y marca SENT al confirmar.
 *
 * <p>At-least-once: si el broker configurado no confirma, la trama queda
 * PENDING y se reintenta en el siguiente tick. Si el broker no existe, la
 * aplicacion falla al arrancar; no hay fallback silencioso.</p>
 */
@ApplicationScoped
public class OutboxRelay {

    private static final Logger LOG = Logger.getLogger(OutboxRelay.class);

    private final AuditSpoolRelayStore relayStore;
    private final MessageBrokerRegistry brokerRegistry;
    private final boolean enabled;
    private final String brokerType;
    private final int batchSize;
    private final int maxBatchesPerTick;
    private final long maxDurationMs;
    private final long leaseSeconds;
    private final int maxAttempts;
    private final long backoffBaseMs;
    private final long backoffMaxMs;
    private final String relayId;

    @Inject
    public OutboxRelay(AuditSpoolRelayStore relayStore,
                       MessageBrokerRegistry brokerRegistry,
                       @ConfigProperty(name = "audit.relay.enabled", defaultValue = "true") boolean enabled,
                       @ConfigProperty(name = "audit.broker.type", defaultValue = "KAFKA") String brokerType,
                       @ConfigProperty(name = "audit.relay.batch-size", defaultValue = "1000") int batchSize,
                       @ConfigProperty(name = "audit.relay.max-batches-per-tick", defaultValue = "10") int maxBatchesPerTick,
                       @ConfigProperty(name = "audit.relay.max-duration-ms", defaultValue = "1000") long maxDurationMs,
                       @ConfigProperty(name = "audit.relay.lease-seconds", defaultValue = "60") long leaseSeconds,
                       @ConfigProperty(name = "audit.relay.max-attempts", defaultValue = "20") int maxAttempts,
                       @ConfigProperty(name = "audit.relay.backoff-base-ms", defaultValue = "1000") long backoffBaseMs,
                       @ConfigProperty(name = "audit.relay.backoff-max-ms", defaultValue = "300000") long backoffMaxMs) {
        this.relayStore = relayStore;
        this.brokerRegistry = brokerRegistry;
        this.enabled = enabled;
        this.brokerType = brokerType;
        this.batchSize = batchSize;
        this.maxBatchesPerTick = maxBatchesPerTick;
        this.maxDurationMs = maxDurationMs;
        this.leaseSeconds = leaseSeconds;
        this.maxAttempts = maxAttempts;
        this.backoffBaseMs = backoffBaseMs;
        this.backoffMaxMs = backoffMaxMs;
        this.relayId = resolveRelayId();
    }

    @Scheduled(every = "{audit.relay.every}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    public void drain() {
        if (!enabled) {
            return;
        }
        var publisher = brokerRegistry.resolve(brokerType).publisher();
        var startedAt = System.nanoTime();
        for (int batch = 0; batch < maxBatchesPerTick && withinBudget(startedAt); batch++) {
            var claimed = relayStore.claimDue(batchSize, relayId,
                    LocalDateTime.now().minusSeconds(leaseSeconds));
            if (claimed.isEmpty()) {
                return;
            }
            for (var row : claimed) {
                try {
                    var result = publisher.publish(new OutboundMessage(
                            row.topic, row.partitionKey, row.payload, Map.of()));
                    if (result.accepted()) {
                        relayStore.markSent(row.id);
                    } else {
                        retryOrDead(row, result.error());
                        LOG.warnf("Audit relay: broker rejected event %s: %s", row.eventId, result.error());
                    }
                } catch (RuntimeException e) {
                    retryOrDead(row, e.getMessage());
                    LOG.warnf(e, "Audit relay: error publishing event %s", row.eventId);
                }
            }
        }
    }

    void validateBrokerAtStartup(@Observes StartupEvent ignored) {
        if (enabled) {
            brokerRegistry.resolve(brokerType);
        }
    }

    private void retryOrDead(AuditSpool row, String error) {
        var nextAttemptNumber = row.attempts + 1;
        var message = error == null || error.isBlank() ? "broker rejected without detail" : error;
        if (nextAttemptNumber >= maxAttempts) {
            relayStore.markDead(row.id, message);
            LOG.errorf("Audit relay: event %s moved to DEAD after %d attempts: %s",
                    row.eventId, nextAttemptNumber, message);
            return;
        }
        relayStore.markRetry(row.id, message,
                LocalDateTime.now().plus(backoff(nextAttemptNumber)));
    }

    private Duration backoff(int attempt) {
        var shift = Math.min(Math.max(attempt - 1, 0), 20);
        var delay = Math.min(backoffBaseMs * (1L << shift), backoffMaxMs);
        return Duration.ofMillis(Math.max(delay, 0));
    }

    private boolean withinBudget(long startedAt) {
        if (maxDurationMs <= 0) {
            return true;
        }
        return Duration.ofNanos(System.nanoTime() - startedAt).toMillis() < maxDurationMs;
    }

    private String resolveRelayId() {
        try {
            return InetAddress.getLocalHost().getHostName() + "-" + UUID.randomUUID();
        } catch (Exception ignored) {
            return "relay-" + UUID.randomUUID();
        }
    }
}
