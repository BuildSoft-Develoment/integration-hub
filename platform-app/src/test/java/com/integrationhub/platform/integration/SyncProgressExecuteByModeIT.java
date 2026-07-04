package com.integrationhub.platform.integration;

import com.integrationhub.platform.integration.suspend.RecordingFollowUpTaskProvider;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.quarkus.test.security.TestSecurity;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.List;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * E2E de motor completo del progreso sync por {@code executeByMode} (camino record-input, NO fastpath).
 *
 * <p>El fastpath FILE_READ→DB_WRITE (o cualquier sink {@code BatchTaskProvider}) bypassa
 * {@code executeByMode}. Aquí el sink es {@code TEST_FOLLOW_UP} (un {@link com.integrationhub.platform.spi.task.TaskProvider}
 * plano, NO batch) ⇒ el fastpath no aplica y el motor ejecuta la tarea por {@code executeByMode}, que
 * upsertea el progreso acumulado a {@code task_sync_progress} cada {@code PROGRESS_EVERY_N_SLICES} slices.</p>
 *
 * <p>Con {@code batchSize=1} y 12 filas hay 12 slices (batchNumber 0..11). El upsert dispara en los
 * slices 0 y 10 (múltiplos de 10) con el {@code batchTo} acumulado (1 y 11) ⇒ el valor final persistido
 * es 11 (GREATEST). El último slice (batchNumber 11) no es múltiplo de 10, así que no se captura — es
 * progreso <i>en vivo</i>; el conteo final autoritativo vive en {@code process_task_execution}.</p>
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class SyncProgressExecuteByModeIT {

    @Inject
    DataSource dataSource;

    @BeforeEach
    void clean() throws Exception {
        RecordingFollowUpTaskProvider.resetRecording();
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("TRUNCATE TABLE task_sync_progress, process_task_execution, process_execution, "
                    + "process_task_definition, process_definition, source_definition, reader_definition "
                    + "RESTART IDENTITY CASCADE");
        }
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void executeByModeBatchTaskRecordsLiveSyncProgress() throws Exception {
        // 12 filas → con batchSize 1 → 12 slices (batchNumber 0..11).
        Path tempFile = Files.createTempFile("sync-progress-it-", ".csv");
        StringBuilder csv = new StringBuilder("codigo,nombre\n");
        for (int i = 1; i <= 12; i++) {
            csv.append("C").append(i).append(",n").append(i).append("\n");
        }
        Files.writeString(tempFile, csv.toString());

        try {
            Number sourceId = given().contentType(ContentType.JSON)
                    .body(Map.of("name", "src-sync", "sourceType", "FILESYSTEM", "active", true,
                            "configurationJson", String.format("{\"path\":\"%s\"}", tempFile.toString().replace("\\", "\\\\"))))
                    .when().post("/api/source-definitions")
                    .then().statusCode(200).extract().path("id");

            Number readerId = given().contentType(ContentType.JSON)
                    .body(Map.of("name", "rdr-sync", "readerType", "CSV", "active", true,
                            "configurationJson", "{\"delimiter\":\",\",\"encoding\":\"UTF-8\",\"hasHeader\":true,\"dataStartRowIndex\":1,\"fields\":[{\"name\":\"codigo\",\"position\":1},{\"name\":\"nombre\",\"position\":2}]}"))
                    .when().post("/api/reader-definitions")
                    .then().statusCode(200).extract().path("id");

            // task-1 FILE_READ produce records; task-2 TEST_FOLLOW_UP (NO batch) los consume por executeByMode.
            Number processId = given().contentType(ContentType.JSON)
                    .body(Map.of(
                            "name", "proc-sync", "description", "executeByMode sync progress", "active", true,
                            "scheduled", false, "scheduleEvery", "",
                            "tasks", List.of(
                                    Map.of("taskOrder", 1, "taskType", "FILE_READ",
                                            "sourceDefinitionId", sourceId.longValue(),
                                            "readerDefinitionId", readerId.longValue(),
                                            "configurationJson", "{\"taskRef\":\"task-1\",\"executionMode\":\"batch\"}"),
                                    Map.of("taskOrder", 2, "taskType", "TEST_FOLLOW_UP",
                                            "configurationJson", "{\"taskRef\":\"task-2\",\"executionMode\":\"batch\",\"input\":{\"source\":\"task-output\",\"sourceTaskRef\":\"task-1\",\"sourceOutput\":\"records\",\"batchSize\":1}}"))))
                    .when().post("/api/process-definitions")
                    .then().statusCode(200).extract().path("id");

            Number executionId = given().contentType(ContentType.JSON).body("{}")
                    .when().post("/api/process-executions/{processDefinitionId}", processId.longValue())
                    .then().statusCode(200).extract().path("id");

            awaitExecutionCompleted(executionId.longValue());

            // El sink se ejecutó una vez por slice (12 records, batchSize 1).
            assertEquals(12, RecordingFollowUpTaskProvider.EXECUTIONS.get(), "una ejecución por slice");

            // El motor persistió el progreso sync por executeByMode: upsert en slices 0 y 10 → 11 (GREATEST).
            long recordsProcessed = queryLong(
                    "select records_processed from task_sync_progress where process_execution_id = "
                            + executionId.longValue());
            assertEquals(11, recordsProcessed,
                    "batchTo acumulado del slice 10 (el último no-múltiplo-de-10 no se captura en vivo)");
        } finally {
            Files.deleteIfExists(tempFile);
        }
    }

    private long queryLong(String sql) throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             ResultSet rs = statement.executeQuery(sql)) {
            rs.next();
            return rs.getLong(1);
        }
    }

    private void awaitExecutionCompleted(long executionId) {
        long deadline = System.currentTimeMillis() + 30_000L;
        String status = null;
        while (System.currentTimeMillis() < deadline) {
            status = given().when().get("/api/query/process-executions/{id}", executionId)
                    .then().statusCode(200).extract().path("status");
            if (status != null && !"QUEUED".equals(status) && !"PENDING".equals(status) && !"RUNNING".equals(status)) {
                break;
            }
            try {
                Thread.sleep(250L);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        assertEquals("COMPLETED", status, "la ejecución debe terminar en COMPLETED");
    }
}
