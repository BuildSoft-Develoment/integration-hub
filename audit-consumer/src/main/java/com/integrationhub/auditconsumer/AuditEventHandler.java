package com.integrationhub.auditconsumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.auditconsumer.coldstore.ColdStore;
import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.audit.AuditLevel;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.util.regex.Pattern;

/**
 * Caso de uso puro del consumidor: interpreta la trama comun y la persiste en
 * el read-model correspondiente. Los adapters Kafka/JMS/Rabbit/Redis solo se
 * encargan de sacar el texto del broker y delegar aqui.
 */
@ApplicationScoped
public class AuditEventHandler {

    private static final Logger LOG = Logger.getLogger(AuditEventHandler.class);
    private static final Pattern EVENT_ID_PATTERN = Pattern.compile("\"eventId\"\\s*:\\s*\"([^\"]+)\"");

    private final ObjectMapper objectMapper;
    private final AuditEventWriter writer;
    private final ColdStore coldStore;
    private final AuditDeadLetterWriter deadLetterWriter;

    @Inject
    public AuditEventHandler(ObjectMapper objectMapper,
                             AuditEventWriter writer,
                             ColdStore coldStore,
                             AuditDeadLetterWriter deadLetterWriter) {
        this.objectMapper = objectMapper;
        this.writer = writer;
        this.coldStore = coldStore;
        this.deadLetterWriter = deadLetterWriter;
    }

    public void handle(String payload, String brokerType, String topic) {
        AuditEnvelope envelope;
        try {
            envelope = objectMapper.readValue(payload, AuditEnvelope.class);
        } catch (Exception parseError) {
            var eventId = extractEventId(payload);
            deadLetterWriter.write(eventId, brokerType, topic, payload, parseError.getMessage());
            LOG.warnf(parseError, "Audit consumer: dead-lettered unparseable envelope from %s/%s", brokerType, topic);
            return;
        }

        if (envelope.level() == AuditLevel.RECORD) {
            coldStore.write(envelope);
            return;
        }
        writer.insertProcessEvent(envelope);
    }

    private String extractEventId(String payload) {
        if (payload == null) {
            return null;
        }
        var matcher = EVENT_ID_PATTERN.matcher(payload);
        return matcher.find() ? matcher.group(1) : null;
    }
}
