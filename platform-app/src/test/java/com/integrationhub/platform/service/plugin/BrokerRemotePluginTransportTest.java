package com.integrationhub.platform.service.plugin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.service.execution.async.AsyncTaskMessageCodec;
import com.integrationhub.platform.service.execution.async.TaskDispatchPublisher;
import com.integrationhub.platform.spi.messaging.MessageBrokerProvider;
import com.integrationhub.platform.spi.messaging.MessagePublisher;
import com.integrationhub.platform.spi.messaging.OutboundMessage;
import com.integrationhub.platform.spi.messaging.PublishResult;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.task.ArtifactReference;
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
        // Wire-format = envelope entero como payload (patron audit/sidecar): headers de mensaje
        // vacios; la correlacion (pluginId, taskType, ids) va DENTRO del envelope.
        assertTrue(captured.get().headers().isEmpty());

        var envelope = AsyncTaskMessageCodec.decode(captured.get().payload(), new ObjectMapper());
        assertEquals("ACME_DO", envelope.taskType());
        assertEquals(42L, envelope.processExecutionId());
        assertEquals("acme", envelope.headers().get("pluginId"));

        var body = new ObjectMapper().readValue(envelope.payload(), Map.class);
        assertEquals("acme", body.get("pluginId"));
        assertEquals("ACME_DO", body.get("taskType"));
        assertEquals(42, body.get("processExecutionId"));
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

    /**
     * Proyecto #3, Fase 4 (blindaje del diseño transport-agnostic): un {@code artifactRef} puesto en la
     * {@code configuration} sobrevive intacto el envelope del broker (doble serialización JSON: envelope + body). Prueba
     * que la referencia (opción B) viaja por cualquier control channel — gRPC o broker — sin cambios de plataforma.
     */
    @Test
    void artifactRefInConfigurationSurvivesTheBrokerEnvelope() throws Exception {
        var captured = new AtomicReference<OutboundMessage>();
        var transport = new BrokerRemotePluginTransport(
                type -> Optional.of(broker(type, message -> {
                    captured.set(message);
                    return PublishResult.ok("offset-1");
                })),
                new TaskDispatchPublisher(),
                new ObjectMapper());

        var reference = ArtifactReference.get("https://store/bucket/obj?sig=abc", "text/csv", 123L, 1730000000000L);
        var configuration = Map.<String, Object>of(ArtifactReference.ARTIFACT_REF, reference.asMap());

        transport.invoke(descriptor("KAFKA"), "ACME_DO", context, configuration);

        var envelope = AsyncTaskMessageCodec.decode(captured.get().payload(), new ObjectMapper());
        var body = new ObjectMapper().readValue(envelope.payload(), Map.class);
        @SuppressWarnings("unchecked")
        var config = (Map<String, Object>) body.get("configuration");
        @SuppressWarnings("unchecked")
        var refMap = (Map<String, Object>) config.get(ArtifactReference.ARTIFACT_REF);
        assertEquals(reference, ArtifactReference.fromMap(refMap),
                "el artifactRef sobrevive el envelope del broker -> la referencia es transport-agnostic");
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
