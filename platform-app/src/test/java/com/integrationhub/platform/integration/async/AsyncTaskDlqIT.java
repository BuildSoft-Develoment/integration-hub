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

    @Inject
    com.integrationhub.platform.service.execution.ExecutionProgressService progressService;

    @Inject
    com.integrationhub.platform.repository.TaskSyncProgressRepository syncProgressRepository;

    @BeforeEach
    void clean() throws Exception {
        RecordingFollowUpTaskProvider.resetRecording();
        exec("TRUNCATE TABLE task_async_dispatch, task_sync_progress, task_inbox, task_dispatch_outbox, audit_spool, audit_event, "
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

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void requeueRefusesScatterSuspensionToAvoidCompletingWithoutProcessing() throws Exception {
        var processDefinitionId = insertAsyncTask();
        processExecutionService.execute(processDefinitionId, Map.of(), "MANUAL");
        var processExecutionId = count("select id from process_execution order by id desc limit 1");
        var taskDefinitionId = count("select id from process_task_definition order by id desc limit 1");
        // Marca la suspensión como un scatter (tracker presente): el requeue per-task la corrompería.
        exec("insert into task_async_dispatch (process_execution_id, task_definition_id, total_slices) values ("
                + processExecutionId + ", " + taskDefinitionId + ", 3)");

        assertFalse(dlqService.requeueSuspension(processExecutionId, taskDefinitionId),
                "un scatter no se re-encola como per-task");
    }

    @Test
    void listDeadReturnsInboxDeadAndPoisonNewestFirst() throws Exception {
        exec("insert into task_inbox (idempotency_key, task_type, status, error) values "
                + "('k1','REST_CALL','DEAD','boom'),('k2','MT101_PARSE','POISON','trama'),"
                + "('ok','REST_CALL','PROCESSED',null)");

        var dead = dlqService.listDead(100);

        assertEquals(2, dead.size(), "DEAD + POISON, no PROCESSED");
        assertEquals("k2", dead.get(0).idempotencyKey(), "más recientes primero (id desc)");
        assertEquals("boom", dead.get(1).error());
    }

    @Test
    void listStalledReturnsStalledStreamingScatters() throws Exception {
        exec("insert into task_async_dispatch (process_execution_id, task_definition_id, total_slices, "
                + "last_page_index, last_page_json, last_progress_at) values "
                + "(10, 11, null, 2, '{}', current_timestamp - interval '10 minutes')");        // streaming estancado
        exec("insert into task_async_dispatch (process_execution_id, task_definition_id, total_slices, "
                + "last_progress_at) values (12, 13, 3, current_timestamp)");                     // materializado: no aplica

        var stalled = dlqService.listStalled(java.time.Duration.ofMinutes(5), 100);

        assertEquals(1, stalled.size());
        assertEquals(10L, stalled.get(0).processExecutionId());
        assertEquals(2, stalled.get(0).lastPageIndex());
    }

    @Test
    void progressAggregatesScatterTrackersPerTaskWithStreamingFlag() throws Exception {
        // Tarea materializada (total conocido → %) y tarea streaming (total NULL → indeterminado).
        exec("insert into task_async_dispatch (process_execution_id, task_definition_id, total_slices, "
                + "completed_slices, failed_slices, last_progress_at) values (70, 71, 4, 2, 1, current_timestamp)");
        exec("insert into task_async_dispatch (process_execution_id, task_definition_id, total_slices, "
                + "completed_slices, last_page_index, last_page_json, last_progress_at) "
                + "values (70, 72, null, 5, 5, '{}', current_timestamp)");

        var progress = progressService.progress(70L);

        assertEquals(2, progress.scatterTasks().size());
        var materialized = progress.scatterTasks().stream().filter(p -> p.taskDefinitionId() == 71L).findFirst().orElseThrow();
        assertEquals(75, materialized.percent(), "2+1 de 4 = 75%");
        assertFalse(materialized.streaming());
        var streaming = progress.scatterTasks().stream().filter(p -> p.taskDefinitionId() == 72L).findFirst().orElseThrow();
        assertTrue(streaming.streaming());
        assertEquals(null, streaming.percent(), "streaming sin sellar: sin % falso");
        assertEquals(5, streaming.completed());
    }

    @Test
    void syncProgressUpsertsAndSurfacesInProgressApi() throws Exception {
        // Tabla dedicada, upsert out-of-band (no depende del estado de la tarea ni lo pisa el engine).
        syncProgressRepository.upsert(80L, 81L, 100000);
        syncProgressRepository.upsert(80L, 81L, 420000); // avanza (mismo par → upsert)
        syncProgressRepository.upsert(80L, 82L, 5);       // otra tarea de la misma ejecución

        assertEquals(420000, count("select records_processed from task_sync_progress where "
                + "process_execution_id = 80 and task_definition_id = 81"));

        var progress = progressService.progress(80L);
        assertEquals(2, progress.syncTasks().size());
        var t81 = progress.syncTasks().stream().filter(p -> p.taskDefinitionId() == 81L).findFirst().orElseThrow();
        assertEquals(420000L, t81.recordsProcessed());
    }

    @Test
    void syncProgressIsMonotonicUnderOutOfOrderUpserts() throws Exception {
        // A escala, los modos paralelos emiten upserts que pueden aplicarse FUERA DE ORDEN. El valor es un
        // contador acumulativo absoluto: un upsert menor tardío NO debe hacer retroceder el progreso visible.
        syncProgressRepository.upsert(90L, 91L, 500000);
        syncProgressRepository.upsert(90L, 91L, 200000); // llega tarde y es menor → debe ignorarse (GREATEST)

        assertEquals(500000, count("select records_processed from task_sync_progress where "
                + "process_execution_id = 90 and task_definition_id = 91"),
                "el contador no retrocede ante un upsert menor fuera de orden");

        syncProgressRepository.upsert(90L, 91L, 750000); // avance legítimo posterior
        assertEquals(750000, count("select records_processed from task_sync_progress where "
                + "process_execution_id = 90 and task_definition_id = 91"));
    }

    @Test
    void healthAggregatesDeadAndStalled() throws Exception {
        // Filas muertas: 1 outbox DEAD + 1 inbox DEAD + 1 inbox POISON = 3.
        exec("insert into task_dispatch_outbox (idempotency_key, transport, envelope_json, status) values ('h1','KAFKA','{}','DEAD')");
        exec("insert into task_inbox (idempotency_key, status) values ('h2','DEAD'),('h3','POISON')");
        // Scatters streaming: uno estancado (10 min sin progreso) + uno reciente (no cuenta).
        exec("insert into task_async_dispatch (process_execution_id, task_definition_id, total_slices, "
                + "last_page_index, last_page_json, last_progress_at) values "
                + "(30, 31, null, 1, '{}', current_timestamp - interval '10 minutes')");
        exec("insert into task_async_dispatch (process_execution_id, task_definition_id, total_slices, "
                + "last_page_index, last_page_json, last_progress_at) values "
                + "(32, 33, null, 1, '{}', current_timestamp)");

        var health = dlqService.health(java.time.Duration.ofMinutes(5));

        assertEquals(3, health.dead(), "outbox DEAD + inbox DEAD + inbox POISON");
        assertEquals(1, health.stalled(), "solo el streaming sin progreso por >5 min");
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
