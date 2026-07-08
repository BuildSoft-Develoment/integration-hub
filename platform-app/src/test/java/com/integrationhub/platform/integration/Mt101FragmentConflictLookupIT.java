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
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.is;

/**
 * E2E REST (item 3): los endpoints de lookup exponen los conflictos de pago ({@code pay_conflict}) a través del
 * stack completo JAX-RS → servicio → repo → BD real, con autorización por rol. Complementa los tests unitarios de
 * repo/servicio: prueba el wiring del endpoint y la serialización JSON.
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class Mt101FragmentConflictLookupIT {

    @Inject
    DataSource dataSource;

    @BeforeEach
    void clean() throws Exception {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            s.execute("delete from mt101_build_fragment where fragment_set_id = 'CONFLICT-E2E'");
        }
    }

    @Test
    @TestSecurity(user = "ops", roles = {"payments-operator"})
    void summaryAndPayConflictsExposeConflictedFragmentsEndToEnd() throws Exception {
        seedFragment(1, "K1", "SENT", true, "STATUS/banco resolvió REJECTED sobre un fragmento ya SENT");
        seedFragment(2, "K2", "SENT", false, null);

        // /summary expone el conteo de conflictos de un vistazo.
        given().queryParam("fragmentSetId", "CONFLICT-E2E")
                .when().get("/api/query/mt101-fragments/summary")
                .then().statusCode(200)
                .body("total", is(2))
                .body("conflicts", is(1));

        // /pay-conflicts lista el fragmento en conflicto con su motivo (para conciliar).
        given().queryParam("fragmentSetId", "CONFLICT-E2E")
                .when().get("/api/query/mt101-fragments/pay-conflicts")
                .then().statusCode(200)
                .body("size()", is(1))
                .body("[0].sendersReference", is("K1"))
                .body("[0].status", is("SENT"))
                .body("[0].reason", containsString("REJECTED"));
    }

    private void seedFragment(int index, String ref, String status, boolean conflict, String reason) throws Exception {
        // process_execution_id / task_definition_id se dejan NULL (FKs a process_execution/task_definition): el
        // lookup solo necesita el fragmento y su pay_conflict, no una ejecución real.
        try (Connection c = dataSource.getConnection();
             var st = c.prepareStatement("insert into mt101_build_fragment "
                     + "(fragment_set_id, source_table, fragment_index, "
                     + "fragment_total, senders_reference, payload_hash, raw_payload, message_json, status, "
                     + "pay_conflict, pay_conflict_reason) values ('CONFLICT-E2E', 'staging_record', ?, 2, "
                     + "?, repeat('a', 64), 'raw', '{}', ?, ?, ?)")) {
            st.setInt(1, index);
            st.setString(2, ref);
            st.setString(3, status);
            st.setBoolean(4, conflict);
            st.setString(5, reason);
            st.executeUpdate();
        }
    }
}
