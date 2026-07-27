package com.integrationhub.platform.integration.async;

import com.integrationhub.platform.spi.execution.ExecutionStatus;
import com.integrationhub.platform.integration.PostgresTestResource;
import com.integrationhub.platform.integration.suspend.RecordingSuspendableTaskProvider;
import com.integrationhub.platform.service.execution.ProcessExecutionResumeService;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * E2E de Nivel 3 (ADR-015): una tarea <b>suspendible</b> marcada {@code async:true} se offloada; el
 * consumer ejecuta su primer intento, que <b>suspende</b>; el motor la <b>re-suspende</b> (nuevo token
 * de callback) en vez de marcarla DEAD; y un resume por token la reanuda a completación —sin re-invocar
 * al provider desde el consumer— cerrando el proceso.
 */
@QuarkusTest
@TestProfile(AsyncExecutionTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class AsyncSuspendableReSuspendE2EIT {

    @Inject
    DataSource dataSource;

    @Inject
    ProcessExecutionService processExecutionService;

    @Inject
    AsyncTaskConsumer asyncTaskConsumer;

    @Inject
    ProcessExecutionResumeService resumeService;

    @BeforeEach
    void cleanDatabase() throws Exception {
        RecordingSuspendableTaskProvider.resetRecording();
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute(
                    "TRUNCATE TABLE task_inbox, task_dispatch_outbox, audit_spool, audit_event, "
                            + "staging_record, process_task_execution, process_execution, "
                            + "process_task_definition, process_definition, source_definition, "
                            + "reader_definition RESTART IDENTITY CASCADE");
        }
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void suspendableAsyncReSuspendsInConsumerThenResumesToCompletion() throws Exception {
        var processDefinitionId = insertAsyncSuspendable();

        // 1. El motor ve async:true → offload: proceso SUSPENDED, work-item encolado, provider no corre.
        var execution = processExecutionService.execute(processDefinitionId, Map.of(), "MANUAL");
        assertEquals(ExecutionStatus.SUSPENDED, execution.status);
        assertEquals(0, RecordingSuspendableTaskProvider.EXECUTIONS.get());

        // 2. El consumer ejecuta el primer intento → suspende → el motor RE-SUSPENDE (no DEAD).
        var payload = readSingleString("select envelope_json from task_dispatch_outbox order by id desc limit 1");
        var outcome = asyncTaskConsumer.consume(payload, "KAFKA", "tasks.test_suspendable", java.util.UUID.randomUUID().toString());

        assertEquals(AsyncTaskConsumer.ConsumeResult.PROCESSED, outcome);
        assertEquals(1, RecordingSuspendableTaskProvider.EXECUTIONS.get(), "el primer intento corrió en el consumer");
        assertEquals(0, RecordingSuspendableTaskProvider.RESUMES.get());
        // El contexto capturado al suspender (taskOutputs) se rehidrató para el provider en el consumer.
        assertInstanceOf(Map.class, RecordingSuspendableTaskProvider.SEEN_TASK_OUTPUTS.get(),
                "el provider recibió el taskOutputs rehidratado desde la continuación");
        assertFalse(((Map<?, ?>) RecordingSuspendableTaskProvider.SEEN_TASK_OUTPUTS.get()).isEmpty(),
                "el taskOutputs rehidratado no está vacío (metadata de la tarea capturada al suspender)");
        assertEquals("PROCESSED", readSingleString("select status from task_inbox order by id desc limit 1"));
        // La tarea sigue SUSPENDED (re-suspendida), el proceso NO completó, y hay un token de callback.
        assertEquals("SUSPENDED", readSingleString("select status from process_task_execution order by id desc limit 1"));
        assertEquals("SUSPENDED", readSingleString("select status from process_execution order by id desc limit 1"));
        var token = readSingleString(
                "select resume_token from process_task_execution where resumed_at is null order by id desc limit 1");
        assertNotNull(token, "la re-suspensión dejó un nuevo token de callback");

        // 3. El callback/scheduler reanuda por el token → provider.resume → completación.
        resumeService.resume(token, Map.of("status", "ACCEPTED"));

        assertEquals(1, RecordingSuspendableTaskProvider.RESUMES.get(), "el resume invocó al provider");
        assertEquals("COMPLETED", readSingleString("select status from process_execution order by id desc limit 1"));
        assertEquals("COMPLETED", readSingleString("select status from process_task_execution order by id desc limit 1"));
    }

    private Long insertAsyncSuspendable() throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate(
                    "insert into process_definition (name, description, active, scheduled) "
                            + "values ('async-suspendable-e2e', 'adr-015 nivel 3', true, false)");
            try (var rs = statement.executeQuery("select id from process_definition order by id desc limit 1")) {
                rs.next();
                var processDefinitionId = rs.getLong(1);
                statement.executeUpdate(
                        "insert into process_task_definition "
                                + "(process_definition_id, task_order, task_type, active, configuration_json) "
                                + "values (" + processDefinitionId + ", 1, '"
                                + RecordingSuspendableTaskProvider.TASK_TYPE
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
