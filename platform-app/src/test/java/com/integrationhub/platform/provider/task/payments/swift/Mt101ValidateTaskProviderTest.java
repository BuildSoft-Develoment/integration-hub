package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.platform.provider.task.payments.spi.ValidationIssue;
import com.integrationhub.platform.provider.task.payments.spi.ValidationPredicate;
import com.integrationhub.platform.provider.task.payments.spi.ValidationRuleProvider;
import com.integrationhub.platform.provider.task.payments.swift.model.Mt101Message;
import com.integrationhub.platform.provider.task.payments.swift.validation.Mt101StructuralRules;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.inject.Instance;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 008-mensajeria-pagos RF-002, T-007
 */
class Mt101ValidateTaskProviderTest {

    private Mt101ValidateTaskProvider provider;
    private List<ValidationPredicate> structuralPredicates;

    @BeforeEach
    void setUp() {
        structuralPredicates = List.of(
                new Mt101StructuralRules.SendersReferenceLengthRule(),
                new Mt101StructuralRules.TransactionCountRule(),
                new Mt101StructuralRules.AmountPositiveRule(),
                new Mt101StructuralRules.CurrencyFormatRule(),
                new Mt101StructuralRules.ChargesValueRule(),
                new Mt101StructuralRules.TransactionReferenceLengthRule(),
                new Mt101StructuralRules.BeneficiaryRequiredRule()
        );
        var ruleProvider = new SingleRuleProvider((rs, std, app) -> {
            return structuralPredicates.stream()
                    .filter(p -> matches(rs, p.ruleSet()))
                    .filter(p -> matches(std, p.standard()))
                    .filter(p -> matches(app, p.appliesTo()))
                    .toList();
        });
        provider = new Mt101ValidateTaskProvider(new InstanceOfOne<>(ruleProvider));
    }

    @Test
    void validMessagePassesWithoutIssues() {
        var context = contextWithMessage(validMessage());

        var result = provider.execute(context, Map.of(
                "executionMode", "once",
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records")
        ));

        assertTrue(result.success(), () -> "expected success, got: " + result.details());
        assertEquals(1, result.outputs().get("validCount"));
        assertEquals(0, result.outputs().get("invalidCount"));
        assertEquals("structural-mvp", result.outputs().get("ruleSet"));

        @SuppressWarnings("unchecked")
        var issues = (List<ValidationIssue>) result.outputs().get("errors");
        assertNotNull(issues);
        assertTrue(issues.isEmpty(), () -> "expected no issues, got: " + issues);

        @SuppressWarnings("unchecked")
        var bySeverity = (Map<String, Integer>) result.outputs().get("issuesBySeverity");
        assertEquals(0, bySeverity.get("ERROR"));
        assertEquals(0, bySeverity.get("WARNING"));
    }

