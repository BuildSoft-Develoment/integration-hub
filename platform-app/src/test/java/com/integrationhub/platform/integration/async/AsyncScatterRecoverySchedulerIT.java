package com.integrationhub.platform.integration.async;

import com.integrationhub.platform.integration.PostgresTestResource;
import com.integrationhub.platform.service.execution.ProcessExecutionStateService;
import com.integrationhub.platform.service.execution.SuspensionContinuation;
import com.integrationhub.platform.service.execution.async.AsyncPageWorkItem;
import com.integrationhub.platform.service.execution.async.AsyncScatterRecoveryScheduler;
import com.integrationhub.platform.service.execution.async.AsyncSliceDispatchService.ScatterDispatch;
import com.integrationhub.platform.service.execution.async.AsyncTaskConsumer;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * IT del <b>scheduler</b> de auto-recuperación (ADR-015): valida que {@code sweep()} —con el gating
 * {@code tasks.async.recovery.enabled=true} y la config de umbral— detecta una page-chain estancada y la
 * reanuda. Complementa a {@code AsyncStreamingScatterE2EIT} (que prueba el método de servicio directo)
 * cubriendo el wrapper del scheduler (gate + parseo de Duration + wiring).
 */
@QuarkusTest
@TestProfile(AsyncRecoveryTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class AsyncScatterRecoverySchedulerIT {

    @Inject
    SuspensionContinuation suspensionContinuation;

    @Inject
    DataSource dataSource;

    @Inject
    ProcessExecutionStateService stateService;

    @Inject
    AsyncTaskConsumer consumer;

    @Inject
    AsyncScatterRecoveryScheduler scheduler;

    @BeforeEach
    void clean() throws Exception {
        RecordingBatchTaskProvider.reset();
        exec("TRUNCATE TABLE task_async_dispatch, task_inbox, task_dispatch_outbox, audit_spool, audit_event, "
                + "process_task_execution, process_execution, process_task_definition, process_definition "
                + "RESTART IDENTITY CASCADE");
        exec("create table if not exists stream_src (id integer primary key, payload varchar(64))");
        exec("truncate table stream_src");
    }

    @Test
    void schedulerSweepRecoversStalledChain() throws Exception {
        for (var i = 1; i <= 5; i++) {
            exec("insert into stream_src (id, payload) values (" + i + ", 'p" + i + "')");
        }
        var ids = seedRunningTask();
        seedStreamingScatter(ids);

        var consumed = new HashSet<Long>();
        consumeFirstUnconsumed(consumed); // page-0 → encola page-1
        exec("delete from task_dispatch_outbox where id = (select max(id) from task_dispatch_outbox)"); // pierde page-1
        assertEquals("SUSPENDED", readString("select status from process_execution where id = " + ids[0]));

        // El sweep del scheduler (gated ON, umbral 0s) detecta el estancado y re-inyecta la página perdida.
        var before = Integer.parseInt(readString("select count(*) from task_dispatch_outbox"));
        scheduler.sweep();
        var after = Integer.parseInt(readString("select count(*) from task_dispatch_outbox"));
        assertEquals(before + 1, after, "el sweep re-inyectó una página al outbox");

        drainOutbox(consumed);

        assertEquals("COMPLETED", readString("select status from process_execution where id = " + ids[0]));
        assertTrue(RecordingBatchTaskProvider.SEEN_IDS.containsAll(java.util.List.of("1", "2", "3", "4", "5")));
    }

    private void seedStreamingScatter(long[] ids) {
        var seed = AsyncPageWorkItem.seed("stream_src", null, "id", Map.of(), 2,
                Map.of(), Map.of(), Map.of(), Map.of());
        var scatter = ScatterDispatch.streaming(ids[0], ids[1], RecordingBatchTaskProvider.TASK_TYPE, "KAFKA", seed);
        // PLAN CONGELADO: sin el, el resume degrada a COMPLETED_NEEDS_REDRIVE y el proceso se queda
        // en RUNNING para siempre. No es un detalle del test: desde M-2.1 el motor NO relee la
        // definicion viva para saber que falta —una edicion durante la suspension podia cerrar como
        // COMPLETED un proceso con tareas pendientes—, asi que exige el plan capturado al suspender.
        // Lista VACIA = la tarea suspendida era la ultima, que es el caso de estos procesos de una
        // sola tarea. Sembrar null es simular una suspension que el motor real ya no produce.
        var planCongelado = suspensionContinuation.marshal(Map.of(), Map.of(), "TEST", List.of());
        stateService.suspendTask(ids[0], "seed-tok", ids[2], "{\"scatter\":true}", "tok-sched-" + ids[2], null, planCongelado,
                "scatter", Map.of(), scatter);
    }

    private void consumeFirstUnconsumed(HashSet<Long> consumed) throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             var rs = statement.executeQuery("select id, envelope_json from task_dispatch_outbox order by id asc")) {
            while (rs.next()) {
                var outboxId = rs.getLong(1);
                if (consumed.add(outboxId)) {
                    consumer.consumeWithRetries(rs.getString(2), "KAFKA", "tasks.test_scatter_batch");
                    return;
                }
            }
        }
    }

    private void drainOutbox(HashSet<Long> consumed) throws Exception {
        boolean progressed = true;
        while (progressed) {
            progressed = false;
            try (Connection connection = dataSource.getConnection();
                 Statement statement = connection.createStatement();
                 var rs = statement.executeQuery("select id, envelope_json from task_dispatch_outbox order by id asc")) {
                while (rs.next()) {
                    if (consumed.add(rs.getLong(1))) {
                        consumer.consumeWithRetries(rs.getString(2), "KAFKA", "tasks.test_scatter_batch");
                        progressed = true;
                    }
                }
            }
        }
    }

    private long[] seedRunningTask() throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("insert into process_definition (name, description, active, scheduled) "
                    + "values ('sched-recovery-e2e', '', true, false)");
            var pdId = lastId(statement, "process_definition");
            statement.executeUpdate("insert into process_task_definition "
                    + "(process_definition_id, task_order, task_type, active, configuration_json) "
                    + "values (" + pdId + ", 1, '" + RecordingBatchTaskProvider.TASK_TYPE + "', true, '{}')");
            var tdId = lastId(statement, "process_task_definition");
            statement.executeUpdate("insert into process_execution (process_definition_id, status, execution_token) "
                    + "values (" + pdId + ", 'RUNNING', 'seed-tok')");
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
