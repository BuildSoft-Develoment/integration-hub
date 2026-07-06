package com.integrationhub.platform.integration.async;

import com.integrationhub.platform.domain.ExecutionStatus;
import com.integrationhub.platform.integration.KafkaTestResource;
import com.integrationhub.platform.integration.PostgresTestResource;
import com.integrationhub.platform.integration.suspend.RecordingFollowUpTaskProvider;
import com.integrationhub.platform.service.execution.ProcessExecutionService;
import com.integrationhub.platform.service.messaging.AsyncAvailabilityService;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.quarkus.test.security.TestSecurity;
import jakarta.inject.Inject;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.serialization.StringSerializer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.time.Duration;
import java.util.Map;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * E2E del transporte real (ADR-015 Etapa 5): una tarea {@code async:true} suspende el proceso y encola
 * el work-item; se publica el envelope en un topic {@code tasks.*} de <b>Kafka real</b> (Testcontainers);
 * el adaptador {@code @Incoming} in-process lo consume, ejecuta el provider y <b>reanuda el proceso</b>
 * hasta COMPLETED. Cierra el lazo completo productor → outbox → broker → consumer → completación.
 */
@QuarkusTest
@TestProfile(AsyncKafkaConsumerTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
@QuarkusTestResource(KafkaTestResource.class)
class AsyncTaskKafkaConsumerE2EIT {

    @Inject
    DataSource dataSource;

    @Inject
    ProcessExecutionService processExecutionService;

    @Inject
    AsyncAvailabilityService asyncAvailability;

    @BeforeEach
    void reset() throws Exception {
        RecordingFollowUpTaskProvider.resetRecording();
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute(
                    "TRUNCATE TABLE task_inbox, task_dispatch_outbox, audit_spool, audit_event, "
                            + "staging_record, process_task_execution, process_execution, "
                            + "process_task_definition, process_definition RESTART IDENTITY CASCADE");
        }
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void asyncTaskFlowsThroughKafkaAndCompletesTheProcess() throws Exception {
        var processDefinitionId = insertAsyncTask();

        var execution = processExecutionService.execute(processDefinitionId, Map.of(), "MANUAL");
        assertEquals(ExecutionStatus.SUSPENDED, execution.status);
        var payload = readSingleString("select envelope_json from task_dispatch_outbox order by id desc limit 1");
        assertNotNull(payload, "el work-item quedó en el outbox");

        // Publica el envelope al broker real (el consumer @Incoming lo tomará del topic tasks.*).
        publish("tasks.test_follow_up", "idem-kafka", payload);

        // El consumo es asíncrono: esperamos a que el consumer complete el proceso.
        awaitProcessCompleted(Duration.ofSeconds(30));

        assertEquals("COMPLETED",
                readSingleString("select status from process_execution order by id desc limit 1"));
        assertEquals("PROCESSED",
                readSingleString("select status from task_inbox order by id desc limit 1"));
        assertEquals(1, RecordingFollowUpTaskProvider.EXECUTIONS.get(),
                "el provider corrió una vez, en el consumer alimentado por Kafka");

        // v60-fix (#4 opción a): tras consumir un mensaje real, el consumer Kafka está indudablemente conectado →
        // el estado async debe reportar consumerLive=true (readiness del canal tasks-in en el HealthCenter de SmallRye).
        // Este assert atrapó el bug de inyectar HealthReporter (sin bean) en vez de HealthCenter: consumerLive quedaba
        // permanentemente false y READY era inalcanzable.
        assertTrue(awaitConsumerLive(Duration.ofSeconds(20)),
                "consumerLive debe ser true con el consumer Kafka conectado; si es false, la fuente de readiness es "
                        + "incorrecta y READY sería inalcanzable");
    }

    private boolean awaitConsumerLive(Duration timeout) throws Exception {
        var deadline = System.currentTimeMillis() + timeout.toMillis();
        while (System.currentTimeMillis() < deadline) {
            var availability = asyncAvailability.availability();
            if (availability.consumerEnabled() && availability.consumerLive()) {
                return true;
            }
            Thread.sleep(500);
        }
        return false;
    }

    private void awaitProcessCompleted(Duration timeout) throws Exception {
        var deadline = System.currentTimeMillis() + timeout.toMillis();
        while (System.currentTimeMillis() < deadline) {
            if ("COMPLETED".equals(readSingleString(
                    "select status from process_execution order by id desc limit 1"))) {
                return;
            }
            Thread.sleep(500);
        }
    }

    private void publish(String topic, String key, String value) {
        var props = new Properties();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, KafkaTestResource.bootstrapServers());
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        try (var producer = new KafkaProducer<String, String>(props)) {
            producer.send(new ProducerRecord<>(topic, key, value));
            producer.flush();
        }
    }

    private Long insertAsyncTask() throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate(
                    "insert into process_definition (name, description, active, scheduled) "
                            + "values ('async-kafka-e2e', 'adr-015 async kafka', true, false)");
            try (var rs = statement.executeQuery("select id from process_definition order by id desc limit 1")) {
                rs.next();
                var processDefinitionId = rs.getLong(1);
                statement.executeUpdate(
                        "insert into process_task_definition "
                                + "(process_definition_id, task_order, task_type, active, configuration_json) "
                                + "values (" + processDefinitionId + ", 1, '" + RecordingFollowUpTaskProvider.TASK_TYPE
                                + "', true, '{\"taskRef\":\"task-1\",\"executionMode\":\"once\",\"async\":true}')");
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
}
