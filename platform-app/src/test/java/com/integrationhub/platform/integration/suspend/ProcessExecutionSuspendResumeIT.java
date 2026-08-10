package com.integrationhub.platform.integration.suspend;

import com.integrationhub.platform.spi.execution.ExecutionStatus;
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
 * @covers spec 003-diseno-y-ejecucion-procesos T-017 (M-2 suspension engine), ADR-009
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
                    "TRUNCATE TABLE audit_spool, audit_event, staging_record, process_task_execution, "
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

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void reSuspendedTokenRemainsResumable() throws Exception {
        // Regresion: al re-suspender, resumed_at debe limpiarse o el nuevo token
        // queda inubicable (findActiveByResumeToken filtra resumedAt is null).
        var processDefinitionId = insertProcessWithTask(SuspendTwiceTaskProvider.TASK_TYPE, "suspend-twice-it");
        processExecutionService.execute(processDefinitionId, Map.of(), "MANUAL");

        var firstToken = readSingleString(
                "select resume_token from process_task_execution order by id desc limit 1");
        var first = resumeService.resume(firstToken, Map.of());
        assertEquals(ProcessExecutionResumeService.Outcome.RE_SUSPENDED, first.outcome());
        assertNotNull(first.nextResumeToken(), "re-suspension debe emitir token nuevo");

        var second = resumeService.resume(first.nextResumeToken(), Map.of());
        assertEquals(ProcessExecutionResumeService.Outcome.COMPLETED, second.outcome(),
                "el token re-emitido debe ser ubicable y completar el ciclo");
        assertEquals("2",
                readSingleString("select resume_count from process_task_execution order by id desc limit 1"));
        assertEquals("COMPLETED",
                readSingleString("select status from process_execution order by id desc limit 1"));
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void resumeContinuesDownstreamTasksAutomatically() throws Exception {
        // M-2.1: tras el resume, la tarea downstream debe ejecutarse sola (sin
        // re-drive manual) y ver los outputs de la tarea suspendida rehidratados.
        RecordingFollowUpTaskProvider.resetRecording();
        var processDefinitionId = insertProcessWithTask(
                SuspendThenCompleteTaskProvider.TASK_TYPE, "suspend-continuation-it");
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate(
                    "insert into process_task_definition "
                            + "(process_definition_id, task_order, task_type, active, configuration_json) "
                            + "values (" + processDefinitionId + ", 2, '"
                            + RecordingFollowUpTaskProvider.TASK_TYPE
                            + "', true, '{\"taskRef\":\"task-2\",\"executionMode\":\"once\"}')");
        }

        var execution = processExecutionService.execute(processDefinitionId, Map.of(), "MANUAL");
        assertEquals(ExecutionStatus.SUSPENDED, execution.status);
        assertEquals(0, RecordingFollowUpTaskProvider.EXECUTIONS.get(),
                "la tarea downstream no debe ejecutarse antes del resume");
        assertNotNull(readSingleString(
                        "select suspended_continuation from process_task_execution order by id desc limit 1"),
                "el envelope de continuacion debe persistirse al suspender");

        var token = readSingleString(
                "select resume_token from process_task_execution order by id desc limit 1");
        var outcome = resumeService.resume(token, Map.of("bankRef", "BANK-CONT"));

        assertEquals(ProcessExecutionResumeService.Outcome.COMPLETED, outcome.outcome(),
                () -> "la continuacion debe completar el proceso: " + outcome.details());
        assertTrue(outcome.processCompleted());
        assertEquals(1, RecordingFollowUpTaskProvider.EXECUTIONS.get(),
                "la tarea downstream debe haberse ejecutado exactamente una vez");
        assertEquals("COMPLETED", RecordingFollowUpTaskProvider.SEEN_UPSTREAM_STATUS.get(),
                "el follow-up debe ver task-1.status rehidratado del envelope + outputs del resume");

        assertEquals("COMPLETED",
                readSingleString("select status from process_execution order by id desc limit 1"));
        assertEquals(2L, ((Number) readSingleObject(
                        "select count(*) from process_task_execution where status = 'COMPLETED'")).longValue(),
                "ambas tareas deben quedar COMPLETED");
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void laReanudacionCorreElPlanQueLaEjecucionTenia_aunqueSeBorreLaTareaMientrasEstaSuspendida()
            throws Exception {
        // El plan viaja CONGELADO en el envelope. Antes la reanudacion relei­a la definicion viva y
        // filtraba por `taskOrder > afterTaskOrder`: desactivar la tarea downstream durante la
        // suspension (que es exactamente lo que hace ProcessCatalogService.update al guardar) la
        // borraba del plan, y el proceso cerraba COMPLETED sin ejecutarla y sin avisar.
        RecordingFollowUpTaskProvider.resetRecording();
        var processDefinitionId = insertProcessWithTask(
                SuspendThenCompleteTaskProvider.TASK_TYPE, "suspend-plan-congelado-borrado-it");
        insertFollowUpTask(processDefinitionId, 2);

        var execution = processExecutionService.execute(processDefinitionId, Map.of(), "MANUAL");
        assertEquals(ExecutionStatus.SUSPENDED, execution.status);

        // --- alguien edita el proceso mientras la ejecucion espera al banco ---
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("update process_task_definition set active = false "
                    + "where process_definition_id = " + processDefinitionId + " and task_order = 2");
        }

        var token = readSingleString(
                "select resume_token from process_task_execution where resume_token is not null "
                        + "order by id desc limit 1");
        var outcome = resumeService.resume(token, Map.of("bankRef", "BANK-FROZEN"));

        assertEquals(1, RecordingFollowUpTaskProvider.EXECUTIONS.get(),
                "la tarea downstream estaba en el plan de ESTA ejecucion: borrarla despues no puede "
                        + "quitarla de una ejecucion ya en vuelo");
        assertEquals(ProcessExecutionResumeService.Outcome.COMPLETED, outcome.outcome(),
                () -> "la continuacion debe completar el proceso: " + outcome.details());
        assertEquals("COMPLETED",
                readSingleString("select status from process_execution order by id desc limit 1"));
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void laReanudacionNoCorreUnaTareaAgregadaDespuesDeSuspender() throws Exception {
        // La otra direccion del mismo fallo: la ejecucion suspendio sin nada detras, asi que su plan
        // congelado esta vacio. Antes `countDownstreamTasks` preguntaba a la definicion viva y una
        // tarea agregada durante la suspension se ejecutaba sobre el resultado de un pago que nunca
        // la contemplo.
        RecordingFollowUpTaskProvider.resetRecording();
        var processDefinitionId = insertProcessWithTask(
                SuspendThenCompleteTaskProvider.TASK_TYPE, "suspend-plan-congelado-alta-it");

        var execution = processExecutionService.execute(processDefinitionId, Map.of(), "MANUAL");
        assertEquals(ExecutionStatus.SUSPENDED, execution.status);

        // --- alguien agrega una tarea al proceso mientras la ejecucion espera ---
        insertFollowUpTask(processDefinitionId, 2);

        var token = readSingleString(
                "select resume_token from process_task_execution where resume_token is not null "
                        + "order by id desc limit 1");
        var outcome = resumeService.resume(token, Map.of("bankRef", "BANK-LATE"));

        assertEquals(0, RecordingFollowUpTaskProvider.EXECUTIONS.get(),
                "una tarea que no estaba en el plan de esta ejecucion no puede colarse en su reanudacion");
        assertEquals(ProcessExecutionResumeService.Outcome.COMPLETED, outcome.outcome());
        assertTrue(outcome.processCompleted(),
                "sin nada pendiente en SU plan, la ejecucion cierra");
    }

    private void insertFollowUpTask(Long processDefinitionId, int taskOrder) throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate(
                    "insert into process_task_definition "
                            + "(process_definition_id, task_order, task_type, active, configuration_json) "
                            + "values (" + processDefinitionId + ", " + taskOrder + ", '"
                            + RecordingFollowUpTaskProvider.TASK_TYPE
                            + "', true, '{\"taskRef\":\"task-" + taskOrder + "\",\"executionMode\":\"once\"}')");
        }
    }

    private Long insertProcessWithSuspendableTask() throws Exception {
        return insertProcessWithTask(SuspendThenCompleteTaskProvider.TASK_TYPE, "suspend-it");
    }

    private Long insertProcessWithTask(String taskType, String processName) throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate(
                    "insert into process_definition (name, description, active, scheduled) "
                            + "values ('" + processName + "', 'm-2 suspend test', true, false)");
            try (var rs = statement.executeQuery(
                    "select id from process_definition order by id desc limit 1")) {
                rs.next();
                var processDefinitionId = rs.getLong(1);
                statement.executeUpdate(
                        "insert into process_task_definition "
                                + "(process_definition_id, task_order, task_type, active, configuration_json) "
                                + "values (" + processDefinitionId + ", 1, '" + taskType
                                + "', true, '{\"taskRef\":\"task-1\",\"executionMode\":\"once\"}')");
                return processDefinitionId;
            }
        }
    }

    private Object readSingleObject(String query) throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             var rs = statement.executeQuery(query)) {
            if (!rs.next()) return null;
            return rs.getObject(1);
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
