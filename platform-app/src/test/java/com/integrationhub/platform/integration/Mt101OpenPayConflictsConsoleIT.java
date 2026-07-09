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
import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;

/**
 * Consola de PAY Conflicts (inbox transversal) E2E REST: {@code GET /api/query/mt101-fragments/pay-conflicts/open}
 * lista los conflictos de pago ABIERTOS de <b>todos</b> los sets/ejecuciones (sin conocer el set de antemano), cada uno
 * con su {@code fragmentSetId} y {@code processExecutionId} para abrir la vista por-set. A través del stack completo
 * JAX-RS → servicio → repo → BD real, con autorización por rol.
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class Mt101OpenPayConflictsConsoleIT {

    @Inject
    DataSource dataSource;

    private long peId;

    @BeforeEach
    void clean() throws Exception {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            // El endpoint es GLOBAL (todos los conflictos abiertos): se limpian TODOS para que cada test sea determinista.
            s.execute("delete from mt101_build_fragment where pay_conflict = true");
            s.execute("delete from mt101_corrective_pay_fragment where pay_conflict = true");
            s.execute("delete from mt101_build_fragment where fragment_set_id in ('OPEN-CON-A', 'OPEN-CON-B')");
            s.execute("delete from mt101_corrective_pay_fragment where rebuild_run_id = 'OPEN-CON-RUN'");
            s.execute("delete from mt101_rebuild_run where rebuild_run_id = 'OPEN-CON-RUN'");
            s.execute("delete from process_execution where process_definition_id in "
                    + "(select id from process_definition where name = 'open-con-e2e')");
            s.execute("delete from process_definition where name = 'open-con-e2e'");
            s.executeUpdate("insert into process_definition (name, description, active, scheduled) "
                    + "values ('open-con-e2e', '', true, false)");
            long pdId;
            try (var rs = s.executeQuery("select max(id) from process_definition")) {
                rs.next();
                pdId = rs.getLong(1);
            }
            s.executeUpdate("insert into process_execution (process_definition_id, status, execution_token) "
                    + "values (" + pdId + ", 'RUNNING', 'open-con-tok-" + System.nanoTime() + "')");
            try (var rs = s.executeQuery("select max(id) from process_execution")) {
                rs.next();
                peId = rs.getLong(1);
            }
        }
    }

    @Test
    @TestSecurity(user = "ops", roles = {"payments-operator"})
    void listsOpenConflictsAcrossSetsWithExecutionLinkage() throws Exception {
        // Conflicto en el set A (con ejecución real) y en el set B (otra ejecución nula); un no-conflicto en A se excluye.
        seedConflict("OPEN-CON-A", 1, "K-A1", "SENT", true, "banco REJECTED sobre un SENT", peId);
        seedConflict("OPEN-CON-A", 2, "K-A2", "SENT", false, null, peId); // no-conflicto → no debe aparecer
        seedConflict("OPEN-CON-B", 1, "K-B1", "SENT", true, "otra contradicción terminal", null);

        // El inbox transversal trae AMBOS sets sin pedir fragmentSetId; el no-conflicto no aparece.
        given().when().get("/api/query/mt101-fragments/pay-conflicts/open")
                .then().statusCode(200)
                .body("items.fragmentSetId", hasItems("OPEN-CON-A", "OPEN-CON-B"))
                .body("items.sendersReference", hasItems("K-A1", "K-B1"))
                .body("items.sendersReference", not(hasItems("K-A2")))
                // El fragmento del set A viaja con su ejecución (para abrir quarantine/lineage), su source y su motivo.
                .body("items.find { it.sendersReference == 'K-A1' }.processExecutionId", is((int) peId))
                .body("items.find { it.sendersReference == 'K-A1' }.fragmentSetId", is("OPEN-CON-A"))
                .body("items.find { it.sendersReference == 'K-A1' }.source", is("NORMAL"))
                .body("items.find { it.sendersReference == 'K-A1' }.reason", containsString("REJECTED"));
    }

    @Test
    @TestSecurity(user = "ops", roles = {"payments-operator"})
    void listsCorrectiveConflictsWithSourceAndOriginalSet() throws Exception {
        // Conflicto en el ledger CORRECTIVO: el inbox lo trae con source=CORRECTIVE, el set ORIGINAL (join a
        // rebuild_run) para el mismo deep-link, y el rebuildRunId de contexto; processExecutionId es null (maker-checker).
        seedRebuildRun("OPEN-CON-RUN", "OPEN-CON-ORIG", "OPEN-CON-CORR");
        seedCorrectiveConflict("OPEN-CON-RUN", "OPEN-CON-CORR", "K-C1", "SENT",
                "banco REJECTED sobre un correctivo ya SENT");

        given().when().get("/api/query/mt101-fragments/pay-conflicts/open")
                .then().statusCode(200)
                .body("items.find { it.sendersReference == 'K-C1' }.source", is("CORRECTIVE"))
                .body("items.find { it.sendersReference == 'K-C1' }.fragmentSetId", is("OPEN-CON-ORIG"))
                .body("items.find { it.sendersReference == 'K-C1' }.rebuildRunId", is("OPEN-CON-RUN"))
                .body("items.find { it.sendersReference == 'K-C1' }.processExecutionId", is(nullValue()))
                .body("items.find { it.sendersReference == 'K-C1' }.reason", containsString("REJECTED"));
    }

    @Test
    @TestSecurity(user = "ops", roles = {"payments-operator"})
    void paginatesWithCompositeKeysetCursorAcrossBothLedgers() throws Exception {
        // 3 conflictos normales + 2 correctivos = 5, mezclados. Paginando de a 2 con el cursor compuesto se recorren
        // TODOS exactamente una vez (lossless, sin duplicados), a través de ambos ledgers.
        seedConflict("OPEN-CON-A", 1, "P-N1", "SENT", true, "n1", peId);
        seedConflict("OPEN-CON-A", 2, "P-N2", "SENT", true, "n2", peId);
        seedConflict("OPEN-CON-B", 1, "P-N3", "SENT", true, "n3", null);
        seedRebuildRun("OPEN-CON-RUN", "OPEN-CON-ORIG", "OPEN-CON-CORR");
        seedCorrectiveConflict("OPEN-CON-RUN", "OPEN-CON-CORR", "P-C1", "SENT", "c1");
        seedCorrectiveConflict("OPEN-CON-RUN", "OPEN-CON-CORR", "P-C2", "SENT", "c2");

        var collected = new java.util.ArrayList<String>();
        String cursor = null;
        var guard = 0;
        do {
            var req = given().queryParam("limit", 2);
            if (cursor != null) {
                req = req.queryParam("cursor", cursor);
            }
            var page = req.when().get("/api/query/mt101-fragments/pay-conflicts/open")
                    .then().statusCode(200).extract().jsonPath();
            collected.addAll(page.getList("items.sendersReference", String.class));
            cursor = page.getString("nextCursor");
        } while (cursor != null && ++guard < 10);

        // Los 5 conflictos, exactamente una vez cada uno (sin saltos ni duplicados).
        org.junit.jupiter.api.Assertions.assertEquals(
                java.util.List.of("P-C1", "P-C2", "P-N1", "P-N2", "P-N3"),
                collected.stream().sorted().toList());
    }

    @Test
    @TestSecurity(user = "ops", roles = {"payments-operator"})
    void paginationIsChronologicalNotLexicographicAcrossFractionalPrecision() throws Exception {
        // Regresión: dos conflictos en el MISMO segundo con precisión fraccional distinta, en la MISMA rama, con
        // limit=2 (ambos entran en el mismo fetch de página 1). Un orden lexicográfico por string invertiría su orden
        // ("…00Z" > "…00.500Z") → el cursor tomaría el .500 (más nuevo) como marca de agua y la página 2 re-devolvería
        // el segundo entero → DUPLICADO. Con orden cronológico (Instant) no pasa.
        seedConflictAt("OPEN-CON-A", 1, "F-FRAC", "2026-07-09 12:00:00.500");  // .500 (más nuevo)
        seedConflictAt("OPEN-CON-A", 2, "F-WHOLE", "2026-07-09 12:00:00");     // segundo entero (más viejo)

        var collected = new java.util.ArrayList<String>();
        String cursor = null;
        var guard = 0;
        do {
            var req = given().queryParam("limit", 2);
            if (cursor != null) {
                req = req.queryParam("cursor", cursor);
            }
            var page = req.when().get("/api/query/mt101-fragments/pay-conflicts/open")
                    .then().statusCode(200).extract().jsonPath();
            collected.addAll(page.getList("items.sendersReference", String.class));
            cursor = page.getString("nextCursor");
        } while (cursor != null && ++guard < 5);

        // Ambos, exactamente una vez (sin duplicado), y el más NUEVO (.500) primero (orden cronológico correcto).
        org.junit.jupiter.api.Assertions.assertEquals(java.util.List.of("F-FRAC", "F-WHOLE"), collected);
    }

    @Test
    @TestSecurity(user = "ops", roles = {"payments-operator"})
    void rejectsMalformedCursorWith400() {
        given().queryParam("cursor", "not-a-valid-cursor")
                .when().get("/api/query/mt101-fragments/pay-conflicts/open")
                .then().statusCode(400);
    }

    private void seedConflict(String setId, int index, String ref, String status, boolean conflict,
                              String reason, Long executionId) throws Exception {
        try (Connection c = dataSource.getConnection();
             var st = c.prepareStatement("insert into mt101_build_fragment "
                     + "(fragment_set_id, process_execution_id, source_table, fragment_index, "
                     + "fragment_total, senders_reference, payload_hash, raw_payload, message_json, status, "
                     + "pay_conflict, pay_conflict_reason) values (?, ?, 'staging_record', ?, 2, "
                     + "?, repeat('a', 64), 'raw', '{}', ?, ?, ?)")) {
            st.setString(1, setId);
            if (executionId == null) {
                st.setNull(2, java.sql.Types.BIGINT);
            } else {
                st.setLong(2, executionId);
            }
            st.setInt(3, index);
            st.setString(4, ref);
            st.setString(5, status);
            st.setBoolean(6, conflict);
            st.setString(7, reason);
            st.executeUpdate();
        }
    }

    /** Siembra un conflicto normal con {@code updated_at} EXPLÍCITO (para probar el orden por precisión fraccional). */
    private void seedConflictAt(String setId, int index, String ref, String updatedAt) throws Exception {
        try (Connection c = dataSource.getConnection();
             var st = c.prepareStatement("insert into mt101_build_fragment "
                     + "(fragment_set_id, source_table, fragment_index, fragment_total, senders_reference, "
                     + "payload_hash, raw_payload, message_json, status, pay_conflict, pay_conflict_reason, updated_at) "
                     + "values (?, 'staging_record', ?, 2, ?, repeat('a', 64), 'raw', '{}', 'SENT', true, 'x', ?::timestamp)")) {
            st.setString(1, setId);
            st.setInt(2, index);
            st.setString(3, ref);
            st.setString(4, updatedAt);
            st.executeUpdate();
        }
    }

    private void seedRebuildRun(String runId, String originalSetId, String correctiveSetId) throws Exception {
        try (Connection c = dataSource.getConnection();
             var st = c.prepareStatement("insert into mt101_rebuild_run "
                     + "(rebuild_run_id, original_fragment_set_id, corrective_set_id, status) "
                     + "values (?, ?, ?, 'COMPLETED')")) {
            st.setString(1, runId);
            st.setString(2, originalSetId);
            st.setString(3, correctiveSetId);
            st.executeUpdate();
        }
    }

    private void seedCorrectiveConflict(String runId, String correctiveSetId, String ref, String payStatus,
                                        String reason) throws Exception {
        try (Connection c = dataSource.getConnection();
             var st = c.prepareStatement("insert into mt101_corrective_pay_fragment "
                     + "(rebuild_run_id, corrective_set_id, corrective_senders_reference, payload_hash, "
                     + "idempotency_key, pay_status, pay_conflict, pay_conflict_reason) "
                     + "values (?, ?, ?, repeat('a', 64), ?, ?, true, ?)")) {
            st.setString(1, runId);
            st.setString(2, correctiveSetId);
            st.setString(3, ref);
            st.setString(4, "idem-" + ref);
            st.setString(5, payStatus);
            st.setString(6, reason);
            st.executeUpdate();
        }
    }
}
