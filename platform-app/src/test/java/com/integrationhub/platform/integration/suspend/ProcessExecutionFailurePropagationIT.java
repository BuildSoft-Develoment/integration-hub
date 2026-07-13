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
                    "TRUNCATE TABLE audit_spool, audit_event, staging_record, process_task_execution, "
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

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void ambiguousPaymentEndsNeedsReconciliationAndStopsByDefault() throws Exception {
        // G1: una tarea money-path que deja dinero UNCERTAIN (needsReconciliation) NO debe quedar FAILED opaco ni
        // COMPLETED silencioso: el proceso cierra NEEDS_RECONCILIATION y (sin continueOnFailure) detiene el pipeline.
        var processDefinitionId = insertProcess("needs-recon-default-it",
                "{\"taskRef\":\"task-1\",\"executionMode\":\"once\",\"needsReconciliation\":true}");

        var execution = processExecutionService.execute(processDefinitionId, Map.of(), "MANUAL");

        assertEquals(ExecutionStatus.NEEDS_RECONCILIATION, execution.status,
                "dinero ambiguo -> NEEDS_RECONCILIATION, no FAILED ni COMPLETED");
        assertEquals("COMPLETED_WITH_ERRORS", taskStatus(1),
                "la tarea con dinero ambiguo se audita COMPLETED_WITH_ERRORS, no FAILED (no es fallo técnico)");
        assertEquals(0, RecordingFollowUpTaskProvider.EXECUTIONS.get(),
                "sin continueOnFailure el pipeline se detiene tras el dinero ambiguo");
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void ambiguousPaymentWithContinueOnFailureRunsDownstreamButStillEndsNeedsReconciliation() throws Exception {
        // G1: con continueOnFailure el resolutor posterior (STATUS/RECONCILE, aquí simulado por la tarea downstream)
        // SÍ corre, pero el proceso NUNCA cierra COMPLETED con dinero UNCERTAIN pendiente: termina NEEDS_RECONCILIATION.
        var processDefinitionId = insertProcess("needs-recon-continue-it",
                "{\"taskRef\":\"task-1\",\"executionMode\":\"once\",\"needsReconciliation\":true,\"continueOnFailure\":true}");

        var execution = processExecutionService.execute(processDefinitionId, Map.of(), "MANUAL");

        assertEquals(ExecutionStatus.NEEDS_RECONCILIATION, execution.status,
                "con continueOnFailure sigue el pipeline pero NO cierra COMPLETED con dinero ambiguo pendiente");
        assertEquals("COMPLETED_WITH_ERRORS", taskStatus(1));
        assertEquals(1, RecordingFollowUpTaskProvider.EXECUTIONS.get(),
                "la tarea posterior (resolutor) sí corre con la política explícita");
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void aDownstreamResolverClearsTheReconciliationFlagAndProcessCompletes() throws Exception {
        // G1 (opción B): task-1 deja dinero ambiguo (needsReconciliation + continueOnFailure) pero task-2 (resolutor,
        // espejo de MT101_STATUS que resolvió TODO) emite resolvedReconciliation -> el motor LIMPIA el flag y el
        // proceso cierra COMPLETED (no NEEDS_RECONCILIATION): el flag no es "pegajoso" cuando un resolutor lo cierra.
        var processDefinitionId = insertProcess("needs-recon-resolved-it",
                "{\"taskRef\":\"task-1\",\"executionMode\":\"once\",\"needsReconciliation\":true,\"continueOnFailure\":true}",
                "{\"taskRef\":\"task-2\",\"executionMode\":\"once\",\"reconciliationResolved\":true}");

        var execution = processExecutionService.execute(processDefinitionId, Map.of(), "MANUAL");

        assertEquals(ExecutionStatus.COMPLETED, execution.status,
                "un resolutor que resolvió todo limpia el flag -> el proceso cierra COMPLETED");
        assertEquals(1, RecordingFollowUpTaskProvider.EXECUTIONS.get(), "el resolutor corrió");
    }

    private Long insertProcess(String name, String failingTaskConfigJson) throws Exception {
        return insertProcess(name, failingTaskConfigJson,
                "{\"taskRef\":\"task-2\",\"executionMode\":\"once\"}");
    }

    private Long insertProcess(String name, String failingTaskConfigJson, String followUpConfigJson) throws Exception {
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
                                + "', true, '" + followUpConfigJson + "')");
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
