package com.integrationhub.platform.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.integrationhub.platform.provider.task.remote.RemoteTaskProvider;
import com.integrationhub.platform.service.execution.ResumeCallbackSignatureVerifier;
import com.integrationhub.platform.service.execution.async.AsyncTaskMessageCodec;
import com.integrationhub.platform.service.execution.async.TaskDispatchPublisher;
import com.integrationhub.platform.service.messaging.MessageBrokerRegistry;
import com.integrationhub.platform.service.plugin.BrokerRemotePluginTransport;
import com.integrationhub.platform.service.plugin.RemotePluginDescriptor;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import com.integrationhub.platform.task.RemoteTaskResumePayload;
import com.integrationhub.platform.task.ResumeCallbackSignature;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Properties;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
@QuarkusTestResource(KafkaTestResource.class)
class BrokerRemotePluginTransportKafkaIT {

    private static final String RESUME_SECRET = "test-resume-secret";
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    @Inject
    MessageBrokerRegistry brokerRegistry;

    @Inject
    TaskDispatchPublisher publisher;

    @Inject
    ObjectMapper objectMapper;

    @Test
    void dispatchesRemotePluginEnvelopeToRealKafkaBroker() throws Exception {
        var transport = new BrokerRemotePluginTransport(brokerRegistry, publisher, objectMapper);
        var descriptor = new RemotePluginDescriptor(
                "acme",
                "1.0.0",
                "1",
                Set.of("ACME_DO"),
                "KAFKA",
                null,
                true);

        var result = transport.invoke(
                descriptor,
                "ACME_DO",
                new TaskContext(42L, 7L),
                Map.of("limit", 10));

        assertTrue(result.suspended());
        assertEquals("plugin:acme:42:7:ACME_DO", result.suspendedState().get("idempotencyKey"));

        try (var consumer = consumer()) {
            consumer.subscribe(List.of(AsyncTaskMessageCodec.topicFor("ACME_DO")));
            var record = pollOne(consumer);

            assertEquals("plugin:acme:42:7:ACME_DO", record.key());

            // La correlacion se verifica sobre el ENVELOPE, no sobre headers de Kafka: el codec
            // (ADR-015) publica el envelope entero como payload y NO escribe headers. Este test
            // afirmaba `headers.get("traceId")` y por eso leia null — media un contrato que ya no
            // existe. Se decodifica con el inverso del encode, igual que un sidecar real y que
            // RemotePluginSidecarHttpE2EIT, que ya estaba migrado.
            var envelope = AsyncTaskMessageCodec.decode(record.value(), objectMapper);

            assertEquals("exec-42", envelope.traceId());
            assertEquals("ACME_DO", envelope.taskType());
            assertEquals("plugin:acme:42:7:ACME_DO", envelope.idempotencyKey());
            assertEquals(42L, envelope.processExecutionId());
            assertEquals(7L, envelope.taskDefinitionId());
            assertTrue(record.value().contains("\"pluginId\":\"acme\""));
            assertTrue(record.value().contains("\"taskType\":\"ACME_DO\""));
            var rawCallback = sidecarCallbackBody(envelope);
            var signature = ResumeCallbackSignature.headerValue(RESUME_SECRET, rawCallback);
            var verifier = new ResumeCallbackSignatureVerifier(true, Optional.of(RESUME_SECRET));
            assertTrue(verifier.verify(rawCallback, signature));

            var callback = objectMapper.readValue(rawCallback, RemoteTaskResumePayload.class);
            var suspendedState = new LinkedHashMap<>(result.suspendedState());
            suspendedState.put("externalEvent", callback.asExternalEvent());

            var resumeProvider = new RemoteTaskProvider(
                    "ACME_DO",
                    descriptor,
                    (ignoredDescriptor, ignoredType, ignoredContext, ignoredConfiguration) -> {
                        throw new AssertionError("resume no debe re-invocar el transporte remoto");
                    },
                    new RemotePluginRegistry());

            var resumed = resumeProvider.resume(new TaskContext(42L, 7L), Map.of(), suspendedState);

            assertTrue(resumed.success());
            assertEquals("sidecar completed ACME_DO", resumed.details());
            assertEquals("R-42-7", resumed.outputs().get("remoteRef"));
        }
    }

    private ConsumerRecord<String, String> pollOne(KafkaConsumer<String, String> consumer) {
        var deadline = System.currentTimeMillis() + 15000;
        ConsumerRecord<String, String> record = null;
        while (System.currentTimeMillis() < deadline && record == null) {
            var records = consumer.poll(Duration.ofMillis(500));
            for (var next : records) {
                record = next;
                break;
            }
        }
        assertNotNull(record, "Kafka debe recibir el envelope del plugin remoto");
        return record;
    }

    private String sidecarCallbackBody(AsyncTaskEnvelope envelope) throws IOException {
        var payload = objectMapper.readValue(envelope.payload(), MAP_TYPE);
        var callback = RemoteTaskResumePayload.completed(
                envelope.headers().get("pluginId"),
                envelope.taskType(),
                envelope.idempotencyKey(),
                "sidecar completed " + envelope.taskType(),
                Map.of("remoteRef", "R-" + payload.get("processExecutionId") + "-" + payload.get("taskDefinitionId")));
        return objectMapper.writeValueAsString(callback);
    }

    private KafkaConsumer<String, String> consumer() {
        var props = new Properties();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, KafkaTestResource.bootstrapServers());
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "broker-remote-plugin-transport-it");
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        return new KafkaConsumer<>(props);
    }
}
