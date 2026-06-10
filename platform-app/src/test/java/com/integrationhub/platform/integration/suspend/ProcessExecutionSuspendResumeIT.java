package com.integrationhub.platform.integration.suspend;

import com.integrationhub.platform.domain.ExecutionStatus;
import com.integrationhub.platform.integration.IntegrationTestProfile;
import com.integrationhub.platform.integration.PostgresTestResource;
import com.integrationhub.platform.service.execution.ProcessExecutionResumeService;
import com.integrationhub.platform.service.execution.ProcessExecutionService;
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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * E2E del cierre M-2: ejecuta un proceso con una tarea
 * {@link SuspendThenCompleteTaskProvider}, verifica que queda SUSPENDED con
 * resume_token persistido, invoca el resume service, verifica que el proceso
 * cierra como COMPLETED.
 *
 * @covers spec 003 T-017 (M-2 suspension engine), ADR-009
 * @covers spec 008-mensajeria-pagos RF-019
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class ProcessExecutionSuspendResumeIT {

    @Inject
    DataSource dataSource;

    @Inject
    ProcessExecutionService processExecutionService;

    @Inject
    ProcessExecutionResumeService resumeService;

    @BeforeEach
    void cleanDatabase() throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute(
                    "TRUNCATE TABLE audit_event, staging_record, process_task_execution, "
                            + "process_execution, process_task_definition, process_definition, "
                            + "source_definition, reader_definition RESTART IDENTITY CASCADE");
        }
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void suspendsThenResumesSingleTaskProcessToCompletion() throws Exception {
        var processDefinitionId = insertProcessWithSuspendableTask();

        var execution = processExecutionService.execute(processDefinitionId, Map.of(), "MANUAL");
        assertEquals(ExecutionStatus.SUSPENDED, execution.status,
                "execute() debe dejar el proceso en SUSPENDED tras la primera tarea");

        var token = readSingleString(
                "select resume_token from process_task_execution order by id desc limit 1");
        assertNotNull(token, "resume_token debe estar persistido");
        assertEquals(43, token.length(), "token base64url sin padding son 43 chars");
        var suspendedState = readSingleString(
                "select suspended_state from process_task_execution order by id desc limit 1");
        assertTrue(suspendedState.contains("\"attempt\":1"),
                () -> "suspended_state debe persistirse como JSON: " + suspendedState);
        assertEquals("SUSPENDED",
                readSingleString("select status from process_task_execution order by id desc limit 1"));

        var outcome = resumeService.resume(token, Map.of("bankRef", "BANK-9000"));
        assertEquals(ProcessExecutionResumeService.Outcome.COMPLETED, outcome.outcome());
        assertTrue(outcome.processCompleted());
        assertNull(outcome.nextResumeToken());

        assertEquals("COMPLETED",
                readSingleString("select status from process_task_execution order by id desc limit 1"));
        assertEquals("COMPLETED",
                readSingleString("select status from process_execution order by id desc limit 1"));
        assertNotNull(
                readSingleString("select resumed_at from process_task_execution order by id desc limit 1"));
        assertEquals("1",
                readSingleString("select resume_count from process_task_execution order by id desc limit 1"));

        var resumeNotFound = readSingleString("select 1 from process_task_execution "
                + "where resume_token = '" + token + "' and resumed_at is null");
        assertNull(resumeNotFound, "el token usado debe quedar consumido (resumed_at != null)");
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void resumeRejectsUnknownToken() {
        var error = org.junit.jupiter.api.Assertions.assertThrows(
                ProcessExecutionResumeService.SuspensionNotFoundException.class,
                () -> resumeService.resume("nonexistent-token", Map.of()));
        assertTrue(error.getMessage().toLowerCase().contains("suspension"),
                () -> "mensaje inesperado: " + error.getMessage());
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void resumeRejectsAlreadyResumedToken() throws Exception {
        var processDefinitionId = insertProcessWithSuspendableTask();
        processExecutionService.execute(processDefinitionId, Map.of(), "MANUAL");
        var token = readSingleString(
                "select resume_token from process_task_execution order by id desc limit 1");
        resumeService.resume(token, Map.of());

        org.junit.jupiter.api.Assertions.assertThrows(
                ProcessExecutionResumeService.SuspensionNotFoundException.class,
                () -> resumeService.resume(token, Map.of()),
                "el segundo resume debe fallar (token ya consumido)");
    }

    private Long insertProcessWithSuspendableTask() throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate(
                    "insert into process_definition (name, description, active, scheduled) "
                            + "values ('suspend-it', 'm-2 suspend test', true, false)");
            try (var rs = statement.executeQuery(
                    "select id from process_definition order by id desc limit 1")) {
                rs.next();
                var processDefinitionId = rs.getLong(1);
                statement.executeUpdate(
                        "insert into process_task_definition "
                                + "(process_definition_id, task_order, task_type, active, configuration_json) "
                                + "values (" + processDefinitionId + ", 1, '"
                                + SuspendThenCompleteTaskProvider.TASK_TYPE
                                + "', true, '{\"taskRef\":\"task-1\",\"executionMode\":\"once\"}')");
                return processDefinitionId;
            }
        }
    }

    private String readSingleString(String query) throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             var rs = statement.executeQuery(query)) {
            if (!rs.next()) return null;
            return rs.getString(1);
        }
    }
}
