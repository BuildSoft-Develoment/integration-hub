package com.integrationhub.platform.integration;

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

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.is;

/**
 * B (E2E REST): {@code GET /api/query/record-lineage} en modo sourceRow acota la traza a una ejecución cuando se pasa
 * {@code processExecutionId} — desambigua reprocesos del mismo archivo+fila (varias ejecuciones dejan eventos bajo el
 * mismo {@code (sourceFileHash, recordNumber)}). Sin el parámetro, trae todos (comportamiento previo).
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class RecordLineageBySourceRowExecutionIT {

    private static final String HASH = "b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1";

    @Inject
    DataSource dataSource;

    @BeforeEach
    void clean() throws Exception {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            s.execute("delete from audit_record_event where source_file_hash = '" + HASH + "'");
            // Misma fila (record_number=5) del mismo archivo (hash), procesada en DOS ejecuciones (reproceso).
            seed("evt-1", 101L, "RECORD_SENT", "SENT");
            seed("evt-2", 102L, "RECORD_REJECTED", "REJECTED");
        }
    }

    private void seed(String eventId, long processExecutionId, String stage, String status) throws Exception {
        try (Connection c = dataSource.getConnection();
             var st = c.prepareStatement("insert into audit_record_event "
                     + "(event_id, stage, status, process_execution_id, source_file_hash, record_number, event_ts) "
                     + "values (?, ?, ?, ?, ?, 5, current_timestamp)")) {
            st.setString(1, eventId);
            st.setString(2, stage);
            st.setString(3, status);
            st.setLong(4, processExecutionId);
            st.setString(5, HASH);
            st.executeUpdate();
        }
    }

    @Test
    @TestSecurity(user = "ops", roles = {"auditor"})
    void sourceRowWithoutExecutionReturnsAllReprocesses() {
        given().queryParam("sourceFileHash", HASH).queryParam("recordNumber", 5)
                .when().get("/api/query/record-lineage")
                .then().statusCode(200)
                .body("size()", is(2));
    }

    @Test
    @TestSecurity(user = "ops", roles = {"auditor"})
    void sourceRowWithExecutionReturnsOnlyThatExecution() {
        given().queryParam("sourceFileHash", HASH).queryParam("recordNumber", 5)
                .queryParam("processExecutionId", 101)
                .when().get("/api/query/record-lineage")
                .then().statusCode(200)
                .body("size()", is(1))
                .body("[0].processExecutionId", is(101))
                .body("[0].stage", is("RECORD_SENT"));
    }
}
