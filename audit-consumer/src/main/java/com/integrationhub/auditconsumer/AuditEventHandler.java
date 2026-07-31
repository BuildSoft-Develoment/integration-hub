// @trace RF-006 (observabilidad-y-auditoria: consumo de la trama de auditoria)
package com.integrationhub.auditconsumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.auditconsumer.coldstore.ColdStore;
import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.audit.AuditLevel;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.function.Consumer;
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
        handleBatch(List.of(payload), brokerType, topic);
    }

    public void handleBatch(Collection<String> payloads, String brokerType, String topic) {
        if (payloads == null || payloads.isEmpty()) {
            return;
        }
        var processEvents = new ArrayList<Parsed>();
        var recordEvents = new ArrayList<Parsed>();
        for (var payload : payloads) {
            routePayload(payload, brokerType, topic, processEvents, recordEvents);
        }
        persistWithBisect(recordEvents, coldStore::writeBatch, brokerType, topic);
        persistWithBisect(processEvents, writer::insertProcessEvents, brokerType, topic);
    }

    private void routePayload(String payload,
                              String brokerType,
                              String topic,
                              List<Parsed> processEvents,
                              List<Parsed> recordEvents) {
        try {
            var envelope = objectMapper.readValue(payload, AuditEnvelope.class);
            var parsed = new Parsed(payload, eventIdOf(envelope, payload), envelope);
            if (envelope.level() == AuditLevel.RECORD) {
                recordEvents.add(parsed);
            } else {
                processEvents.add(parsed);
            }
        } catch (Exception parseError) {
            var eventId = extractEventId(payload);
            deadLetterWriter.write(eventId, brokerType, topic, payload, parseError.getMessage());
            LOG.warnf(parseError, "Audit consumer: dead-lettered unparseable envelope from %s/%s", brokerType, topic);
        }
    }

    /**
     * Persiste el lote; si la persistencia falla (evento parseable pero no persistible:
     * constraint, valor demasiado largo, error de BD) bisecta hasta aislar el evento
     * problematico, lo manda a DLQ y continua con los validos. Sin esto, un solo evento
     * malo tumbaria el batch entero y el broker lo reentregaria para siempre (lag). Las
     * escrituras son idempotentes ({@code ON CONFLICT (event_id)}), asi que reintentar
     * mitades no duplica filas (P0.6).
     */
    private void persistWithBisect(List<Parsed> items,
                                   Consumer<Collection<AuditEnvelope>> persist,
                                   String brokerType,
                                   String topic) {
        if (items.isEmpty()) {
            return;
        }
        try {
            persist.accept(items.stream().map(Parsed::envelope).toList());
        } catch (RuntimeException persistError) {
            if (items.size() == 1) {
                var bad = items.get(0);
                deadLetterWriter.write(bad.eventId(), brokerType, topic, bad.payload(),
                        "persist failed: " + persistError.getMessage());
                LOG.warnf(persistError, "Audit consumer: dead-lettered unpersistable event %s from %s/%s",
                        bad.eventId(), brokerType, topic);
                return;
            }
            var mid = items.size() / 2;
            persistWithBisect(items.subList(0, mid), persist, brokerType, topic);
            persistWithBisect(items.subList(mid, items.size()), persist, brokerType, topic);
        }
    }

    private String eventIdOf(AuditEnvelope envelope, String payload) {
        return envelope.eventId() != null ? envelope.eventId() : extractEventId(payload);
    }

    private record Parsed(String payload, String eventId, AuditEnvelope envelope) {
    }

    private String extractEventId(String payload) {
        if (payload == null) {
            return null;
        }
        var matcher = EVENT_ID_PATTERN.matcher(payload);
        return matcher.find() ? matcher.group(1) : null;
    }
}
