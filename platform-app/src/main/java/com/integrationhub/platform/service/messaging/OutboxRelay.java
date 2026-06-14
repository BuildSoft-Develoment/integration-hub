package com.integrationhub.platform.service.messaging;

import com.integrationhub.platform.repository.AuditSpoolRepository;
import com.integrationhub.platform.spi.messaging.OutboundMessage;
import io.quarkus.runtime.StartupEvent;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.event.Observes;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.Map;

/**
 * Drena el spool durable de auditoria al MQ de forma asincrona, fuera del
 * hot-path de negocio. Lee PENDING en orden (keyset por id), publica via el SPI
 * del broker resuelto por configuracion y marca SENT al confirmar el broker.
 *
 * <p>At-least-once: si el broker configurado no confirma, la trama queda
 * PENDING y se reintenta en el siguiente tick. Si el broker no existe, la
 * aplicacion falla al arrancar; no hay fallback silencioso.</p>
 */
@ApplicationScoped
public class OutboxRelay {

    private static final Logger LOG = Logger.getLogger(OutboxRelay.class);

    private final AuditSpoolRepository spoolRepository;
    private final MessageBrokerRegistry brokerRegistry;
    private final boolean enabled;
    private final String brokerType;
    private final int batchSize;

    @Inject
    public OutboxRelay(AuditSpoolRepository spoolRepository,
                       MessageBrokerRegistry brokerRegistry,
                       @ConfigProperty(name = "audit.relay.enabled", defaultValue = "true") boolean enabled,
                       @ConfigProperty(name = "audit.broker.type", defaultValue = "KAFKA") String brokerType,
                       @ConfigProperty(name = "audit.relay.batch-size", defaultValue = "200") int batchSize) {
        this.spoolRepository = spoolRepository;
        this.brokerRegistry = brokerRegistry;
        this.enabled = enabled;
        this.brokerType = brokerType;
        this.batchSize = batchSize;
    }

    @Scheduled(every = "{audit.relay.every}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    @Transactional
    public void drain() {
        if (!enabled) {
            return;
        }
        var publisher = brokerRegistry.resolve(brokerType).publisher();
        var pending = spoolRepository.findPending(batchSize);
        for (var row : pending) {
            try {
                var result = publisher.publish(new OutboundMessage(
                        row.topic, row.partitionKey, row.payload, Map.of()));
                if (result.accepted()) {
                    spoolRepository.markSent(row.id);
                } else {
                    spoolRepository.markAttempt(row.id, result.error());
                    LOG.warnf("Audit relay: broker rejected event %s: %s", row.eventId, result.error());
                    break; // problema del broker: reintenta el lote en el siguiente tick
                }
            } catch (RuntimeException e) {
                spoolRepository.markAttempt(row.id, e.getMessage());
                LOG.warnf(e, "Audit relay: error publishing event %s", row.eventId);
                break;
            }
        }
    }

    void validateBrokerAtStartup(@Observes StartupEvent ignored) {
        if (enabled) {
            brokerRegistry.resolve(brokerType);
        }
    }
}
