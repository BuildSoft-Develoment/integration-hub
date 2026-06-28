package com.integrationhub.platform.service.execution.async;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.integrationhub.platform.spi.messaging.MessageBrokerProvider;
import com.integrationhub.platform.spi.messaging.MessagePublisher;
import com.integrationhub.platform.spi.messaging.OutboundMessage;
import com.integrationhub.platform.spi.messaging.PublishResult;
import com.integrationhub.platform.task.AsyncTaskEnvelope;

import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;

class TaskDispatchPublisherTest {

    @Test
    void mapsEnvelopeAndPublishesToBroker() {
        var captured = new AtomicReference<OutboundMessage>();
        MessagePublisher publisher = message -> {
            captured.set(message);
            return PublishResult.ok("ref-1");
        };
        MessageBrokerProvider broker = new MessageBrokerProvider() {
            @Override
            public String type() {
                return "KAFKA";
            }

            @Override
            public MessagePublisher publisher() {
                return publisher;
            }
        };

        var envelope = new AsyncTaskEnvelope("exec-1", 1L, 2L, "DB_WRITE", "KAFKA", "idem-1", 1,
                "{}", Map.of());

        var result = new TaskDispatchPublisher().publish(broker, envelope);

        assertTrue(result.accepted());
        assertEquals("ref-1", result.reference());
        assertEquals("tasks.db_write", captured.get().topic());
        assertEquals("idem-1", captured.get().key());
    }
}
