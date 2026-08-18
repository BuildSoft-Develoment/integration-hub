package com.integrationhub.platform.integration.async;

import com.integrationhub.platform.integration.IntegrationTestProfile;
import com.integrationhub.platform.integration.PostgresTestResource;
import com.integrationhub.platform.service.execution.ProcessExecutionStateService;
import com.integrationhub.platform.service.execution.SuspensionContinuation;
import com.integrationhub.platform.service.execution.async.AsyncSliceDispatchService.ScatterDispatch;
import com.integrationhub.platform.service.execution.async.AsyncTaskConsumer;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;

/**
 * E2E del lazo scatter-gather completo (Opción B, B1–B4) sin FILE_READ: se inyecta el scatter vía
 * {@code suspendTask} (como el motor en B2b), se leen los N work-items de slice del outbox y se
 * entregan al {@link AsyncTaskConsumer} real; el gather agrega N→1 y reanuda la tarea hasta completar
 * el proceso. Cierra el hueco de cobertura del doble check de B4.
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class AsyncScatterGatherE2EIT {

    @Inject
    SuspensionContinuation suspensionContinuation;

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
    }

    @Test
    void scatterDispatchThenConsumeAllSlicesCompletesTheProcess() throws Exception {
        var ids = seedRunningTask();
        var peId = ids[0];
        var tdId = ids[1];
        var teId = ids[2];

        // 3 slices, 5 records en total.
        var slices = List.of(
                List.of(rec("a"), rec("b")),
                List.of(rec("c")),
                List.of(rec("d"), rec("e")));
        // Nivel 2: contexto serializable que debe viajar en cada slice hasta el provider.
        var scatter = ScatterDispatch.materialized(peId, tdId, RecordingBatchTaskProvider.TASK_TYPE, "KAFKA",
                Map.of(), slices, Map.of("task-1.ref", "R-1"), Map.of("processName", "P"), Map.of("env", "prod"));

        // El motor abre el tracker(3) + encola 3 work-items + suspende, atómico (B2b).
        // PLAN CONGELADO: sin el, el resume degrada a COMPLETED_NEEDS_REDRIVE y el proceso se queda
        // en RUNNING para siempre. No es un detalle del test: desde M-2.1 el motor NO relee la
        // definicion viva para saber que falta —una edicion durante la suspension podia cerrar como
        // COMPLETED un proceso con tareas pendientes—, asi que exige el plan capturado al suspender.
        // Lista VACIA = la tarea suspendida era la ultima, que es el caso de estos procesos de una
        // sola tarea. Sembrar null es simular una suspension que el motor real ya no produce.
        var planCongelado = suspensionContinuation.marshal(Map.of(), Map.of(), "TEST", List.of());
        stateService.suspendTask(peId, "seed-tok", teId, "{\"scatter\":true}", "tok-scatter", null, planCongelado,
                "scatter", Map.of(), scatter);
        assertEquals("SUSPENDED", readString("select status from process_task_execution where id = " + teId));

        // Simula la entrega por broker: cada envelope_json es el payload de wire de una slice.
        for (var payload : readAll("select envelope_json from task_dispatch_outbox order by id asc")) {
            consumer.consume(payload, "KAFKA", "tasks.test_scatter_batch", java.util.UUID.randomUUID().toString());
        }

        // Todas las slices se ejecutaron (5 records repartidos) y el gather cerró el scatter.
        assertEquals(3, RecordingBatchTaskProvider.SLICE_EXECUTIONS.get(), "una ejecución por slice");
        assertEquals(5, RecordingBatchTaskProvider.TOTAL_RECORDS.get(), "los 5 records llegaron completos");
        // Nivel 2 E2E: el taskOutputs de la tarea origen viajó en la slice hasta el provider.
        assertInstanceOf(Map.class, RecordingBatchTaskProvider.SEEN_TASK_OUTPUTS.get(),
                "el provider recibió el taskOutputs propagado en la slice");
        assertEquals("R-1",
                ((Map<?, ?>) RecordingBatchTaskProvider.SEEN_TASK_OUTPUTS.get()).get("task-1.ref"),
                "la variable de la tarea origen se resolvió E2E (dispatch → slice → consumer → provider)");
        assertEquals("COMPLETED", readString(
                "select status from task_async_dispatch where process_execution_id = " + peId));
        // La tarea suspendida se reanudó y el proceso completó (una sola vez, en la última slice).
        assertEquals("COMPLETED", readString("select status from process_task_execution where id = " + teId));
        assertEquals("COMPLETED", readString("select status from process_execution where id = " + peId));
        // Dedup por-slice: 3 filas PROCESSED en el inbox.
        assertEquals("3", readString("select count(*) from task_inbox where status = 'PROCESSED'"));
    }

    private ReadRecord rec(String id) {
        return new ReadRecord(Map.of("id", id));
    }

    private long[] seedRunningTask() throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("insert into process_definition (name, description, active, scheduled) "
                    + "values ('scatter-e2e', '', true, false)");
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

    private List<String> readAll(String query) throws Exception {
        var out = new ArrayList<String>();
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             var rs = statement.executeQuery(query)) {
            while (rs.next()) {
                out.add(rs.getString(1));
            }
        }
        return out;
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
