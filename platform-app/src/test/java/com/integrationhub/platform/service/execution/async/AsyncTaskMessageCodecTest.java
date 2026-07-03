package com.integrationhub.platform.service.execution.async;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.task.AsyncTaskEnvelope;

import java.util.Map;

import org.junit.jupiter.api.Test;

class AsyncTaskMessageCodecTest {

    private final ObjectMapper mapper = new ObjectMapper();

    private AsyncTaskEnvelope envelope(String taskType) {
        return new AsyncTaskEnvelope("exec-99", 99L, 7L, taskType, "KAFKA", "idem-abc", 1,
                "{\"a\":1}", Map.of("recordId", "r-1"));
    }

    @Test
    void topicDerivesFromTaskTypeLowercased() {
        assertEquals("tasks.db_write", AsyncTaskMessageCodec.toMessage(envelope("DB_WRITE"), mapper).topic());
    }

    @Test
    void keyIsIdempotencyKeyAndHeadersEmpty() {
        var message = AsyncTaskMessageCodec.toMessage(envelope("DB_WRITE"), mapper);
        assertEquals("idem-abc", message.key());
        // Mismo patron que la auditoria: la correlacion va dentro del payload, no en headers.
        assertTrue(message.headers().isEmpty());
    }

    @Test
    void unknownTopicForBlankType() {
        assertEquals("tasks.unknown", AsyncTaskMessageCodec.topicFor("  "));
    }

    @Test
    void payloadCarriesTheWholeEnvelopeAndDecodeIsInverse() {
        var original = envelope("REST_CALL");
        var message = AsyncTaskMessageCodec.toMessage(original, mapper);
        // El payload es el envelope entero (Jackson), no solo el work-item -> el consumer/sidecar
        // lo decodifica con un unico readValue. Lossless.
        var restored = AsyncTaskMessageCodec.decode(message.payload(), mapper);
        assertEquals(original, restored);
    }
}