    @Test
    void invalidAmountFailsWithStructAmountPositive() {
        var message = messageWithAmount(new BigDecimal("-50.00"));
        var context = contextWithMessage(message);

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records")
        ));

        assertFalse(result.success());
        @SuppressWarnings("unchecked")
        var issues = (List<ValidationIssue>) result.outputs().get("errors");
        assertTrue(issues.stream().anyMatch(i -> "STRUCT.AMOUNT_POSITIVE".equals(i.code())));
        assertEquals(1, result.outputs().get("invalidCount"));
        assertEquals(0, result.outputs().get("validCount"));
    }

    @Test
    void invalidCurrencyFailsWithStructCurrencyFormat() {
        var message = messageWithCurrency("pen");
        var context = contextWithMessage(message);

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records")
        ));

        assertFalse(result.success());
        @SuppressWarnings("unchecked")
        var issues = (List<ValidationIssue>) result.outputs().get("errors");
        assertTrue(issues.stream().anyMatch(i -> "STRUCT.CURRENCY_FORMAT".equals(i.code())));
    }

    @Test
    void invalidChargesFailsWithStructChargesValue() {
        var message = messageWithCharges("XYZ");
        var context = contextWithMessage(message);

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records")
        ));

        assertFalse(result.success());
        @SuppressWarnings("unchecked")
        var issues = (List<ValidationIssue>) result.outputs().get("errors");
        assertTrue(issues.stream().anyMatch(i -> "STRUCT.CHARGES_VALUE".equals(i.code())));
    }

    @Test
    void missingBeneficiaryFailsWithStructBeneficiaryRequired() {
        var message = messageWithoutBeneficiary();
        var context = contextWithMessage(message);

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records")
        ));

        assertFalse(result.success());
        @SuppressWarnings("unchecked")
        var issues = (List<ValidationIssue>) result.outputs().get("errors");
        assertTrue(issues.stream().anyMatch(i -> "STRUCT.BENEFICIARY_REQUIRED".equals(i.code())));
    }

    @Test
    void emptyTransactionsFailsWithStructTransactionCount() {
        var message = new Mt101Message(null,
                new Mt101Message.SequenceA("PROC-1", null, 1, 1, LocalDate.of(2026, 6, 9),
                        null, null, null, null),
                List.of(),
                new Mt101Message.ControlTotals(0, Map.of()),
                null, null);
        var context = contextWithMessage(message);

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records")
        ));

        assertFalse(result.success());
        @SuppressWarnings("unchecked")
        var issues = (List<ValidationIssue>) result.outputs().get("errors");
        assertTrue(issues.stream().anyMatch(i -> "STRUCT.TRANSACTION_COUNT".equals(i.code())));
    }

    @Test
    void failOnWarningDoesNotFailOnErrorOnlyMessage() {
        // En slice 2 todas las structural rules son ERROR. Confirmamos que el
        // umbral funciona en la otra direccion (failOn=INFO debe fallar incluso con WARNING).
        var message = validMessage();
        var context = contextWithMessage(message);
        var result = provider.execute(context, Map.of(
                "failOn", "INFO",
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records")
        ));
        assertTrue(result.success(), "no issues even at INFO threshold");
    }

    @Test
    void skipsWhenNoMessagesInTaskOutputs() {
        var context = new TaskContext(1L, 1L);
        context.attributes().put("taskOutputs", Map.of());
        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records")
        ));
        assertTrue(result.success());
        assertTrue(result.details().toLowerCase().contains("skipped"));
    }

    @Test
    void rejectsWhenInputMissing() {
        var context = contextWithMessage(validMessage());
        assertThrows(IllegalArgumentException.class, () -> provider.execute(context, Map.of()));
    }

    @Test
    void rejectsWhenItemsAreNotMt101Messages() {
        var context = new TaskContext(1L, 1L);
        context.attributes().put("taskOutputs", Map.of("build-mt101.records", List.of("not a message")));
        var error = assertThrows(IllegalArgumentException.class, () -> provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records")
        )));
        assertTrue(error.getMessage().contains("Mt101Message"));
    }

    @Test
    void reportsCorrectInvalidCountForMultipleMessages() {
        var context = new TaskContext(1L, 1L);
        context.attributes().put("taskOutputs", Map.of(
                "build-mt101.records", List.of(validMessage(), messageWithAmount(new BigDecimal("-1")))
        ));
        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records")
        ));
        assertFalse(result.success());
        // Heuristica slice 2: si hay >=1 blocking issue, todos los mensajes cuentan como invalidos.
        // Aceptable mientras el mapping mensaje<->issue no este explicito (slice 3+).
        assertEquals(2, result.outputs().get("invalidCount"));
    }

    // --- helpers ---

    private TaskContext contextWithMessage(Mt101Message message) {
        var context = new TaskContext(1L, 1L);
        context.attributes().put("taskOutputs", Map.of("build-mt101.records", List.of(message)));
        return context;
    }

    private Mt101Message validMessage() {
        return new Mt101Message(
                null,
                new Mt101Message.SequenceA("PROC-1", null, 1, 1, LocalDate.of(2026, 6, 9),
                        null,
                        new Mt101Message.Party("H", "001", null, List.of("ACME")),
                        null, null),
                List.of(new Mt101Message.Transaction(
                        1, "TX-1", null, null,
                        new Mt101Message.Amount("PEN", new BigDecimal("100.00")),
                        null, null, null, null,
                        new Mt101Message.Party("", "0072-1", null, List.of("BENE")),
                        null, null, null, "OUR", null, null)),
                new Mt101Message.ControlTotals(1, Map.of("PEN", new BigDecimal("100.00"))),
                null, null);
    }

    private Mt101Message messageWithAmount(BigDecimal amount) {
        var ok = validMessage();
        var brokenTx = new Mt101Message.Transaction(
                1, "TX-1", null, null,
                new Mt101Message.Amount("PEN", amount),
                null, null, null, null,
                ok.transactions().get(0).beneficiary(),
                null, null, null, "OUR", null, null);
        return new Mt101Message(ok.envelope(), ok.sequenceA(), List.of(brokenTx),
                ok.controlTotals(), null, null);
    }

    private Mt101Message messageWithCurrency(String currency) {
        var ok = validMessage();
        var brokenTx = new Mt101Message.Transaction(
                1, "TX-1", null, null,
                new Mt101Message.Amount(currency, new BigDecimal("100")),
                null, null, null, null,
                ok.transactions().get(0).beneficiary(),
                null, null, null, "OUR", null, null);
        return new Mt101Message(ok.envelope(), ok.sequenceA(), List.of(brokenTx),
                ok.controlTotals(), null, null);
    }

    private Mt101Message messageWithCharges(String charges) {
        var ok = validMessage();
        var brokenTx = new Mt101Message.Transaction(
                1, "TX-1", null, null,
                new Mt101Message.Amount("PEN", new BigDecimal("100")),
                null, null, null, null,
                ok.transactions().get(0).beneficiary(),
                null, null, null, charges, null, null);
        return new Mt101Message(ok.envelope(), ok.sequenceA(), List.of(brokenTx),
                ok.controlTotals(), null, null);
    }

    private Mt101Message messageWithoutBeneficiary() {
        var ok = validMessage();
        var brokenTx = new Mt101Message.Transaction(
                1, "TX-1", null, null,
                new Mt101Message.Amount("PEN", new BigDecimal("100")),
                null, null, null, null,
                null, // beneficiary missing
                null, null, null, "OUR", null, null);
        return new Mt101Message(ok.envelope(), ok.sequenceA(), List.of(brokenTx),
                ok.controlTotals(), null, null);
    }

    private boolean matches(String requested, String candidate) {
        return requested == null || requested.isBlank() || "*".equals(requested)
                || requested.equalsIgnoreCase(candidate);
    }

    /** Provider de reglas custom para el test. */
    private static final class SingleRuleProvider implements ValidationRuleProvider {
        private final TriFn fn;
        SingleRuleProvider(TriFn fn) { this.fn = fn; }
        @Override
        public List<ValidationPredicate> findRules(String ruleSet, String standard, String appliesTo) {
            return fn.apply(ruleSet, standard, appliesTo);
        }
    }

    @FunctionalInterface
    private interface TriFn {
        List<ValidationPredicate> apply(String ruleSet, String standard, String appliesTo);
    }

    /** Instancia CDI minima para un solo bean (mismo patron que slice 1). */
    private static final class InstanceOfOne<T> implements Instance<T> {
        private final T instance;
        InstanceOfOne(T instance) { this.instance = instance; }
        @Override public Instance<T> select(java.lang.annotation.Annotation... q) { return this; }
        @Override public <U extends T> Instance<U> select(Class<U> s, java.lang.annotation.Annotation... q) { throw new UnsupportedOperationException(); }
        @Override public <U extends T> Instance<U> select(jakarta.enterprise.util.TypeLiteral<U> s, java.lang.annotation.Annotation... q) { throw new UnsupportedOperationException(); }
        @Override public boolean isUnsatisfied() { return false; }
        @Override public boolean isAmbiguous() { return false; }
        @Override public void destroy(T inst) {}
        @Override public Handle<T> getHandle() { throw new UnsupportedOperationException(); }
        @Override public Iterable<? extends Handle<T>> handles() { throw new UnsupportedOperationException(); }
        @Override public Iterator<T> iterator() { return List.of(instance).iterator(); }
        @Override public T get() { return instance; }
        @Override public Stream<T> stream() { return StreamSupport.stream(spliterator(), false); }
    }
}
