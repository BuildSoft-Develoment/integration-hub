package com.integrationhub.auditconsumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.integrationhub.auditconsumer.coldstore.ColdStore;
import com.integrationhub.platform.audit.AuditEnvelope;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * P0.6: un evento parseable-pero-no-persistible (constraint, valor largo) no debe
 * tumbar el batch entero. El handler bisecta, persiste los validos y manda el malo
 * a DLQ, en vez de dejar que el broker reentregue el lote para siempre.
 */
class AuditEventHandlerTest {

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Test
    void bisectsAndDeadLettersUnpersistableEventPersistingTheRest() {
        var persisted = new ArrayList<String>();
        // El cold store falla cuando el batch contiene el evento "poison" (p.ej. valor
        // demasiado largo); persiste el resto. Idempotente en produccion (ON CONFLICT).
        var coldStore = new ColdStore() {
            @Override
            public void write(AuditEnvelope envelope) {
                writeBatch(List.of(envelope));
            }

            @Override
            public void writeBatch(Collection<AuditEnvelope> envelopes) {
                if (envelopes.stream().anyMatch(e -> "poison".equals(e.eventId()))) {
                    throw new IllegalStateException("value too long for column");
                }
                envelopes.forEach(e -> persisted.add(e.eventId()));
            }
        };

        var deadLettered = new ArrayList<String>();
        var deadLetterWriter = new AuditDeadLetterWriter(null) {
            @Override
            public void write(String eventId, String brokerType, String topic, String payload, String errorMessage) {
                deadLettered.add(eventId);
            }
        };

        var handler = new AuditEventHandler(objectMapper, new AuditEventWriter(null), coldStore, deadLetterWriter);

        handler.handleBatch(List.of(
                recordPayload("g1"),
                recordPayload("poison"),
                recordPayload("g2")), "kafka", "audit");

        assertTrue(persisted.contains("g1"), "el evento valido g1 se persiste");
        assertTrue(persisted.contains("g2"), "el evento valido g2 se persiste");
        assertFalse(persisted.contains("poison"), "el evento problematico no se persiste");
        assertEquals(List.of("poison"), deadLettered, "solo el problematico va a DLQ");
    }

    @Test
    void deadLettersUnparseablePayloadWithoutTouchingPersistence() {
        var coldStore = new ColdStore() {
            @Override
            public void write(AuditEnvelope envelope) {
                throw new AssertionError("no debe persistir nada");
            }
        };
        var deadLettered = new ArrayList<String>();
        var deadLetterWriter = new AuditDeadLetterWriter(null) {
            @Override
            public void write(String eventId, String brokerType, String topic, String payload, String errorMessage) {
                deadLettered.add(payload);
            }
        };
        var handler = new AuditEventHandler(objectMapper, new AuditEventWriter(null), coldStore, deadLetterWriter);

        handler.handleBatch(List.of("{ not json }"), "kafka", "audit");

        assertEquals(1, deadLettered.size(), "el JSON ilegible va a DLQ");
    }

    private String recordPayload(String eventId) {
        return "{\"eventId\":\"" + eventId + "\",\"level\":\"RECORD\",\"stage\":\"RECORD_INGESTED\",\"status\":\"INGESTED\"}";
    }
}
