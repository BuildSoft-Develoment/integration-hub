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
 * E2E REST (G-A, búsqueda inversa enriquecida): {@code GET /api/query/mt101-fragments/by-physical-line} resuelve
 * "archivo + línea física" a la <b>lista</b> de registros de staging (uno por ejecución: reprocesos visibles), cada uno
 * con su resumen de cuarentena si falló validación ({@code mt101_failed_record}). A través del stack JAX-RS → servicio →
 * repo → BD real, usando el índice V90 {@code (source_file_hash, physical_line)}. Con autorización por rol.
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class Mt101PhysicalLineLookupIT {

    @Inject
    DataSource dataSource;

    private long pdId;
    private long peId;
    private long tdId;

    @BeforeEach
    void clean() throws Exception {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            // Purga idempotente de toda la cadena 'pl-e2e' (varias @BeforeEach en la misma clase): staging → ejecución
            // → task-def → definición, para no colisionar con la constraint única de process_definition.name.
            s.execute("delete from staging_record where source_file_hash = 'PL-E2E'");
            s.execute("delete from mt101_failed_record where source_file_hash = 'PL-E2E'");
            s.execute("delete from process_execution where process_definition_id in "
                    + "(select id from process_definition where name = 'pl-e2e')");
            s.execute("delete from process_task_definition where process_definition_id in "
                    + "(select id from process_definition where name = 'pl-e2e')");
            s.execute("delete from process_definition where name = 'pl-e2e'");
            s.executeUpdate("insert into process_definition (name, description, active, scheduled) "
                    + "values ('pl-e2e', '', true, false)");
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
            peId = newExecution();
        }
    }

    @Test
    @TestSecurity(user = "ops", roles = {"payments-operator"})
    void resolvesPhysicalLineWithQuarantineSummaryEndToEnd() throws Exception {
        // Registro lógico 0 en la línea física 2 (cabecera), y lógico 1 en la 3.
        seed(peId, 0, 2L);
        var stagingId1 = seed(peId, 1, 3L);
        // El registro lógico 1 (source_record_number = record_index + 1 = 2) falló validación -> cuarentena.
        seedQuarantine(2L, "STRUCT.CHARGES_VALUE", "Valor inválido en campo charges", "ABC123", "XYZ789");

        given().queryParam("sourceFileHash", "PL-E2E").queryParam("physicalLine", 3)
                .when().get("/api/query/mt101-fragments/by-physical-line")
                .then().statusCode(200)
                .body("size()", is(1))
                .body("[0].stagingId", is((int) stagingId1))
                .body("[0].recordIndex", is(1))
                .body("[0].physicalLine", is(3))
                .body("[0].sourceFileHash", is("PL-E2E"))
                // G-A: el motivo de cuarentena viaja DESDE la línea física (un cuarentenado no tiene fragmento).
                .body("[0].quarantineRuleCode", is("STRUCT.CHARGES_VALUE"))
                .body("[0].quarantineMessage", is("Valor inválido en campo charges"))
                .body("[0].sendersReference", is("ABC123"))
                .body("[0].transactionReference", is("XYZ789"));

        // Una línea sin registro → lista vacía (200), no un error.
        given().queryParam("sourceFileHash", "PL-E2E").queryParam("physicalLine", 999)
                .when().get("/api/query/mt101-fragments/by-physical-line")
                .then().statusCode(200)
                .body("size()", is(0));
    }

    @Test
    @TestSecurity(user = "ops", roles = {"payments-operator"})
    void listsAllReprocessesForTheSamePhysicalLine() throws Exception {
        // Mismo archivo (hash) y misma línea física procesados en DOS ejecuciones (reproceso): AMBOS deben verse.
        seed(peId, 1, 3L);
        var pe2 = newExecution();
        seed(pe2, 1, 3L);

        given().queryParam("sourceFileHash", "PL-E2E").queryParam("physicalLine", 3)
                .when().get("/api/query/mt101-fragments/by-physical-line")
                .then().statusCode(200)
                .body("size()", is(2));

        // Acotando a una ejecución concreta se ve solo esa.
        given().queryParam("sourceFileHash", "PL-E2E").queryParam("physicalLine", 3)
                .queryParam("processExecutionId", pe2)
                .when().get("/api/query/mt101-fragments/by-physical-line")
                .then().statusCode(200)
                .body("size()", is(1))
                .body("[0].processExecutionId", is((int) pe2));
    }

    private long newExecution() throws Exception {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            s.executeUpdate("insert into process_execution (process_definition_id, status, execution_token) "
                    + "values (" + pdId + ", 'RUNNING', 'pl-tok-" + System.nanoTime() + "')");
            try (var rs = s.executeQuery("select max(id) from process_execution")) {
                rs.next();
                return rs.getLong(1);
            }
        }
    }

    private long seed(long executionId, long recordIndex, long physicalLine) throws Exception {
        try (Connection c = dataSource.getConnection();
             var st = c.prepareStatement("insert into staging_record "
                     + "(process_execution_id, task_definition_id, source_name, source_file_hash, record_index, "
                     + "payload_json, physical_line) values (" + executionId + ", " + tdId
                     + ", 'clientes.csv', 'PL-E2E', ?, '{}', ?) returning id")) {
            st.setLong(1, recordIndex);
            st.setLong(2, physicalLine);
            try (var rs = st.executeQuery()) {
                rs.next();
                return rs.getLong(1);
            }
        }
    }

    private void seedQuarantine(long sourceRecordNumber, String ruleCode, String message,
                                String sendersReference, String transactionReference) throws Exception {
        try (Connection c = dataSource.getConnection();
             var st = c.prepareStatement("insert into mt101_failed_record "
                     + "(fragment_set_id, senders_reference, transaction_reference, source_file_hash, "
                     + "source_record_number, rule_code, message, status) "
                     + "values ('FS-E2E', ?, ?, 'PL-E2E', ?, ?, ?, 'QUARANTINED')")) {
            st.setString(1, sendersReference);
            st.setString(2, transactionReference);
            st.setLong(3, sourceRecordNumber);
            st.setString(4, ruleCode);
            st.setString(5, message);
            st.executeUpdate();
        }
    }
}
