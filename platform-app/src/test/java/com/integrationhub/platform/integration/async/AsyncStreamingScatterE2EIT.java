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

    @Inject
    com.integrationhub.platform.service.execution.async.AsyncTaskDlqService dlqService;

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
    void transientPageFailureIsRiddenOutByInAppRetry() throws Exception {
        // 5 filas / batch 2 → páginas [1,2] [3,4] [5]. La página [3,4] LANZA (transitorio) 2 veces y a la
        // 3ra completa: el retry in-app (consumeWithRetries) lo absorbe sin romper la cadena ni haltear.
        for (var i = 1; i <= 5; i++) {
            exec("insert into stream_src (id, payload) values (" + i + ", 'p" + i + "')");
        }
        RecordingBatchTaskProvider.THROW_ON_RECORD_ID = "3";
        RecordingBatchTaskProvider.THROW_REMAINING.set(2);
        var ids = seedRunningTask();

        seedStreamingScatter(ids, 2);
        drainOutbox();

        assertEquals("COMPLETED", readString("select status from process_execution where id = " + ids[0]));
        assertEquals(3, RecordingBatchTaskProvider.SLICE_EXECUTIONS.get(),
                "3 páginas contadas una vez cada una (los reintentos no inflan el conteo)");
        assertTrue(RecordingBatchTaskProvider.SEEN_IDS.containsAll(java.util.List.of("1", "2", "3", "4", "5")));
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
    void brokenChainIsRecoveredByRequeueingTheLastPage() throws Exception {
        // 5 filas / batch 2 → páginas [1,2] [3,4] [5]. Simulamos que la página 1 se pierde (DLQ) tras
        // que la página 0 la encoló: la cadena se rompe (la sucesora nunca se encola) → scatter atascado.
        for (var i = 1; i <= 5; i++) {
            exec("insert into stream_src (id, payload) values (" + i + ", 'p" + i + "')");
        }
        var ids = seedRunningTask();
        // Con contexto: prueba que la propagación por la cadena Y la re-inyección lo preservan.
        seedStreamingScatter(ids, 2, Map.of("task-1.ref", "R-99"));

        // Consume solo la página semilla (page-0): encola page-1 y registra last_page=1.
        var consumed = new HashSet<Long>();
        consumeFirstUnconsumed(consumed);
        // Simula la pérdida de page-1 (murió/DLQ): borra su fila del outbox.
        exec("delete from task_dispatch_outbox where id = (select max(id) from task_dispatch_outbox)");

        // Atascado: tracker PENDING con last_page_index=1, proceso aún SUSPENDED (la cadena no sigue).
        assertEquals("PENDING", readString(
                "select status from task_async_dispatch where process_execution_id = " + ids[0]));
        assertEquals("1", readString(
                "select last_page_index from task_async_dispatch where process_execution_id = " + ids[0]));
        assertEquals("SUSPENDED", readString("select status from process_execution where id = " + ids[0]));

        // Recuperación DLQ: re-inyecta la última página despachada (page-1) → la cadena reanuda.
        assertTrue(dlqService.requeueSuspension(ids[0], ids[1]), "requeue debe re-inyectar la página del streaming");
        drainOutbox(consumed);

        // La cadena completó: los 5 records se procesaron y el proceso cerró.
        assertEquals("COMPLETED", readString("select status from process_execution where id = " + ids[0]));
        assertTrue(RecordingBatchTaskProvider.SEEN_IDS.containsAll(java.util.List.of("1", "2", "3", "4", "5")),
                "tras recuperar, la cadena procesó todos los records");
        // El contexto se propagó por la cadena Y sobrevivió a la re-inyección de la página perdida.
        assertEquals("R-99",
                ((Map<?, ?>) RecordingBatchTaskProvider.SEEN_TASK_OUTPUTS.get()).get("task-1.ref"),
                "el taskOutputs viajó por la cadena y la recuperación lo preservó");
    }

    @Test
    void sweepRecoversMultipleStalledScattersIndependently() throws Exception {
        for (var i = 1; i <= 3; i++) {
            exec("insert into stream_src (id, payload) values (" + i + ", 'p" + i + "')");
        }
        // Dos scatters streaming distintos (mismo origen), ambos rotos.
        var a = seedRunningTask();
        seedStreamingScatter(a, 2);
        var b = seedRunningTask();
        seedStreamingScatter(b, 2);

        var consumed = new HashSet<Long>();
        consumeFirstUnconsumed(consumed); // seed de A → encola A-page-1
        consumeFirstUnconsumed(consumed); // seed de B → encola B-page-1
        // Pierde ambas page-1 (las 2 filas más nuevas): las dos cadenas quedan estancadas.
        exec("delete from task_dispatch_outbox where id in "
                + "(select id from task_dispatch_outbox order by id desc limit 2)");

        // Un solo sweep re-inyecta AMBOS (loop multi-item, cada requeue en su tx propia).
        var recovered = dlqService.recoverStalledStreamingScatters(java.time.Duration.ZERO, 10);
        assertEquals(2, recovered, "el sweep recupera los dos scatters estancados independientemente");
        drainOutbox(consumed);

        assertEquals("COMPLETED", readString("select status from process_execution where id = " + a[0]));
        assertEquals("COMPLETED", readString("select status from process_execution where id = " + b[0]));
    }

    @Test
    void stalledChainIsAutoRecoveredBySweep() throws Exception {
        for (var i = 1; i <= 5; i++) {
            exec("insert into stream_src (id, payload) values (" + i + ", 'p" + i + "')");
        }
        var ids = seedRunningTask();
        seedStreamingScatter(ids, 2);

        var consumed = new HashSet<Long>();
        consumeFirstUnconsumed(consumed); // page-0 → encola page-1
        exec("delete from task_dispatch_outbox where id = (select max(id) from task_dispatch_outbox)"); // pierde page-1
        assertEquals("SUSPENDED", readString("select status from process_execution where id = " + ids[0]));

        // Auto-resume: el sweep detecta el scatter estancado (umbral 0) y re-inyecta su última página.
        var recovered = dlqService.recoverStalledStreamingScatters(java.time.Duration.ZERO, 10);
        assertEquals(1, recovered, "el sweep re-inyectó el scatter estancado");
        drainOutbox(consumed);

        assertEquals("COMPLETED", readString("select status from process_execution where id = " + ids[0]));
        assertTrue(RecordingBatchTaskProvider.SEEN_IDS.containsAll(java.util.List.of("1", "2", "3", "4", "5")),
                "el sweep reanudó la cadena hasta procesar todos los records");
    }

    /** Consume la fila de outbox de menor id aún no consumida (para entregar solo la semilla). */
    private void consumeFirstUnconsumed(HashSet<Long> consumed) throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             var rs = statement.executeQuery("select id, envelope_json from task_dispatch_outbox order by id asc")) {
            while (rs.next()) {
                var outboxId = rs.getLong(1);
                if (!consumed.contains(outboxId)) {
                    consumed.add(outboxId);
                    consumer.consumeWithRetries(rs.getString(2), "KAFKA", "tasks.test_scatter_batch");
                    return;
                }
            }
        }
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

    private void seedStreamingScatter(long[] ids, int batchSize) {
        seedStreamingScatter(ids, batchSize, Map.of());
    }

    /** Inyecta el scatter streaming vía suspendTask (como el motor en runTask): open + seed + suspensión. */
    private void seedStreamingScatter(long[] ids, int batchSize, Map<String, Object> taskOutputs) {
        var seed = AsyncPageWorkItem.seed("stream_src", null, "id", Map.of(), batchSize,
                Map.of(), taskOutputs, Map.of(), Map.of());
        var scatter = ScatterDispatch.streaming(ids[0], ids[1], RecordingBatchTaskProvider.TASK_TYPE, "KAFKA", seed);
        // Token único por tarea (ux_process_task_execution_resume_token) para permitir múltiples scatters.
        stateService.suspendTask(ids[0], ids[2], "{\"scatter\":true}", "tok-streaming-" + ids[2], null, null,
                "scatter", Map.of(), scatter);
    }

    /** Entrega las páginas del outbox al consumer; como cada una encola la siguiente, itera hasta agotar. */
    private void drainOutbox() throws Exception {
        drainOutbox(new HashSet<>());
    }

    private void drainOutbox(HashSet<Long> consumed) throws Exception {
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
                        // Camino real de producción: con retry in-app del transitorio antes del nack.
                        consumer.consumeWithRetries(payload, "KAFKA", "tasks.test_scatter_batch");
                        progressed = true;
                    }
                }
            }
        }
    }

    private final java.util.concurrent.atomic.AtomicInteger seedSeq = new java.util.concurrent.atomic.AtomicInteger();

    private long[] seedRunningTask() throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            // Nombre único por llamada (process_definition.name suele ser único) para permitir múltiples seeds.
            statement.executeUpdate("insert into process_definition (name, description, active, scheduled) "
                    + "values ('streaming-scatter-e2e-" + seedSeq.incrementAndGet() + "', '', true, false)");
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
