package com.integrationhub.platform.service.plugin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.service.execution.async.AsyncTaskMessageCodec;
import com.integrationhub.platform.service.execution.async.TaskDispatchPublisher;
import com.integrationhub.platform.spi.messaging.MessageBrokerProvider;
import com.integrationhub.platform.spi.messaging.MessagePublisher;
import com.integrationhub.platform.spi.messaging.OutboundMessage;
import com.integrationhub.platform.spi.messaging.PublishResult;
import com.integrationhub.platform.spi.task.TaskContext;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BrokerRemotePluginTransportTest {

    private final TaskContext context = new TaskContext(42L, 7L);

    @Test
    void supportsDescriptorsWhenBrokerExists() {
        var transport = new BrokerRemotePluginTransport(
                type -> "KAFKA".equalsIgnoreCase(type)
                        ? Optional.of(broker(type, message -> PublishResult.ok("ref-1")))
                        : Optional.empty(),
                new TaskDispatchPublisher(),
                new ObjectMapper());

        assertTrue(transport.supports(descriptor("KAFKA")));
        assertFalse(transport.supports(descriptor("GRPC")));
    }

    @Test
    void publishesEnvelopeAndSuspendsTaskWhenBrokerAccepts() throws Exception {
        var captured = new AtomicReference<OutboundMessage>();
        var transport = new BrokerRemotePluginTransport(
                type -> Optional.of(broker(type, message -> {
                    captured.set(message);
                    return PublishResult.ok("offset-1");
                })),
                new TaskDispatchPublisher(),
                new ObjectMapper());

        var result = transport.invoke(descriptor("KAFKA"), "ACME_DO", context, Map.of("limit", 10));

        assertTrue(result.success());
        assertTrue(result.suspended());
        assertEquals("KAFKA", result.suspendedState().get("transport"));
        assertEquals("plugin:acme:42:7:ACME_DO", result.suspendedState().get("idempotencyKey"));
        assertEquals("offset-1", result.suspendedState().get("brokerReference"));
        assertEquals(AsyncTaskMessageCodec.topicFor("ACME_DO"), captured.get().topic());
        assertEquals("plugin:acme:42:7:ACME_DO", captured.get().key());
        assertEquals("acme", captured.get().headers().get("pluginId"));

        var payload = new ObjectMapper().readValue(captured.get().payload(), Map.class);
        assertEquals("acme", payload.get("pluginId"));
        assertEquals("ACME_DO", payload.get("taskType"));
        assertEquals(42, payload.get("processExecutionId"));
    }

    @Test
    void failsWhenBrokerRejectsMessage() {
        var transport = new BrokerRemotePluginTransport(
                type -> Optional.of(broker(type, message -> PublishResult.failed("queue unavailable"))),
                new TaskDispatchPublisher(),
                new ObjectMapper());

        var error = assertThrows(IllegalStateException.class,
                () -> transport.invoke(descriptor("KAFKA"), "ACME_DO", context, Map.of()));

        assertTrue(error.getMessage().contains("queue unavailable"));
    }

    @Test
    void requiresExecutionIdentifiersForDeterministicDispatch() {
        var transport = new BrokerRemotePluginTransport(
                type -> Optional.of(broker(type, message -> PublishResult.ok("ref-1"))),
                new TaskDispatchPublisher(),
                new ObjectMapper());

        assertThrows(IllegalArgumentException.class,
                () -> transport.invoke(descriptor("KAFKA"), "ACME_DO", new TaskContext(null, 7L), Map.of()));
    }

    private RemotePluginDescriptor descriptor(String transport) {
        return new RemotePluginDescriptor("acme", "1.0.0", "1", Set.of("ACME_DO"), transport, null, true);
    }

    private MessageBrokerProvider broker(String type, MessagePublisher publisher) {
        return new MessageBrokerProvider() {
            @Override
            public String type() {
                return type;
            }

            @Override
            public MessagePublisher publisher() {
                return publisher;
            }
        };
    }
}
