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
import static org.hamcrest.Matchers.nullValue;

/**
 * D1 (visibilidad): los endpoints de lookup del ledger de dispatch del PAY por lista exponen las intenciones
 * atascadas (UNCERTAIN / DISPATCHING) a través del stack completo JAX-RS → servicio → store → BD real, con
 * autorización por rol. Complementa los tests de store: prueba el wiring del endpoint y la serialización JSON.
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class Mt101PayDispatchIntentLookupIT {

    @Inject
    DataSource dataSource;

    @BeforeEach
    void clean() throws Exception {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            s.executeUpdate("truncate table mt101_pay_dispatch_intent restart identity");
            s.executeUpdate("truncate table mt101_archive restart identity cascade");
        }
    }

    @Test
    @TestSecurity(user = "ops", roles = {"payments-operator"})
    void reconcileClosesLedgerFromArchiveTerminalEndToEnd() throws Exception {
        // STATUS confirmó inline (archive CONFIRMED) pero el intent quedó UNCERTAIN con su ejecución.
        seedArchive("K-OK", 77L, "CONFIRMED");
        seedWithExec("REST|12|K-OK", "K-OK", 77L, "UNCERTAIN");

        given().queryParam("dispatchKey", "REST|12|K-OK")
                .queryParam("reason", "conciliación tras confirmación de STATUS")
                .when().post("/api/query/mt101-pay-dispatch-intents/reconcile")
                .then().statusCode(200)
                .body("outcome", is("RECONCILED"))
                .body("newStatus", is("SENT"));

        // Ya no aparece como atascado (se cerró el lazo del ledger).
        given().when().get("/api/query/mt101-pay-dispatch-intents/summary")
                .then().statusCode(200).body("stuck", is(0));
    }

    @Test
    @TestSecurity(user = "ops", roles = {"payments-operator"})
    void reconcileNoOpWhenArchiveNotTerminal() throws Exception {
        seedArchive("K-PEND", 78L, "ARCHIVED"); // aún no terminal
        seedWithExec("REST|12|K-PEND", "K-PEND", 78L, "UNCERTAIN");

        given().queryParam("dispatchKey", "REST|12|K-PEND")
                .queryParam("reason", "intento de conciliación")
                .when().post("/api/query/mt101-pay-dispatch-intents/reconcile")
                .then().statusCode(200)
                .body("outcome", is("NO_TERMINAL"))
                .body("newStatus", nullValue());

        // Sigue atascado (queda manual).
        given().when().get("/api/query/mt101-pay-dispatch-intents/summary")
                .then().statusCode(200).body("stuck", is(1));
    }

    private void seedArchive(String sendersReference, long processExecutionId, String status) throws Exception {
        try (Connection c = dataSource.getConnection();
             var st = c.prepareStatement("insert into mt101_archive (senders_reference, process_execution_id, status) "
                     + "values (?, ?, ?)")) {
            st.setString(1, sendersReference);
            st.setLong(2, processExecutionId);
            st.setString(3, status);
            st.executeUpdate();
        }
    }

    private void seedWithExec(String dispatchKey, String ref, long processExecutionId, String status) throws Exception {
        try (Connection c = dataSource.getConnection();
             var st = c.prepareStatement("insert into mt101_pay_dispatch_intent "
                     + "(dispatch_key, senders_reference, process_execution_id, status, attempts) values (?, ?, ?, ?, 1)")) {
            st.setString(1, dispatchKey);
            st.setString(2, ref);
            st.setLong(3, processExecutionId);
            st.setString(4, status);
            st.executeUpdate();
        }
    }

    @Test
    @TestSecurity(user = "ops", roles = {"payments-operator"})
    void summaryAndStuckExposeBlockedDispatchIntentsEndToEnd() throws Exception {
        seed("REST|12|D-SENT", "D-SENT", "SENT", null);
        seed("REST|12|D-UNC", "D-UNC", "UNCERTAIN", "timeout tras posible recepción");
        seed("REST|12|D-DISP", "D-DISP", "DISPATCHING", null);

        // /summary: total + atascados (UNCERTAIN + DISPATCHING) de un vistazo.
        given().when().get("/api/query/mt101-pay-dispatch-intents/summary")
                .then().statusCode(200)
                .body("total", is(3))
                .body("stuck", is(2))
                .body("byStatus.SENT", is(1))
                .body("byStatus.UNCERTAIN", is(1))
                .body("byStatus.DISPATCHING", is(1));

        // /stuck: lista solo los atascados con su motivo (para conciliar); el SENT no aparece.
        given().when().get("/api/query/mt101-pay-dispatch-intents/stuck")
                .then().statusCode(200)
                .body("size()", is(2))
                .body("findAll { it.status == 'SENT' }.size()", is(0))
                .body("find { it.sendersReference == 'D-UNC' }.errorMessage", containsString("recepción"))
                // Regresión: sembrado sin process_execution_id -> se serializa como null (no 0).
                .body("find { it.sendersReference == 'D-UNC' }.processExecutionId", nullValue());
    }

    private void seed(String dispatchKey, String ref, String status, String error) throws Exception {
        try (Connection c = dataSource.getConnection();
             var st = c.prepareStatement("insert into mt101_pay_dispatch_intent "
                     + "(dispatch_key, senders_reference, status, attempts, error_message) values (?, ?, ?, 1, ?)")) {
            st.setString(1, dispatchKey);
            st.setString(2, ref);
            st.setString(3, status);
            st.setString(4, error);
            st.executeUpdate();
        }
    }
}
