package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.platform.provider.task.payments.swift.model.Mt101Message;
import com.integrationhub.platform.spi.task.TaskContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 008-mensajeria-pagos RF-010, T-024
 */
class Mt101RepairTaskProviderTest {

    private Mt101RepairTaskProvider provider;

    @BeforeEach
    void setUp() {
        provider = new Mt101RepairTaskProvider();
    }

    @Test
    void stripsNonSwiftXCharsFromRemittanceInformation() {
        var message = messageWithRemittance("Pago a JOSE-Ñ con tildes á é í");
        var context = contextWith(List.of(message));

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records"),
                "repairs", List.of(Map.of(
                        "action", "stripNonSwiftXChars",
                        "targetFields", List.of("transactions.remittanceInformation")))));

        assertTrue(result.success());
        assertTrue((int) result.outputs().get("totalChanges") >= 1);

        @SuppressWarnings("unchecked")
        var repaired = (List<Mt101Message>) result.outputs().get("records");
        var newRemittance = repaired.get(0).transactions().get(0).remittanceInformation();
        // Sin Ñ, ñ, á, é, í.
        assertFalse(newRemittance.contains("Ñ"));
        assertFalse(newRemittance.contains("á"));
        // Si conserva ASCII basico.
        assertTrue(newRemittance.contains("Pago a JOSE"));
    }

    @Test
    void truncatesFieldToConfiguredLength() {
        var longText = "AB".repeat(50); // 100 chars
        var message = messageWithRemittance(longText);
        var context = contextWith(List.of(message));

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records"),
                "repairs", List.of(Map.of(
                        "action", "truncateField",
                        "targetFields", List.of("transactions.remittanceInformation"),
                        "maxLength", 35))));

        @SuppressWarnings("unchecked")
        var repaired = (List<Mt101Message>) result.outputs().get("records");
        assertEquals(35, repaired.get(0).transactions().get(0).remittanceInformation().length());
    }

    @Test
    void uppercasesBicField() {
        var message = messageWithBic("bcplpepl");
        var context = contextWith(List.of(message));

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records"),
                "repairs", List.of(Map.of(
                        "action", "uppercaseField",
                        "targetFields", List.of("transactions.beneficiary.bic")))));

        @SuppressWarnings("unchecked")
        var repaired = (List<Mt101Message>) result.outputs().get("records");
        assertEquals("BCPLPEPL", repaired.get(0).transactions().get(0).beneficiary().bic());
    }

    @Test
    void appliesMultipleRepairsInOrder() {
        var message = messageWithRemittance("texto con Ñ que ademas es muy muy muy muy muy muy muy largo");
        var context = contextWith(List.of(message));

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records"),
                "repairs", List.of(
                        Map.of("action", "stripNonSwiftXChars",
                                "targetFields", List.of("transactions.remittanceInformation")),
                        Map.of("action", "truncateField",
                                "targetFields", List.of("transactions.remittanceInformation"),
                                "maxLength", 20))));

        @SuppressWarnings("unchecked")
        var repaired = (List<Mt101Message>) result.outputs().get("records");
        var finalText = repaired.get(0).transactions().get(0).remittanceInformation();
        assertFalse(finalText.contains("Ñ"));
        assertEquals(20, finalText.length());
    }

    @Test
    void rewritesSendersReferenceWithTemplate() {
        var message = messageWithRemittance("clean");
        var context = contextWith(List.of(message));

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records"),
                "repairs", List.of(Map.of(
                        "action", "stripNonSwiftXChars",
                        "targetFields", List.of("transactions.remittanceInformation"))),
                "newReferenceTemplate", "${sendersReference}-R${repairAttempt}",
                "repairAttempt", 2));

        @SuppressWarnings("unchecked")
        var repaired = (List<Mt101Message>) result.outputs().get("records");
        var newReference = repaired.get(0).sequenceA().sendersReference();
        assertTrue(newReference.startsWith("PROC-1-R2") || newReference.contains("-R2"),
                "expected -R2 suffix, got: " + newReference);
        assertNotEquals("PROC-1", newReference);
        assertTrue(newReference.length() <= 16);
    }

    @Test
    void preservesOriginalReferenceWhenNoTemplate() {
        var message = messageWithRemittance("clean");
        var context = contextWith(List.of(message));

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records"),
                "repairs", List.of(Map.of(
                        "action", "uppercaseField",
                        "targetFields", List.of("transactions.beneficiary.bic")))));

        @SuppressWarnings("unchecked")
        var repaired = (List<Mt101Message>) result.outputs().get("records");
        assertEquals("PROC-1", repaired.get(0).sequenceA().sendersReference());
    }

    @Test
    void rejectsUnsupportedAction() {
        var message = messageWithRemittance("x");
        var context = contextWith(List.of(message));
        var error = assertThrows(IllegalArgumentException.class, () -> provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records"),
                "repairs", List.of(Map.of(
                        "action", "magic",
                        "targetFields", List.of("transactions.remittanceInformation"))))));
        assertTrue(error.getMessage().contains("Unsupported"));
    }

    @Test
    void rejectsRepairWithoutTargetFields() {
        var message = messageWithRemittance("x");
        var context = contextWith(List.of(message));
        var error = assertThrows(IllegalArgumentException.class, () -> provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records"),
                "repairs", List.of(Map.of(
                        "action", "uppercaseField",
                        "targetFields", List.of())))));
        assertTrue(error.getMessage().contains("targetFields"));
    }

    @Test
    void rejectsConfigurationWithoutRepairs() {
        var message = messageWithRemittance("x");
        var context = contextWith(List.of(message));
        var error = assertThrows(IllegalArgumentException.class, () -> provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records"))));
        assertTrue(error.getMessage().contains("repairs"));
    }

    @Test
    void skipsWhenNoMessages() {
        var context = new TaskContext(1L, 1L);
        context.attributes().put("taskOutputs", Map.of());
        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "x", "sourceOutput", "records"),
                "repairs", List.of(Map.of(
                        "action", "uppercaseField",
                        "targetFields", List.of("transactions.beneficiary.bic")))));
        assertTrue(result.success());
        assertTrue(result.details().toLowerCase().contains("skipped"));
    }

    @Test
    void totalChangesCountsFieldsActuallyModified() {
        // 3 records: solo 1 con texto sucio. totalChanges debe ser 1.
        var clean = messageWithRemittance("CLEAN");
        var dirty = messageWithRemittance("DIRTY Ñ");
        var alsoClean = messageWithRemittance("OK");
        var context = contextWith(List.of(clean, dirty, alsoClean));

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records"),
                "repairs", List.of(Map.of(
                        "action", "stripNonSwiftXChars",
                        "targetFields", List.of("transactions.remittanceInformation")))));

        assertEquals(3, result.outputs().get("inputMessageCount"));
        assertEquals(1, result.outputs().get("totalChanges"));
    }

    // --- helpers ---

    private TaskContext contextWith(List<Mt101Message> messages) {
        var context = new TaskContext(1L, 1L);
        context.attributes().put("taskOutputs", Map.of("build-mt101.records", messages));
        return context;
    }

    private Mt101Message messageWithRemittance(String remittance) {
        return new Mt101Message(
                new Mt101Message.Envelope("SGOBFRPPAXXX", "BCPLPEPLXXXX", "u1", "N"),
                new Mt101Message.SequenceA("PROC-1", null, 1, 1, LocalDate.of(2026, 6, 9),
                        null,
                        new Mt101Message.Party("H", "001", null, List.of("ACME SAC")),
                        null, null),
                List.of(new Mt101Message.Transaction(
                        1, "TX-1", null, null,
                        new Mt101Message.Amount("PEN", new BigDecimal("100.00")),
                        null, null, null, null,
                        new Mt101Message.Party("", "0072-1", null, List.of("BENE")),
                        remittance, null, null, "OUR", null, null)),
                new Mt101Message.ControlTotals(1, Map.of("PEN", new BigDecimal("100.00"))),
                null, null);
    }

    private Mt101Message messageWithBic(String bic) {
        return new Mt101Message(
                new Mt101Message.Envelope("SGOBFRPPAXXX", "BCPLPEPLXXXX", "u1", "N"),
                new Mt101Message.SequenceA("PROC-1", null, 1, 1, LocalDate.of(2026, 6, 9),
                        null,
                        new Mt101Message.Party("H", "001", null, List.of("ACME SAC")),
                        null, null),
                List.of(new Mt101Message.Transaction(
                        1, "TX-1", null, null,
                        new Mt101Message.Amount("PEN", new BigDecimal("100.00")),
                        null, null, null, null,
                        new Mt101Message.Party("", "0072-1", bic, List.of("BENE")),
                        "concept", null, null, "OUR", null, null)),
                new Mt101Message.ControlTotals(1, Map.of("PEN", new BigDecimal("100.00"))),
                null, null);
    }
}
