package com.integrationhub.platform.integration;

import com.integrationhub.platform.spi.payments.ValidationIssue;
import com.integrationhub.platform.provider.task.payments.swift.Mt101FragmentStore;
import com.integrationhub.platform.provider.task.payments.swift.Mt101ValidateTaskProvider;
import com.integrationhub.platform.provider.task.payments.model.Mt101Message;
import com.integrationhub.platform.spi.task.TaskContext;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.quarkus.test.security.TestSecurity;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Simulacion E2E del flujo de homologacion de un banco — la misma via que se
 * usara en produccion con las guias H2H reales:
 *
 * <ol>
 *   <li>Import del perfil via {@code POST /api/payment-validation-rules/import}
 *       (el JSON vive en {@code qa/fase-6-qa/perfiles-simulados/}).</li>
 *   <li>Golden conforme pasa {@code MT101_VALIDATE ruleSet=bank:SIM-ESTRICTO}
 *       sin issues.</li>
 *   <li>Cada regla del perfil detecta su violacion con el codigo esperado.</li>
 *   <li>Flujo masivo: el gate de fragmentos marca VALIDATED/REJECTED
 *       individualmente segun el perfil.</li>
 * </ol>
 *
 * <p>El perfil es FICTICIO (no reglas reales de ningun banco); valida el
 * mecanismo de onboarding, no a un banco concreto.</p>
 *
 * @covers spec 008-mensajeria-pagos RF-011, RF-023
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class BankProfileHomologationIT {

    private static final String RULE_SET = "bank:SIM-ESTRICTO";

    @Inject
    DataSource dataSource;

    @Inject
    Mt101ValidateTaskProvider validateProvider;

    @Inject
    Mt101FragmentStore fragmentStore;

    @BeforeEach
    void cleanDatabase() throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("TRUNCATE TABLE payment_validation_rule RESTART IDENTITY CASCADE");
            statement.execute("TRUNCATE TABLE mt101_build_fragment RESTART IDENTITY CASCADE");
        }
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void simulatedBankHomologationEndToEnd() throws Exception {
        // 1. Import del perfil simulado por la via real (mismo JSON que usaria ops).
        var profileJson = Files.readString(
                Path.of("..", "qa", "fase-6-qa", "perfiles-simulados", "bank-sim-estricto.json"));
        given()
                .contentType(ContentType.JSON)
                .body(profileJson)
        .when()
                .post("/api/payment-validation-rules/import")
        .then()
                .statusCode(200)
                .body("ruleSet", equalTo(RULE_SET))
                .body("importedCount", equalTo(8));

        // 2. Golden conforme: pasa el perfil sin issues.
        var compliant = validate(compliantMessage());
        assertTrue(compliant.success(), () -> "golden conforme debe pasar: " + compliant.details());
        assertEquals(0, compliant.outputs().get("invalidCount"));

        // 3. Cada regla detecta su violacion con el codigo esperado.
        assertViolation(withCurrency("EUR", "100.00"), "SIM.CURRENCY");
        assertViolation(withCurrency("PEN", "60000.00"), "SIM.AMOUNT_CAP");
        assertViolation(withCharges("OUR"), "SIM.CHARGES_SHA");
        assertViolation(withRegulatoryReporting("ORDEN BCRP"), "SIM.NO_REGULATORY");
        assertViolation(withBeneficiaryOption("A"), "SIM.BENE_OPTION");
        assertViolation(withoutExecutionDate(), "SIM.DATE_REQUIRED");

        // Warning (remittance > 70) no bloquea con failOn=ERROR pero se reporta.
        var warned = validate(withRemittance("X".repeat(80)));
        assertTrue(warned.success(), "warning no debe bloquear con failOn=ERROR");
        assertTrue(issuesOf(warned).stream().anyMatch(issue -> "SIM.REMITTANCE_LEN".equals(issue.code())));

        // 4. Gate de fragmentos: VALIDATED/REJECTED individual segun el perfil.
        var fragmentSetId = "HOMOLOGACION-SIM-1";
        fragmentStore.insertFragment(null, fragmentSetId, null, null, "staging_record",
                1, 1, 1, 2, withRawPayload(compliantMessage("P1")));
        fragmentStore.insertFragment(null, fragmentSetId, null, null, "staging_record",
                2, 2, 2, 2, withRawPayload(withCurrencyAndRef("EUR", "100.00", "P2")));

        var fragmentSource = fragmentStore.source(null, fragmentSetId, 2);
        var context = new TaskContext(1L, 1L);
        context.attributes().put("taskOutputs", Map.of("build.fragments", fragmentSource));
        var gateResult = validateProvider.execute(context, Map.of(
                "ruleSet", RULE_SET,
                "input", Map.of("sourceTaskRef", "build", "sourceOutput", "fragments")));

        assertFalse(gateResult.success(), "el set con un fragmento fuera de perfil reporta failure");
        assertEquals(1, gateResult.outputs().get("validCount"));
        assertEquals(1, gateResult.outputs().get("invalidCount"));
        assertEquals("VALIDATED", fragmentStatus(fragmentSetId, "P1"),
                "el fragmento conforme queda elegible para ARCHIVE/PAY");
        assertEquals("REJECTED", fragmentStatus(fragmentSetId, "P2"),
                "el fragmento fuera de perfil queda fuera del gate");
        assertTrue(fragmentError(fragmentSetId, "P2").contains("SIM.CURRENCY"),
                "el motivo del rechazo queda auditado en el fragmento");
    }

    // --- helpers de validacion ---

    private com.integrationhub.platform.spi.task.TaskResult validate(Mt101Message message) {
        var context = new TaskContext(1L, 1L);
        context.attributes().put("taskOutputs", Map.of("build.records", List.of(message)));
        return validateProvider.execute(context, Map.of(
                "ruleSet", RULE_SET,
                "input", Map.of("sourceTaskRef", "build", "sourceOutput", "records")));
    }

    private void assertViolation(Mt101Message message, String expectedCode) {
        var result = validate(message);
        assertFalse(result.success(), () -> expectedCode + " debia bloquear");
        assertTrue(issuesOf(result).stream().anyMatch(issue -> expectedCode.equals(issue.code())),
                () -> "esperaba " + expectedCode + ", issues: " + issuesOf(result));
    }

    @SuppressWarnings("unchecked")
    private List<ValidationIssue> issuesOf(com.integrationhub.platform.spi.task.TaskResult result) {
        return (List<ValidationIssue>) result.outputs().get("errors");
    }

    private String fragmentStatus(String setId, String reference) throws Exception {
        return fragmentColumn(setId, reference, "status");
    }

    private String fragmentError(String setId, String reference) throws Exception {
        var value = fragmentColumn(setId, reference, "error_message");
        return value == null ? "" : value;
    }

    private String fragmentColumn(String setId, String reference, String column) throws Exception {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "select " + column + " from mt101_build_fragment where fragment_set_id = ? and senders_reference = ?")) {
            statement.setString(1, setId);
            statement.setString(2, reference);
            try (var rs = statement.executeQuery()) {
                rs.next();
                return rs.getString(1);
            }
        }
    }

    // --- golden builders (perfil SIM-ESTRICTO: PEN, <=50k, SHA, sin 77B, bene ""/F) ---

    private Mt101Message compliantMessage() {
        return compliantMessage("PROC-1");
    }

    private Mt101Message compliantMessage(String reference) {
        return message(reference, LocalDate.of(2026, 6, 12),
                tx("PEN", "100.00", "SHA", "", null, "FACTURA 458"));
    }

    private Mt101Message withCurrency(String currency, String amount) {
        return withCurrencyAndRef(currency, amount, "PROC-1");
    }

    private Mt101Message withCurrencyAndRef(String currency, String amount, String reference) {
        return message(reference, LocalDate.of(2026, 6, 12),
                tx(currency, amount, "SHA", "", null, "FACTURA 458"));
    }

    private Mt101Message withCharges(String charges) {
        return message("PROC-1", LocalDate.of(2026, 6, 12),
                tx("PEN", "100.00", charges, "", null, "FACTURA 458"));
    }

    private Mt101Message withRegulatoryReporting(String regulatory) {
        return message("PROC-1", LocalDate.of(2026, 6, 12),
                tx("PEN", "100.00", "SHA", "", regulatory, "FACTURA 458"));
    }

    private Mt101Message withBeneficiaryOption(String option) {
        return message("PROC-1", LocalDate.of(2026, 6, 12),
                tx("PEN", "100.00", "SHA", option, null, "FACTURA 458"));
    }

    private Mt101Message withRemittance(String remittance) {
        return message("PROC-1", LocalDate.of(2026, 6, 12),
                tx("PEN", "100.00", "SHA", "", null, remittance));
    }

    private Mt101Message withoutExecutionDate() {
        return message("PROC-1", null,
                tx("PEN", "100.00", "SHA", "", null, "FACTURA 458"));
    }

    private Mt101Message withRawPayload(Mt101Message message) {
        return message.withRawPayload("{\"ref\":\""
                + message.sequenceA().sendersReference() + "\"}", "JSON");
    }

    private Mt101Message message(String reference, LocalDate executionDate, Mt101Message.Transaction tx) {
        return new Mt101Message(
                null,
                new Mt101Message.SequenceA(reference, null, 1, 1, executionDate,
                        null,
                        new Mt101Message.Party("H", "001-123", null, List.of("EMPRESA SAC")),
                        null, null),
                List.of(tx),
                new Mt101Message.ControlTotals(1, Map.of()),
                null, null);
    }

    private Mt101Message.Transaction tx(String currency, String amount, String charges,
                                        String beneficiaryOption, String regulatory, String remittance) {
        return new Mt101Message.Transaction(
                1, "TX-1", null, null,
                new Mt101Message.Amount(currency, new BigDecimal(amount)),
                null, null, null, null,
                new Mt101Message.Party(beneficiaryOption, "0072-987", null, List.of("BENEFICIARIO")),
                remittance, regulatory, null, charges, null, null);
    }
}
