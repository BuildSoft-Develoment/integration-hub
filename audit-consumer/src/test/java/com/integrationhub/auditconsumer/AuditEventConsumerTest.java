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

    @Test
    void persistsProcessLevel() throws Exception {
        var writer = new RecordingWriter();
        var consumer = new AuditEventConsumer(mapper, writer);
        consumer.consume(mapper.writeValueAsString(envelope(AuditLevel.PROCESS)));
        assertEquals(1, writer.persisted.get());
    }

    @Test
    void skipsRecordLevel() throws Exception {
        var writer = new RecordingWriter();
        var consumer = new AuditEventConsumer(mapper, writer);
        consumer.consume(mapper.writeValueAsString(envelope(AuditLevel.RECORD)));
        assertEquals(0, writer.persisted.get());
    }

    @Test
    void discardsPoisonWithoutFailing() {
        var writer = new RecordingWriter();
        var consumer = new AuditEventConsumer(mapper, writer);
        consumer.consume("{not valid json");
        assertEquals(0, writer.persisted.get());
    }
}
