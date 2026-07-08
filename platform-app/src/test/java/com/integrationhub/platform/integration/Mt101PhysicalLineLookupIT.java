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
 * E2E REST (item 2, búsqueda inversa): {@code GET /api/query/mt101-fragments/by-physical-line} resuelve "archivo +
 * línea física" al registro de staging (staging_id + índice lógico), a través del stack JAX-RS → servicio → repo → BD
 * real, usando el índice V90 {@code (source_file_hash, physical_line)}. Con autorización por rol.
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class Mt101PhysicalLineLookupIT {

    @Inject
    DataSource dataSource;

    private long peId;
    private long tdId;

    @BeforeEach
    void clean() throws Exception {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            s.execute("delete from staging_record where source_file_hash = 'PL-E2E'");
            s.executeUpdate("insert into process_definition (name, description, active, scheduled) "
                    + "values ('pl-e2e', '', true, false)");
            long pdId;
            try (var rs = s.executeQuery("select max(id) from process_definition")) {
                rs.next();
                pdId = rs.getLong(1);
            }
            s.executeUpdate("insert into process_task_definition (process_definition_id, task_order, task_type, active, "
                    + "configuration_json) values (" + pdId + ", 1, 'DB_WRITE', true, '{}')");
            try (var rs = s.executeQuery("select max(id) from process_task_definition")) {
                rs.next();
                tdId = rs.getLong(1);
            }
            s.executeUpdate("insert into process_execution (process_definition_id, status, execution_token) "
                    + "values (" + pdId + ", 'RUNNING', 'pl-tok')");
            try (var rs = s.executeQuery("select max(id) from process_execution")) {
                rs.next();
                peId = rs.getLong(1);
            }
        }
    }

    @Test
    @TestSecurity(user = "ops", roles = {"payments-operator"})
    void resolvesPhysicalLineToStagingRowEndToEnd() throws Exception {
        // Registro lógico 0 en la línea física 2 (cabecera), y lógico 1 en la 3.
        seed(0, 2L);
        var stagingId1 = seed(1, 3L);

        given().queryParam("sourceFileHash", "PL-E2E").queryParam("physicalLine", 3)
                .when().get("/api/query/mt101-fragments/by-physical-line")
                .then().statusCode(200)
                .body("stagingId", is((int) stagingId1))
                .body("recordIndex", is(1))
                .body("physicalLine", is(3))
                .body("sourceFileHash", is("PL-E2E"));

        // Una línea sin registro → 204 No Content (JAX-RS mapea null), no un error.
        given().queryParam("sourceFileHash", "PL-E2E").queryParam("physicalLine", 999)
                .when().get("/api/query/mt101-fragments/by-physical-line")
                .then().statusCode(204);
    }

    private long seed(long recordIndex, long physicalLine) throws Exception {
        try (Connection c = dataSource.getConnection();
             var st = c.prepareStatement("insert into staging_record "
                     + "(process_execution_id, task_definition_id, source_name, source_file_hash, record_index, "
                     + "payload_json, physical_line) values (" + peId + ", " + tdId
                     + ", 'clientes.csv', 'PL-E2E', ?, '{}', ?) returning id")) {
            st.setLong(1, recordIndex);
            st.setLong(2, physicalLine);
            try (var rs = st.executeQuery()) {
                rs.next();
                return rs.getLong(1);
            }
        }
    }
}
