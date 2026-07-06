package com.integrationhub.platform.integration.async;

import com.integrationhub.platform.domain.ExecutionStatus;
import com.integrationhub.platform.integration.PostgresTestResource;
import com.integrationhub.platform.integration.suspend.RecordingFollowUpTaskProvider;
import com.integrationhub.platform.service.execution.ProcessExecutionService;
import com.integrationhub.platform.service.execution.async.AsyncTaskConsumer;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.quarkus.test.security.TestSecurity;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.anyOf;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * E2E del lazo async completo (ADR-015 Etapas 1-4) sin broker: una tarea {@code async:true} suspende
 * el proceso y encola el work-item en el outbox; se simula la entrega leyendo el {@code envelope_json}
 * (que es exactamente el payload de wire) y pasándolo al {@link AsyncTaskConsumer}, que ejecuta el
 * provider, registra en el inbox y <b>reanuda el proceso</b> con el resultado calculado (sin
 * re-invocar al provider), continuando el pipeline downstream.
 */
@QuarkusTest
@TestProfile(AsyncExecutionTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class AsyncTaskExecutionE2EIT {

    @Inject
    DataSource dataSource;

    @Inject
    ProcessExecutionService processExecutionService;

    @Inject
    AsyncTaskConsumer asyncTaskConsumer;

    @BeforeEach
    void cleanDatabase() throws Exception {
        RecordingFollowUpTaskProvider.resetRecording();
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute(
                    "TRUNCATE TABLE task_inbox, task_dispatch_outbox, audit_spool, audit_event, "
                            + "staging_record, process_task_execution, process_execution, "
                            + "process_task_definition, process_definition, source_definition, "
                            + "reader_definition RESTART IDENTITY CASCADE");
        }
    }

    /**
     * Contrato UI↔backend (#4 + UI que consume `state`): el enum {@code State} se serializa por el JSON REAL del
     * endpoint como su NAME ({@code DISABLED}/{@code DEGRADED}/{@code READY}) — que es exactamente lo que la UI compara
     * (`state === 'READY'`). Si Jackson lo cambiara (ordinal/lowercase) la UI avisaría siempre en silencio; este test
     * lo blinda contra el JSON real, no contra un supuesto (lección de #4).
     */
    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void asyncStatusEndpointSerializesStateAsEnumName() {
        given()
                .when().get("/api/messaging/async-status")
                .then().statusCode(200)
                .body("state", anyOf(is("DISABLED"), is("DEGRADED"), is("READY")))
                .body("consumerLive", anyOf(is(true), is(false)))
                .body("executionEnabled", anyOf(is(true), is(false)));
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void asyncTaskSuspendsThenConsumerCompletesTheProcess() throws Exception {
        var processDefinitionId = insertAsyncTask();

        // 1. El motor ve async:true → suspende y encola (NO ejecuta el provider in-process).
        var execution = processExecutionService.execute(processDefinitionId, Map.of(), "MANUAL");
        assertEquals(ExecutionStatus.SUSPENDED, execution.status, "una tarea async deja el proceso SUSPENDED");
        assertEquals(0, RecordingFollowUpTaskProvider.EXECUTIONS.get(),
                "el provider no corre in-process: se offloadó");
        assertEquals("1", readSingleString("select count(*) from task_dispatch_outbox"),
                "el work-item quedó encolado en el outbox");

        // 2. Simula la entrega por broker: envelope_json == payload de wire.
        var payload = readSingleString("select envelope_json from task_dispatch_outbox order by id desc limit 1");
        assertNotNull(payload);
        var outcome = asyncTaskConsumer.consume(payload, "KAFKA", "tasks.test_follow_up");

        // 3. El consumer ejecutó el provider, registró el inbox y reanudó el proceso.
        assertEquals(AsyncTaskConsumer.ConsumeResult.PROCESSED, outcome);
        assertEquals(1, RecordingFollowUpTaskProvider.EXECUTIONS.get(), "el provider corrió una vez, en el consumer");
        assertEquals("PROCESSED",
                readSingleString("select status from task_inbox order by id desc limit 1"));
        assertEquals("COMPLETED",
                readSingleString("select status from process_execution order by id desc limit 1"));
        assertEquals("COMPLETED",
                readSingleString("select status from process_task_execution order by id desc limit 1"));
        assertNotNull(readSingleString("select resumed_at from process_task_execution order by id desc limit 1"),
                "la tarea suspendida quedó reanudada");
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void asyncCompletionContinuesDownstreamTasks() throws Exception {
        var processDefinitionId = insertAsyncTask();
        // task-2 downstream (síncrona): debe correr sola tras la completación async de task-1.
        insertDownstreamFollowUp(processDefinitionId);

        processExecutionService.execute(processDefinitionId, Map.of(), "MANUAL");
        assertEquals(0, RecordingFollowUpTaskProvider.EXECUTIONS.get());

        var payload = readSingleString("select envelope_json from task_dispatch_outbox order by id desc limit 1");
        asyncTaskConsumer.consume(payload, "KAFKA", "tasks.test_follow_up");

        // task-1 (en el consumer) + task-2 (continuación) → 2 ejecuciones; proceso COMPLETED.
        assertEquals(2, RecordingFollowUpTaskProvider.EXECUTIONS.get(),
                "task-1 en el consumer y task-2 por la continuación downstream");
        assertEquals("COMPLETED",
                readSingleString("select status from process_execution order by id desc limit 1"));
        assertEquals("2",
                readSingleString("select count(*) from process_task_execution where status = 'COMPLETED'"));
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void redeliveryAfterCompletionIsIdempotent() throws Exception {
        var processDefinitionId = insertAsyncTask();
        processExecutionService.execute(processDefinitionId, Map.of(), "MANUAL");
        var payload = readSingleString("select envelope_json from task_dispatch_outbox order by id desc limit 1");

        assertEquals(AsyncTaskConsumer.ConsumeResult.PROCESSED,
                asyncTaskConsumer.consume(payload, "KAFKA", "tasks.test_follow_up"));
        // Reentrega at-least-once de la misma trama: el inbox la descarta (dedup) y no re-ejecuta.
        assertEquals(AsyncTaskConsumer.ConsumeResult.DUPLICATE,
                asyncTaskConsumer.consume(payload, "KAFKA", "tasks.test_follow_up"));

        assertEquals(1, RecordingFollowUpTaskProvider.EXECUTIONS.get(), "el provider no se re-ejecuta en la reentrega");
        assertEquals("1", readSingleString("select count(*) from task_inbox where status = 'PROCESSED'"));
        assertEquals("COMPLETED",
                readSingleString("select status from process_execution order by id desc limit 1"));
    }

    private Long insertAsyncTask() throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate(
                    "insert into process_definition (name, description, active, scheduled) "
                            + "values ('async-e2e', 'adr-015 async', true, false)");
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

    private void insertDownstreamFollowUp(Long processDefinitionId) throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate(
                    "insert into process_task_definition "
                            + "(process_definition_id, task_order, task_type, active, configuration_json) "
                            + "values (" + processDefinitionId + ", 2, '" + RecordingFollowUpTaskProvider.TASK_TYPE
                            + "', true, '{\"taskRef\":\"task-2\",\"executionMode\":\"once\"}')");
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
