package com.integrationhub.platform.integration;

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
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertEquals;

@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class CatalogAndExecutionResourceIT {

    @Inject
    DataSource dataSource;

    @BeforeEach
    void cleanDatabase() throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("TRUNCATE TABLE audit_event, staging_record, process_task_execution, process_execution, process_task_definition, process_definition, source_definition, reader_definition RESTART IDENTITY CASCADE");
        }
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void shouldCreateAndExecuteConfiguredProcess() throws Exception {
        Path tempFile = Files.createTempFile("integration-hub-it-", ".csv");
        Files.writeString(tempFile, "codigo,nombre\nC001,Ana\nC002,Luis\n");

        try {
            Number sourceId =
                    given()
                            .contentType(ContentType.JSON)
                            .body(Map.of(
                                    "name", "source-it",
                                    "sourceType", "FILESYSTEM",
                                    "active", true,
                                    "configurationJson", String.format("{\"path\":\"%s\"}", tempFile.toString().replace("\\", "\\\\"))
                            ))
                    .when()
                            .post("/api/source-definitions")
                    .then()
                            .statusCode(200)
                            .extract()
                            .path("id");

            Number readerId =
                    given()
                            .contentType(ContentType.JSON)
                            .body(Map.of(
                                    "name", "reader-it",
                                    "readerType", "CSV",
                                    "active", true,
                                    "configurationJson", "{\"delimiter\":\",\",\"encoding\":\"UTF-8\",\"hasHeader\":true}"
                            ))
                    .when()
                            .post("/api/reader-definitions")
                    .then()
                            .statusCode(200)
                            .extract()
                            .path("id");

            Number processId =
                    given()
                            .contentType(ContentType.JSON)
                            .body(Map.of(
                                    "name", "process-it",
                                    "description", "Proceso de integracion para tests",
                                    "active", true,
                                    "scheduled", false,
                                    "scheduleEvery", "",
                                    "tasks", List.of(
                                            Map.of(
                                                    "taskOrder", 1,
                                                    "taskType", "FILE_READ",
                                                    "sourceDefinitionId", sourceId.longValue(),
                                                    "readerDefinitionId", readerId.longValue(),
                                                    "configurationJson", "{}"
                                            ),
                                            Map.of(
                                                    "taskOrder", 2,
                                                    "taskType", "DB_WRITE",
                                                    "configurationJson", "{\"mode\":\"insert\",\"targetTable\":\"staging_record\"}"
                                            )
                                    )
                            ))
                    .when()
                            .post("/api/process-definitions")
                    .then()
                            .statusCode(200)
                            .extract()
                            .path("id");

            Number executionId =
                    given()
                    .when()
                            .post("/api/process-executions/{processDefinitionId}", processId.longValue())
                    .then()
                            .statusCode(200)
                            .body("status", is("COMPLETED"))
                            .extract()
                            .path("id");

            given()
                    .when()
                            .get("/api/query/process-executions")
                    .then()
                            .statusCode(200)
                            .body("size()", greaterThanOrEqualTo(1))
                            .body("[0].processDefinitionId", is(processId.intValue()));

            given()
                    .when()
                            .get("/api/query/process-executions/{processExecutionId}/tasks", executionId.longValue())
                    .then()
                            .statusCode(200)
                            .body("size()", is(2))
                            .body("[0].status", is("COMPLETED"))
                            .body("[1].status", is("COMPLETED"));

            given()
                    .when()
                            .get("/api/query/audit-events")
                    .then()
                            .statusCode(200)
                            .body("size()", greaterThanOrEqualTo(4));

            given()
                    .when()
                            .get("/api/query/overview-summary")
                    .then()
                            .statusCode(200)
                            .body("processes.total", is(1))
                            .body("sources.total", is(1))
                            .body("readers.total", is(1));

            assertEquals(2, countRows("staging_record"));
            assertEquals(1, countRows("process_execution"));
            assertEquals(2, countRows("process_task_execution"));
        } finally {
            Files.deleteIfExists(tempFile);
        }
    }

    @Test
    @TestSecurity(user = "operator", roles = {"operator"})
    void operatorShouldNotCreateSources() {
        given()
                .contentType(ContentType.JSON)
                .body(Map.of(
                        "name", "source-forbidden",
                        "sourceType", "FILESYSTEM",
                        "active", true,
                        "configurationJson", "{\"path\":\"C:/tmp/test.txt\"}"
                ))
        .when()
                .post("/api/source-definitions")
        .then()
                .statusCode(403);
    }

    private int countRows(String tableName) throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery("SELECT count(*) FROM " + tableName)) {
            resultSet.next();
            return resultSet.getInt(1);
        }
    }
}