package com.integrationhub.auditconsumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.auditconsumer.coldstore.ColdStore;
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
    private final ColdStore coldStore;

    @Inject
    public AuditEventConsumer(ObjectMapper objectMapper, AuditEventWriter writer, ColdStore coldStore) {
        this.objectMapper = objectMapper;
        this.writer = writer;
        this.coldStore = coldStore;
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
            // Store frio (Postgres/ClickHouse segun config): trazabilidad E2E por registro.
            coldStore.write(envelope);
            return;
        }
        writer.insertProcessEvent(envelope);
    }
}
