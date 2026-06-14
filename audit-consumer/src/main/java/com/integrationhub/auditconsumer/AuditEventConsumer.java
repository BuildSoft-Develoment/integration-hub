package com.integrationhub.auditconsumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.audit.AuditLevel;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.reactive.messaging.Incoming;
import org.jboss.logging.Logger;

/**
 * Consume las tramas de auditoria del MQ y las registra:
 * <ul>
 *   <li>{@code PROCESS} -> {@code audit_event} (read-model de la UI).</li>
 *   <li>{@code RECORD}  -> store frio para trazabilidad E2E (fase 4; por ahora se loguea).</li>
 * </ul>
 *
 * <p>Una trama ilegible (poison) se descarta con log (ack) para no bloquear el
 * canal; un fallo de persistencia propaga -> nack -> reintrega at-least-once.</p>
 */
@ApplicationScoped
public class AuditEventConsumer {

    private static final Logger LOG = Logger.getLogger(AuditEventConsumer.class);

    private final ObjectMapper objectMapper;
    private final AuditEventWriter writer;

    @Inject
    public AuditEventConsumer(ObjectMapper objectMapper, AuditEventWriter writer) {
        this.objectMapper = objectMapper;
        this.writer = writer;
    }

    @Incoming("audit-in")
    public void consume(String payload) {
        AuditEnvelope envelope;
        try {
            envelope = objectMapper.readValue(payload, AuditEnvelope.class);
        } catch (Exception parseError) {
            LOG.warnf(parseError, "Audit consumer: discarding unparseable envelope: %s", payload);
            return; // ack: no reintentar un poison message
        }

        if (envelope.level() == AuditLevel.RECORD) {
            // Fase 4: store frio (ClickHouse/Elastic/lake) para trazabilidad E2E por registro.
            LOG.debugf("Audit consumer: RECORD event %s trace=%s record=%s (cold store pendiente)",
                    envelope.eventId(), envelope.traceId(), envelope.recordId());
            return;
        }
        writer.insertProcessEvent(envelope);
    }
}
