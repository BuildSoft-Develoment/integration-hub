package com.integrationhub.platform.integration.async;

import com.integrationhub.platform.integration.IntegrationTestProfile;
import com.integrationhub.platform.integration.PostgresTestResource;
import com.integrationhub.platform.repository.TaskAsyncDispatchRepository;
import com.integrationhub.platform.service.execution.ProcessExecutionStateService;
import com.integrationhub.platform.service.execution.async.AsyncSliceDispatchService.ScatterDispatch;
import com.integrationhub.platform.spi.reader.ReadRecord;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * IT del wiring atómico de B2b (Opción B): {@code suspendTask(..., ScatterDispatch)} abre el tracker
 * N→1 y encola los N work-items de slice <b>en la misma transacción</b> que la suspensión. Verifica la
 * pieza novel (atomicidad suspend + scatter), que es el mismo transactional-outbox del per-task.
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class AsyncScatterWiringIT {

    @Inject
    DataSource dataSource;

    @Inject
    ProcessExecutionStateService stateService;

    @Inject
    TaskAsyncDispatchRepository tracker;

    @BeforeEach
    void clean() throws Exception {
        exec("TRUNCATE TABLE task_async_dispatch, task_dispatch_outbox, audit_spool, audit_event, "
                + "process_task_execution, process_execution, process_task_definition, process_definition "
                + "RESTART IDENTITY CASCADE");
    }

    @Test
    void suspendWithScatterOpensTrackerAndEnqueuesSlicesAtomically() throws Exception {
        var ids = seedRunningTask();
        var peId = ids[0];
        var tdId = ids[1];
        var teId = ids[2];

        var slices = List.of(
                List.of(new ReadRecord(Map.of("id", "a"))),
                List.of(new ReadRecord(Map.of("id", "b"))),
                List.of(new ReadRecord(Map.of("id", "c"))));
        var scatter = new ScatterDispatch(peId, tdId, "DB_WRITE", "KAFKA", Map.of("targetTable", "t"), slices);

        stateService.suspendTask(peId, teId, "{\"scatter\":true}", "tok-scatter", null, null,
                "scatter test", Map.of(), scatter);

        // El tracker se abrió con N=3.
        var trackerRow = tracker.findByExecutionAndTask(peId, tdId).orElseThrow();
        assertEquals(3, trackerRow.totalSlices);
        assertEquals("PENDING", trackerRow.status);
        // Se encolaron 3 work-items de slice, todos PENDING, con la suspensión — en una sola tx.
        assertEquals(3, count("select count(*) from task_dispatch_outbox where status = 'PENDING'"));
        assertEquals(3, count("select count(*) from task_dispatch_outbox where envelope_json like '%\"kind\":\"SLICE\"%'"));
        // La tarea quedó suspendida.
        assertEquals("SUSPENDED", readString("select status from process_task_execution where id = " + teId));
    }

    /** Inserta pd/ptd/pe/pte RUNNING y devuelve [processExecutionId, taskDefinitionId, taskExecutionId]. */
    private long[] seedRunningTask() throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("insert into process_definition (name, description, active, scheduled) "
                    + "values ('scatter-wiring', '', true, false)");
            var pdId = lastId(statement, "process_definition");
            statement.executeUpdate("insert into process_task_definition "
                    + "(process_definition_id, task_order, task_type, active, configuration_json) "
                    + "values (" + pdId + ", 1, 'DB_WRITE', true, '{}')");
            var tdId = lastId(statement, "process_task_definition");
            statement.executeUpdate("insert into process_execution (process_definition_id, status) "
                    + "values (" + pdId + ", 'RUNNING')");
            var peId = lastId(statement, "process_execution");
            statement.executeUpdate("insert into process_task_execution (process_execution_id, task_definition_id, status) "
                    + "values (" + peId + ", " + tdId + ", 'RUNNING')");
            var teId = lastId(statement, "process_task_execution");
            return new long[]{peId, tdId, teId};
        }
    }

    private long lastId(Statement statement, String table) throws Exception {
        try (var rs = statement.executeQuery("select id from " + table + " order by id desc limit 1")) {
            rs.next();
            return rs.getLong(1);
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
