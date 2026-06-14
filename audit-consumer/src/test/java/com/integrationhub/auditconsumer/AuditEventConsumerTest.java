package com.integrationhub.auditconsumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.module.paramnames.ParameterNamesModule;
import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.audit.AuditLevel;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Routing del consumidor sin infraestructura: PROCESS persiste, RECORD se omite
 * (cold store fase 4), poison se descarta sin propagar.
 */
class AuditEventConsumerTest {

    private final ObjectMapper mapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .registerModule(new ParameterNamesModule());

    private AuditEnvelope envelope(AuditLevel level) {
        return new AuditEnvelope(UUID.randomUUID().toString(), "exec-1", null, level,
                "PROCESS_STARTED", "RUNNING", 1L, null, "msg", null, Map.of(), Instant.now(), 1);
    }

    private static final class RecordingWriter extends AuditEventWriter {
        final AtomicInteger persisted = new AtomicInteger();
        RecordingWriter() { super(null); }
        @Override public void insertProcessEvent(AuditEnvelope envelope) { persisted.incrementAndGet(); }
    }

    private static final class RecordingColdStore implements com.integrationhub.auditconsumer.coldstore.ColdStore {
        final AtomicInteger persisted = new AtomicInteger();
        @Override public void write(AuditEnvelope envelope) { persisted.incrementAndGet(); }
    }

    private static final class RecordingDeadLetterWriter extends AuditDeadLetterWriter {
        final AtomicInteger persisted = new AtomicInteger();
        RecordingDeadLetterWriter() { super(null); }
        @Override public void write(String eventId, String brokerType, String topic, String payload, String errorMessage) {
            persisted.incrementAndGet();
        }
    }

    @Test
    void persistsProcessLevel() throws Exception {
        var writer = new RecordingWriter();
        var coldStore = new RecordingColdStore();
        var deadLetter = new RecordingDeadLetterWriter();
        var consumer = new AuditEventConsumer(new AuditEventHandler(mapper, writer, coldStore, deadLetter));
        consumer.consume(mapper.writeValueAsString(envelope(AuditLevel.PROCESS)));
        assertEquals(1, writer.persisted.get());
        assertEquals(0, coldStore.persisted.get());
        assertEquals(0, deadLetter.persisted.get());
    }

    @Test
    void routesRecordLevelToColdStore() throws Exception {
        var writer = new RecordingWriter();
        var coldStore = new RecordingColdStore();
        var deadLetter = new RecordingDeadLetterWriter();
        var consumer = new AuditEventConsumer(new AuditEventHandler(mapper, writer, coldStore, deadLetter));
        consumer.consume(mapper.writeValueAsString(envelope(AuditLevel.RECORD)));
        assertEquals(0, writer.persisted.get());
        assertEquals(1, coldStore.persisted.get());
        assertEquals(0, deadLetter.persisted.get());
    }

    @Test
    void deadLettersPoisonWithoutFailing() {
        var writer = new RecordingWriter();
        var coldStore = new RecordingColdStore();
        var deadLetter = new RecordingDeadLetterWriter();
        var consumer = new AuditEventConsumer(new AuditEventHandler(mapper, writer, coldStore, deadLetter));
        consumer.consume("{not valid json");
        assertEquals(0, writer.persisted.get());
        assertEquals(0, coldStore.persisted.get());
        assertEquals(1, deadLetter.persisted.get());
    }
}
