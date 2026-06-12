package com.integrationhub.platform.integration.suspend;

import com.integrationhub.platform.domain.ExecutionStatus;
import com.integrationhub.platform.integration.IntegrationTestProfile;
import com.integrationhub.platform.integration.PostgresTestResource;
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

/**
 * Propagacion de {@code TaskResult.failure} al engine (bloqueante del analisis
 * de produccion): un fallo de negocio — validacion con errores, pagos
 * rechazados — nunca debe quedar como tarea "completada" que deja avanzar el
 * pipeline hacia el envio.
 *
 * @covers spec 003 (engine), spec 008-mensajeria-pagos RF-002/RF-004
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class ProcessExecutionFailurePropagationIT {

    @Inject
    DataSource dataSource;

    @Inject
    ProcessExecutionService processExecutionService;

    @BeforeEach
    void cleanDatabase() throws Exception {
        RecordingFollowUpTaskProvider.resetRecording();
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
    void businessFailureStopsProcessAndSkipsDownstreamByDefault() throws Exception {
        var processDefinitionId = insertProcess("failure-default-it", "{\"taskRef\":\"task-1\",\"executionMode\":\"once\"}");

        var execution = processExecutionService.execute(processDefinitionId, Map.of(), "MANUAL");

        assertEquals(ExecutionStatus.FAILED, execution.status,
                "TaskResult.failure debe dejar el proceso FAILED, no COMPLETED");
        assertEquals(0, RecordingFollowUpTaskProvider.EXECUTIONS.get(),
                "la tarea downstream NO debe ejecutarse tras un failure");
        assertEquals("FAILED", taskStatus(1));
        assertEquals(1L, countTaskExecutions(),
                "solo la tarea fallida debe tener ejecucion registrada");
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void continueOnFailureCompletesWithErrorsAndRunsDownstream() throws Exception {
        // Politica explicita para flujos que siguen con los elementos validos
        // (e.g. masivo: el gate VALIDATED/REJECTED ya aisla los invalidos).
        var processDefinitionId = insertProcess("failure-continue-it",
                "{\"taskRef\":\"task-1\",\"executionMode\":\"once\",\"continueOnFailure\":true}");

        var execution = processExecutionService.execute(processDefinitionId, Map.of(), "MANUAL");

        assertEquals(ExecutionStatus.COMPLETED, execution.status,
                "con continueOnFailure el proceso completa");
        assertEquals("COMPLETED_WITH_ERRORS", taskStatus(1),
                "la tarea fallida queda auditada como COMPLETED_WITH_ERRORS, no COMPLETED");
        assertEquals(1, RecordingFollowUpTaskProvider.EXECUTIONS.get(),
                "la tarea downstream debe ejecutarse con la politica explicita");
    }

    private Long insertProcess(String name, String failingTaskConfigJson) throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate(
                    "insert into process_definition (name, description, active, scheduled) "
                            + "values ('" + name + "', 'failure propagation test', true, false)");
            try (var rs = statement.executeQuery(
                    "select id from process_definition order by id desc limit 1")) {
                rs.next();
                var processDefinitionId = rs.getLong(1);
                statement.executeUpdate(
                        "insert into process_task_definition "
                                + "(process_definition_id, task_order, task_type, active, configuration_json) "
                                + "values (" + processDefinitionId + ", 1, '" + FailingTaskProvider.TASK_TYPE
                                + "', true, '" + failingTaskConfigJson + "')");
                statement.executeUpdate(
                        "insert into process_task_definition "
                                + "(process_definition_id, task_order, task_type, active, configuration_json) "
                                + "values (" + processDefinitionId + ", 2, '" + RecordingFollowUpTaskProvider.TASK_TYPE
                                + "', true, '{\"taskRef\":\"task-2\",\"executionMode\":\"once\"}')");
                return processDefinitionId;
            }
        }
    }

    private String taskStatus(int taskOrder) throws Exception {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "select e.status from process_task_execution e "
                             + "join process_task_definition d on d.id = e.task_definition_id "
                             + "where d.task_order = ? order by e.id desc limit 1")) {
            statement.setInt(1, taskOrder);
            try (var rs = statement.executeQuery()) {
                rs.next();
                return rs.getString(1);
            }
        }
    }

    private long countTaskExecutions() throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             var rs = statement.executeQuery("select count(*) from process_task_execution")) {
            rs.next();
            return rs.getLong(1);
        }
    }
}
