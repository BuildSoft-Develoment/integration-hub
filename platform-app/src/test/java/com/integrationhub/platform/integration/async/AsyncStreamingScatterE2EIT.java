package com.integrationhub.platform.integration.async;

import com.integrationhub.platform.integration.IntegrationTestProfile;
import com.integrationhub.platform.integration.PostgresTestResource;
import com.integrationhub.platform.service.execution.ProcessExecutionStateService;
import com.integrationhub.platform.service.execution.async.AsyncPageWorkItem;
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
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * E2E del scatter por <b>table-streaming</b> (ADR-015, page-chain): una tarea batch async con input por
 * tabla se despacha como una <b>página semilla</b>; cada consumer de página <b>encola la siguiente</b>
 * (keyset paging por {@code id}) y procesa la suya, hasta agotar la tabla, donde la última página
 * <b>sella</b> el scatter y reanuda la tarea. Verifica que N (desconocido al abrir) se descubre por la
 * cadena, que todos los records se procesan una vez, y que el proceso completa.
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class AsyncStreamingScatterE2EIT {

    @Inject
    DataSource dataSource;

    @Inject
    ProcessExecutionStateService stateService;

    @Inject
    AsyncTaskConsumer consumer;

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
    void pageChainDispatchesEveryPageThenSealsAndCompletes() throws Exception {
        // 5 filas, batchSize 2 → páginas [1,2] [3,4] [5]: 3 slices, la última (1<2) sella total=3.
        for (var i = 1; i <= 5; i++) {
            exec("insert into stream_src (id, payload) values (" + i + ", 'p" + i + "')");
        }
        var ids = seedRunningTask();

        seedStreamingScatter(ids, 2);
        drainOutbox();

        assertEquals(3, RecordingBatchTaskProvider.SLICE_EXECUTIONS.get(), "3 páginas procesadas");
        assertEquals(5, RecordingBatchTaskProvider.TOTAL_RECORDS.get(), "los 5 records llegaron una vez");
        assertEquals("COMPLETED", readString(
                "select status from task_async_dispatch where process_execution_id = " + ids[0]));
        assertEquals("COMPLETED", readString("select status from process_task_execution where id = " + ids[2]));
        assertEquals("COMPLETED", readString("select status from process_execution where id = " + ids[0]));
        assertEquals("3", readString("select count(*) from task_inbox where status = 'PROCESSED'"),
                "dedup por-página: 3 filas PROCESSED (page-0/1/2)");
    }

    @Test
    void failFastMidChainStopsTheChainAndSkipsRemainingPages() throws Exception {
        // 7 filas, batchSize 2 → páginas [1,2] [3,4] [5,6] [7]. Falla en el id 3 (página 1), fail-fast.
        for (var i = 1; i <= 7; i++) {
            exec("insert into stream_src (id, payload) values (" + i + ", 'p" + i + "')");
        }
        RecordingBatchTaskProvider.FAIL_ON_RECORD_ID = "3";
        var ids = seedRunningTask();

        seedStreamingScatter(ids, 2);
        drainOutbox();

        // La tarea/proceso fallan (fail-fast).
        assertEquals("FAILED", readString(
                "select status from task_async_dispatch where process_execution_id = " + ids[0]));
        assertEquals("FAILED", readString("select status from process_execution where id = " + ids[0]));
        // Se procesaron las páginas 0 y 1 (ids 1-4); las siguientes (5,6,7) NO: la cadena se cortó.
        assertTrue(RecordingBatchTaskProvider.SEEN_IDS.containsAll(java.util.List.of("1", "2", "3", "4")));
        assertFalse(RecordingBatchTaskProvider.SEEN_IDS.contains("5"),
                "la página tras el fail-fast cortocircuita: no ejecuta el provider ni sigue la cadena");
        assertFalse(RecordingBatchTaskProvider.SEEN_IDS.contains("6"));
        assertFalse(RecordingBatchTaskProvider.SEEN_IDS.contains("7"));
    }

    @Test
    void emptyTableSealsImmediatelyAndCompletes() throws Exception {
        var ids = seedRunningTask(); // stream_src vacía

        seedStreamingScatter(ids, 2);
        drainOutbox();

        assertEquals(0, RecordingBatchTaskProvider.SLICE_EXECUTIONS.get(), "sin records: ninguna slice");
        assertEquals("COMPLETED", readString(
                "select status from task_async_dispatch where process_execution_id = " + ids[0]));
        assertEquals("COMPLETED", readString("select status from process_execution where id = " + ids[0]));
    }

    /** Inyecta el scatter streaming vía suspendTask (como el motor en runTask): open + seed + suspensión. */
    private void seedStreamingScatter(long[] ids, int batchSize) {
        var seed = AsyncPageWorkItem.seed("stream_src", null, "id", Map.of(), batchSize,
                Map.of(), Map.of(), Map.of(), Map.of());
        var scatter = ScatterDispatch.streaming(ids[0], ids[1], RecordingBatchTaskProvider.TASK_TYPE, "KAFKA", seed);
        stateService.suspendTask(ids[0], ids[2], "{\"scatter\":true}", "tok-streaming", null, null,
                "scatter", Map.of(), scatter);
    }

    /** Entrega las páginas del outbox al consumer; como cada una encola la siguiente, itera hasta agotar. */
    private void drainOutbox() throws Exception {
        var consumed = new HashSet<Long>();
        boolean progressed = true;
        while (progressed) {
            progressed = false;
            try (Connection connection = dataSource.getConnection();
                 Statement statement = connection.createStatement();
                 var rs = statement.executeQuery("select id, envelope_json from task_dispatch_outbox order by id asc")) {
                while (rs.next()) {
                    var outboxId = rs.getLong(1);
                    var payload = rs.getString(2);
                    if (consumed.add(outboxId)) {
                        consumer.consume(payload, "KAFKA", "tasks.test_scatter_batch");
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
                    + "values ('streaming-scatter-e2e', '', true, false)");
            var pdId = lastId(statement, "process_definition");
            statement.executeUpdate("insert into process_task_definition "
                    + "(process_definition_id, task_order, task_type, active, configuration_json) "
                    + "values (" + pdId + ", 1, '" + RecordingBatchTaskProvider.TASK_TYPE + "', true, '{}')");
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
