package com.integrationhub.platform.integration;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.examples.plugin.sidecar.EchoPluginTaskHandler;
import com.integrationhub.examples.plugin.sidecar.ReferencePluginSidecar;
import com.integrationhub.platform.domain.ExecutionStatus;
import com.integrationhub.platform.service.execution.ProcessExecutionService;
import com.integrationhub.platform.service.execution.async.AsyncTaskMessageCodec;
import com.integrationhub.platform.service.plugin.BackendPluginAdminService;
import com.integrationhub.platform.service.plugin.PluginDescriptorInstallCommand;
import com.integrationhub.platform.service.plugin.PluginInvocationMetricCommand;
import com.integrationhub.platform.service.plugin.PluginRuntimeMetricsRecorder;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.QuarkusTestProfile;
import io.quarkus.test.junit.TestProfile;
import io.quarkus.test.security.TestSecurity;
import io.restassured.RestAssured;
import jakarta.inject.Inject;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Signature;
import java.security.spec.ECGenParameterSpec;
import java.util.Base64;
import java.sql.Connection;
import java.sql.Statement;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * E2E del plugin backend out-of-process:
 * core -> Kafka real -> sidecar de referencia -> callback HTTP HMAC -> resume.
 */
@QuarkusTest
@TestProfile(RemotePluginSidecarHttpE2EIT.Profile.class)
@QuarkusTestResource(PostgresTestResource.class)
@QuarkusTestResource(KafkaTestResource.class)
class RemotePluginSidecarHttpE2EIT {

    private static final String PLUGIN_ID = "acme-tasks";
    private static final String PLUGIN_VERSION = "1.0.0";
    private static final String PLUGIN_INTEGRITY = "sha256-c2lkZWNhci1lMmU=";
    private static final String SIGNING_KEY_ID = "sidecar-e2e";
    private static final String RESUME_SECRET = "sidecar-http-secret";
    private static final KeyPair SIGNING_KEY_PAIR = signingKeyPair();
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    @Inject
    DataSource dataSource;

    @Inject
    BackendPluginAdminService pluginAdminService;

    @Inject
    PluginRuntimeMetricsRecorder metricsRecorder;

    @Inject
    ProcessExecutionService processExecutionService;

    @Inject
    ObjectMapper objectMapper;

