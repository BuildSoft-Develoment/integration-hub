package com.integrationhub.platform.service.execution.async;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.integrationhub.platform.task.AsyncTaskEnvelope;

import java.util.Map;

import org.junit.jupiter.api.Test;

class AsyncTaskMessageCodecTest {

    private AsyncTaskEnvelope envelope(String taskType) {
        return new AsyncTaskEnvelope("exec-99", 99L, 7L, taskType, "KAFKA", "idem-abc", 1,
                "{\"a\":1}", Map.of("recordId", "r-1"));
    }

    @Test
    void topicDerivesFromTaskTypeLowercased() {
        assertEquals("tasks.db_write", AsyncTaskMessageCodec.toMessage(envelope("DB_WRITE")).topic());
    }

    @Test
    void keyIsIdempotencyKeyAndPayloadPreserved() {
        var message = AsyncTaskMessageCodec.toMessage(envelope("DB_WRITE"));
        assertEquals("idem-abc", message.key());
        assertEquals("{\"a\":1}", message.payload());
    }

    @Test
    void headersCarryTraceAttemptAndPreserveExisting() {
        var headers = AsyncTaskMessageCodec.toMessage(envelope("REST_CALL")).headers();
        assertEquals("exec-99", headers.get("traceId"));
        assertEquals("1", headers.get("attempt"));
        assertEquals("REST_CALL", headers.get("taskType"));
        assertEquals("r-1", headers.get("recordId"));
    }

    @Test
    void unknownTopicForBlankType() {
        assertEquals("tasks.unknown", AsyncTaskMessageCodec.topicFor("  "));
    }
}
