package com.integrationhub.platform.integration.async;

import com.integrationhub.platform.integration.PostgresTestResource;
import com.integrationhub.platform.integration.suspend.RecordingFollowUpTaskProvider;
import com.integrationhub.platform.service.execution.ProcessExecutionService;
import com.integrationhub.platform.service.execution.async.AsyncTaskDlqService;
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
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * IT del DLQ/recuperación async (ADR-015, grupo 3: 3c + 3a): redrive de DEAD del outbox y re-encolado
 * de una suspensión async colgada (limpiando el dedup de outbox e inbox).
 */
@QuarkusTest
@TestProfile(AsyncExecutionTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class AsyncTaskDlqIT {

    @Inject
    DataSource dataSource;

    @Inject
    ProcessExecutionService processExecutionService;

    @Inject
    AsyncTaskDlqService dlqService;

    @BeforeEach
    void clean() throws Exception {
        RecordingFollowUpTaskProvider.resetRecording();
        exec("TRUNCATE TABLE task_inbox, task_dispatch_outbox, audit_spool, audit_event, "
                + "process_task_execution, process_execution, process_task_definition, process_definition "
                + "RESTART IDENTITY CASCADE");
    }

    @Test
    void redriveOutboxDeadResetsRowsToPending() throws Exception {
        exec("insert into task_dispatch_outbox (idempotency_key, transport, envelope_json, status) values "
                + "('d1','KAFKA','{}','DEAD'),('d2','KAFKA','{}','DEAD'),('ok','KAFKA','{}','SENT')");

        var redriven = dlqService.redriveOutboxDead(1000);

        assertEquals(2, redriven);
        assertEquals(0, count("select count(*) from task_dispatch_outbox where status = 'DEAD'"));
        assertEquals(2, count("select count(*) from task_dispatch_outbox where status = 'PENDING'"));
    }

    @Test
    void requeueReturnsFalseWhenNoActiveSuspension() {
        assertFalse(dlqService.requeueSuspension(999L, 888L));
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void requeueRebuildsAndEnqueuesForStuckAsyncSuspension() throws Exception {
        var processDefinitionId = insertAsyncTask();
        processExecutionService.execute(processDefinitionId, Map.of(), "MANUAL"); // SUSPENDED + outbox PENDING

        var processExecutionId = count("select id from process_execution order by id desc limit 1");
        var taskDefinitionId = count("select id from process_task_definition order by id desc limit 1");
        var key = readString("select idempotency_key from task_dispatch_outbox order by id desc limit 1");

        // Simula que el item murió: la fila del outbox pasa a DEAD y queda un DEAD en el inbox.
        exec("update task_dispatch_outbox set status = 'DEAD' where idempotency_key = '" + key + "'");
        exec("insert into task_inbox (idempotency_key, status) values ('" + key + "','DEAD')");

        var requeued = dlqService.requeueSuspension(processExecutionId, taskDefinitionId);

        assertTrue(requeued);
        // La fila DEAD previa se limpió y hay una PENDING fresca con la misma clave; el DEAD del inbox se fue.
        assertEquals(1, count("select count(*) from task_dispatch_outbox where idempotency_key = '" + key + "'"));
        assertEquals(1, count("select count(*) from task_dispatch_outbox where status = 'PENDING' and idempotency_key = '" + key + "'"));
        assertEquals(0, count("select count(*) from task_inbox where idempotency_key = '" + key + "'"));
    }

    private Long insertAsyncTask() throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate(
                    "insert into process_definition (name, description, active, scheduled) "
                            + "values ('dlq-e2e', 'adr-015 dlq', true, false)");
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

    private long count(String query) throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             var rs = statement.executeQuery(query)) {
            rs.next();
            return rs.getLong(1);
        }
    }

    private String readString(String query) throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             var rs = statement.executeQuery(query)) {
            rs.next();
            return rs.getString(1);
        }
    }

    private void exec(String sql) throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute(sql);
        }
    }
}