    @BeforeEach
    void cleanDatabaseAndInstallPlugin() throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute(
                    "TRUNCATE TABLE audit_spool, audit_event, staging_record, process_task_execution, "
                            + "process_execution, process_task_definition, process_definition, "
                            + "source_definition, reader_definition, plugin_descriptor_version, "
                            + "plugin_descriptor RESTART IDENTITY CASCADE");
        }
        pluginAdminService.install(new PluginDescriptorInstallCommand(
                PLUGIN_ID,
                PLUGIN_VERSION,
                "1",
                Set.of(EchoPluginTaskHandler.TASK_TYPE),
                Set.of(),
                Set.of(),
                "KAFKA",
                null,
                true,
                false,
                PLUGIN_INTEGRITY,
                descriptorSignature(),
                null,
                "stable",
                null,
                false));
        recordHealthyCanaryWindow();
        pluginAdminService.activateVersion(PLUGIN_ID, PLUGIN_VERSION);
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void remotePluginSidecarCompletesSuspendedProcessThroughSignedHttpCallback() throws Exception {
        var processDefinitionId = insertProcessWithRemotePluginTask();

        var execution = processExecutionService.execute(processDefinitionId, Map.of(), "MANUAL");

        assertEquals(ExecutionStatus.SUSPENDED, execution.status);
        var resumeToken = readSingleString("select resume_token from process_task_execution order by id desc limit 1");
        assertNotNull(resumeToken);

        ConsumerRecord<String, String> record;
        try (var consumer = consumer()) {
            consumer.subscribe(List.of(AsyncTaskMessageCodec.topicFor(EchoPluginTaskHandler.TASK_TYPE)));
            record = pollOne(consumer);
        }

        var envelope = envelopeFrom(record);
        var sidecar = new ReferencePluginSidecar(
                PLUGIN_ID,
                URI.create("http://localhost:" + RestAssured.port),
                RESUME_SECRET,
                new EchoPluginTaskHandler(PLUGIN_ID),
                objectMapper);
        var callback = sidecar.toResumeCallback(envelope, resumeToken);

        RestAssured.given()
                .headers(callback.headers())
                .body(callback.rawBody())
                .post(callback.uri().toString())
                .then()
                .statusCode(200)
                .body("outcome", equalTo("COMPLETED"))
                .body("processCompleted", equalTo(true))
                .body("details", equalTo("ACME_ECHO completed by sidecar"));

        assertEquals("COMPLETED",
                readSingleString("select status from process_task_execution order by id desc limit 1"));
        assertEquals("COMPLETED",
                readSingleString("select status from process_execution order by id desc limit 1"));
        assertEquals("1",
                readSingleString("select resume_count from process_task_execution order by id desc limit 1"));
    }

    private AsyncTaskEnvelope envelopeFrom(ConsumerRecord<String, String> record) throws Exception {
        var headers = headers(record);
        var payload = objectMapper.readValue(record.value(), MAP_TYPE);
        return new AsyncTaskEnvelope(
                headers.get("traceId"),
                number(payload.get("processExecutionId")).longValue(),
                number(payload.get("taskDefinitionId")).longValue(),
                headers.get("taskType"),
                "KAFKA",
                record.key(),
                Integer.parseInt(headers.getOrDefault("attempt", "1")),
                record.value(),
                headers);
    }

    private Map<String, String> headers(ConsumerRecord<String, String> record) {
        var copy = new LinkedHashMap<String, String>();
        record.headers().forEach(header -> copy.put(header.key(), new String(header.value(), StandardCharsets.UTF_8)));
        return copy;
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
        assertNotNull(record, "Kafka debe recibir el work-item para el sidecar remoto");
        return record;
    }

    private KafkaConsumer<String, String> consumer() {
        var props = new Properties();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, KafkaTestResource.bootstrapServers());
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "remote-plugin-sidecar-http-e2e");
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        return new KafkaConsumer<>(props);
    }

    private Long insertProcessWithRemotePluginTask() throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate(
                    "insert into process_definition (name, description, active, scheduled) "
                            + "values ('remote-plugin-sidecar-e2e', 'remote plugin sidecar e2e', true, false)");
            try (var rs = statement.executeQuery("select id from process_definition order by id desc limit 1")) {
                assertTrue(rs.next());
                var processDefinitionId = rs.getLong(1);
                statement.executeUpdate(
                        "insert into process_task_definition "
                                + "(process_definition_id, task_order, task_type, active, configuration_json) "
                                + "values (" + processDefinitionId + ", 1, '"
                                + EchoPluginTaskHandler.TASK_TYPE
                                + "', true, '{\"taskRef\":\"task-1\",\"executionMode\":\"once\","
                                + "\"message\":\"hola remoto\"}')");
                return processDefinitionId;
            }
        }
    }

    private String readSingleString(String query) throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             var rs = statement.executeQuery(query)) {
            if (!rs.next()) {
                return null;
            }
            return rs.getString(1);
        }
    }

    private Number number(Object value) {
        if (value instanceof Number number) {
            return number;
        }
        throw new IllegalArgumentException("Expected numeric payload value but got " + value);
    }

    private static String trustedPublicKeyConfig() {
        return SIGNING_KEY_ID + ":" + Base64.getEncoder().encodeToString(SIGNING_KEY_PAIR.getPublic().getEncoded());
    }

    private static String descriptorSignature() {
        try {
            var signature = Signature.getInstance("SHA256withECDSA");
            signature.initSign(SIGNING_KEY_PAIR.getPrivate());
            signature.update((PLUGIN_ID + "@" + PLUGIN_VERSION + ":" + PLUGIN_INTEGRITY)
                    .getBytes(StandardCharsets.UTF_8));
            return SIGNING_KEY_ID + ":" + Base64.getEncoder().encodeToString(signature.sign());
        } catch (Exception error) {
            throw new IllegalStateException("Cannot sign test plugin descriptor", error);
        }
    }

    private static KeyPair signingKeyPair() {
        try {
            var generator = KeyPairGenerator.getInstance("EC");
            generator.initialize(new ECGenParameterSpec("secp256r1"));
            return generator.generateKeyPair();
        } catch (Exception error) {
            throw new IllegalStateException("Cannot create test plugin signing key", error);
        }
    }

    private void recordHealthyCanaryWindow() {
        for (int index = 0; index < 3; index++) {
            metricsRecorder.record(new PluginInvocationMetricCommand(
                    PLUGIN_ID,
                    PLUGIN_VERSION,
                    EchoPluginTaskHandler.TASK_TYPE,
                    "KAFKA",
                    true,
                    "SUCCESS",
                    10 + index,
                    null,
                    null));
        }
    }

    public static final class Profile extends IntegrationTestProfile implements QuarkusTestProfile {
        @Override
        public Map<String, String> getConfigOverrides() {
            var overrides = new LinkedHashMap<String, String>(super.getConfigOverrides());
            overrides.put("integrationhub.plugins.backend.trusted-public-keys", trustedPublicKeyConfig());
            overrides.put("integrationhub.resume.hmac.enabled", "true");
            overrides.put("integrationhub.resume.hmac.secret", RESUME_SECRET);
            return overrides;
        }
    }
}
