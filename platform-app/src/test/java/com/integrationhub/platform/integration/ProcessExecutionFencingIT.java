package com.integrationhub.platform.integration;

import com.integrationhub.platform.service.execution.FencingTokenLostException;
import com.integrationhub.platform.service.execution.ProcessExecutionStateService;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * P2 (fencing token) — E2E contra DB real: una transición sobre {@code process_execution} solo se aplica si el worker
 * sigue siendo el dueño RUNNING (su {@code execution_token} coincide). Reproduce el escenario zombi: el lease vence,
 * otro nodo recupera/reclama, y el worker viejo vuelve — NO puede completar/fallar el proceso ni tocar sus tareas.
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class ProcessExecutionFencingIT {

    @Inject
    DataSource dataSource;

    @Inject
    ProcessExecutionStateService stateService;

    @BeforeEach
    void clean() throws Exception {
        exec("TRUNCATE TABLE audit_spool, audit_event, process_task_execution, process_execution, "
                + "process_task_definition, process_definition RESTART IDENTITY CASCADE");
    }

    @Test
    void completeProcessSucceedsWhenTokenMatchesRunning() throws Exception {
        var peId = seedRunningProcess("owner-token");

        stateService.completeProcess(peId, "owner-token", "done");

        assertEquals("COMPLETED", statusOf(peId), "el dueño legítimo cierra el proceso");
    }

    @Test
    void completeProcessFencedWhenLeaseRecoveredByAnotherNode() throws Exception {
        var peId = seedRunningProcess("stale-token");
        // El barrido de recuperación de un lease vencido pasa el proceso a NEEDS_RECONCILIATION y limpia el token
        // (igual que recoverExpiredRunning). El worker viejo vuelve con su token ya inválido.
        exec("update process_execution set status = 'NEEDS_RECONCILIATION', execution_token = null where id = " + peId);

        assertThrows(FencingTokenLostException.class,
                () -> stateService.completeProcess(peId, "stale-token", "done"));

        assertEquals("NEEDS_RECONCILIATION", statusOf(peId),
                "el worker zombi NO sobrescribe el estado recuperado por otro nodo");
    }

    @Test
    void failProcessFencedWhenReclaimedByAnotherNode() throws Exception {
        var peId = seedRunningProcess("stale-token");
        // Otro nodo re-reclamó el proceso (nuevo owner/token), sigue RUNNING pero con OTRO token.
        exec("update process_execution set execution_token = 'node-b-token' where id = " + peId);

        assertThrows(FencingTokenLostException.class,
                () -> stateService.failProcess(peId, "stale-token", "boom"));

        assertEquals("RUNNING", statusOf(peId), "el proceso del nuevo dueño no se marca FAILED por un zombi");
    }

    @Test
    void completeTaskFencedForZombieWorker() throws Exception {
        var peId = seedRunningProcess("stale-token");
        var teId = seedRunningTask(peId);
        // Re-claim por otro nodo (nuevo token, sigue RUNNING).
        exec("update process_execution set execution_token = 'node-b-token' where id = " + peId);

        assertThrows(FencingTokenLostException.class,
                () -> stateService.completeTask(peId, "stale-token", teId, "done", Map.of()));

        assertEquals("RUNNING", taskStatusOf(teId), "un zombi no puede completar una tarea del nuevo dueño");
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private long seedRunningProcess(String token) throws Exception {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            s.executeUpdate("insert into process_definition (name, description, active, scheduled) "
                    + "values ('fencing-it', '', true, false)");
            var pdId = lastId(s, "process_definition");
            s.executeUpdate("insert into process_execution (process_definition_id, status, execution_token) "
                    + "values (" + pdId + ", 'RUNNING', '" + token + "')");
            return lastId(s, "process_execution");
        }
    }

    private long seedRunningTask(long peId) throws Exception {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            var pdId = queryLong(s, "select process_definition_id from process_execution where id = " + peId);
            s.executeUpdate("insert into process_task_definition "
                    + "(process_definition_id, task_order, task_type, active, configuration_json) "
                    + "values (" + pdId + ", 1, 'DB_WRITE', true, '{}')");
            var tdId = lastId(s, "process_task_definition");
            s.executeUpdate("insert into process_task_execution (process_execution_id, task_definition_id, status) "
                    + "values (" + peId + ", " + tdId + ", 'RUNNING')");
            return lastId(s, "process_task_execution");
        }
    }

    private String statusOf(long peId) throws Exception {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement();
             var rs = s.executeQuery("select status from process_execution where id = " + peId)) {
            rs.next();
            return rs.getString(1);
        }
    }

    private String taskStatusOf(long teId) throws Exception {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement();
             var rs = s.executeQuery("select status from process_task_execution where id = " + teId)) {
            rs.next();
            return rs.getString(1);
        }
    }

    private long lastId(Statement s, String table) throws Exception {
        return queryLong(s, "select id from " + table + " order by id desc limit 1");
    }

    private long queryLong(Statement s, String query) throws Exception {
        try (var rs = s.executeQuery(query)) {
            rs.next();
            return rs.getLong(1);
        }
    }

    private void exec(String sql) throws Exception {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            s.executeUpdate(sql);
        }
    }
}
