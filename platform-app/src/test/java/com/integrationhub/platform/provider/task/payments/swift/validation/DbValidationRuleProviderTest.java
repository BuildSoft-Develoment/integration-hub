package com.integrationhub.platform.provider.task.payments.swift.validation;

import com.integrationhub.vertical.swift.mt101.provider.validation.DbValidationRuleProvider;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.vertical.swift.mt101.spi.ValidationIssue;
import com.integrationhub.vertical.swift.mt101.spi.ValidationPredicate;
import com.integrationhub.vertical.swift.mt101.spi.Mt101Message;
import com.integrationhub.vertical.swift.mt101.repository.PaymentValidationRuleReader;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.postgresql.ds.PGSimpleDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Valida el perfil sintetico {@code bank:TEST} cubriendo los 8 predicate kinds.
 * Las reglas reales por banco son DATOS del ambiente (guia H2H), nunca del repo.
 *
 * @covers spec 008-mensajeria-pagos RF-011 (perfiles por banco)
 */
@Testcontainers
class DbValidationRuleProviderTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("bank_profile_test")
            .withUsername("postgres")
            .withPassword("postgres");

    private DataSource dataSource;
    private DbValidationRuleProvider provider;

    @BeforeEach
    void setUp() throws Exception {
        dataSource = dataSource();
        provider = new DbValidationRuleProvider(this::loadActiveRules, new ObjectMapper());
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("drop table if exists payment_validation_rule");
            statement.executeUpdate("create table payment_validation_rule ("
                    + "id bigserial primary key,"
                    + "rule_set varchar(50) not null,"
                    + "code varchar(80) not null,"
                    + "standard varchar(20) not null,"
                    + "applies_to varchar(50) not null,"
                    + "severity char(1) not null,"
                    + "predicate_kind varchar(20) not null,"
                    + "predicate_body text not null,"
                    + "active boolean not null default true)");
            seed(statement, "TEST.DATE_REQUIRED", "E", "FIELD_REQUIRED",
                    "{\"path\": \"sequenceA.requestedExecutionDate\"}");
            seed(statement, "TEST.NO_REGULATORY", "E", "FIELD_FORBIDDEN",
                    "{\"path\": \"transactions[].regulatoryReporting\"}");
            seed(statement, "TEST.BENE_OPTION", "E", "OPTION_ALLOWED",
                    "{\"path\": \"transactions[].beneficiary.option\", \"allowed\": [\"\", \"F\"]}");
            seed(statement, "TEST.REMITTANCE_LEN", "W", "MAX_LENGTH",
                    "{\"path\": \"transactions[].remittanceInformation\", \"max\": 20}");
            seed(statement, "TEST.CURRENCY", "E", "CURRENCY_ALLOWED",
                    "{\"allowed\": [\"PEN\", \"USD\"]}");
            seed(statement, "TEST.AMOUNT_CAP", "E", "AMOUNT_MAX",
                    "{\"max\": \"1000.00\", \"currency\": \"PEN\"}");
            seed(statement, "TEST.CHARGES", "E", "CHARGES_ALLOWED",
                    "{\"allowed\": [\"SHA\"]}");
            // Nota: el modelo son records Java — los accessors van con parentesis
            // (message.transactions(), no message.transactions).
            seed(statement, "TEST.MAX_TXS", "E", "JEXL",
                    "{\"expression\": \"message.transactions().size() <= 2\"}");
            // Regla inactiva y regla de otro set: no deben cargarse para bank:TEST.
            statement.executeUpdate("insert into payment_validation_rule "
                    + "(rule_set, code, standard, applies_to, severity, predicate_kind, predicate_body, active) values "
                    + "('bank:TEST', 'TEST.DISABLED', 'SWIFT', 'MT101', 'E', 'CURRENCY_ALLOWED', '{\"allowed\":[\"EUR\"]}', false)");
            statement.executeUpdate("insert into payment_validation_rule "
                    + "(rule_set, code, standard, applies_to, severity, predicate_kind, predicate_body, active) values "
                    + "('bank:OTHER', 'OTHER.RULE', 'SWIFT', 'MT101', 'E', 'CURRENCY_ALLOWED', '{\"allowed\":[\"GBP\"]}', true)");
        }
    }

    @Test
    void loadsOnlyActiveRulesOfRequestedRuleSet() {
        var rules = provider.findRules("bank:TEST", "SWIFT", "MT101");
        assertEquals(8, rules.size());
        assertTrue(rules.stream().noneMatch(rule -> "TEST.DISABLED".equals(rule.code())));
        assertTrue(rules.stream().noneMatch(rule -> "OTHER.RULE".equals(rule.code())));
        assertTrue(rules.stream().allMatch(rule -> "bank:TEST".equals(rule.ruleSet())));
    }

    @Test
    void compliantMessagePassesAllProfileRules() {
        var issues = evaluateAll(compliantMessage());
        assertTrue(issues.isEmpty(), () -> "expected no issues, got: " + issues);
    }

    @Test
    void fieldForbiddenFlagsRegulatoryReporting() {
        var message = withTransaction(tx -> tx(
                tx.transactionReference(), tx.amount(), tx.beneficiary(),
                "REGULATORY DATA", tx.remittanceInformation(), tx.detailsOfCharges()));
        var issues = evaluateAll(message);
        assertTrue(issues.stream().anyMatch(issue -> "TEST.NO_REGULATORY".equals(issue.code())),
                () -> "issues: " + issues);
        assertEquals("TX-1", issues.get(0).transactionReference(),
                "el issue debe apuntar a la transaccion afectada");
    }

    @Test
    void optionAllowedFlagsUnsupportedBeneficiaryOption() {
        var message = withTransaction(tx -> tx(
                tx.transactionReference(), tx.amount(),
                new Mt101Message.Party("A", null, "BCPLPEPL", List.of()),
                null, tx.remittanceInformation(), tx.detailsOfCharges()));
        var issues = evaluateAll(message);
        assertTrue(issues.stream().anyMatch(issue -> "TEST.BENE_OPTION".equals(issue.code())),
                () -> "issues: " + issues);
    }

    @Test
    void maxLengthFlagsLongRemittanceAsWarning() {
        var message = withTransaction(tx -> tx(
                tx.transactionReference(), tx.amount(), tx.beneficiary(),
                null, "REMITTANCE MUCH LONGER THAN TWENTY CHARS", tx.detailsOfCharges()));
        var issues = evaluateAll(message);
        var issue = issues.stream().filter(i -> "TEST.REMITTANCE_LEN".equals(i.code())).findFirst().orElseThrow();
        assertEquals(ValidationIssue.Severity.WARNING, issue.severity(), "severity char W debe mapear a WARNING");
    }

    @Test
    void currencyAndAmountCapAndChargesFlagViolations() {
        var message = withTransaction(tx -> tx(
                tx.transactionReference(),
                new Mt101Message.Amount("EUR", new BigDecimal("99.00")),
                tx.beneficiary(), null, tx.remittanceInformation(), "OUR"));
        var issues = evaluateAll(message);
        assertTrue(issues.stream().anyMatch(issue -> "TEST.CURRENCY".equals(issue.code())));
        assertTrue(issues.stream().anyMatch(issue -> "TEST.CHARGES".equals(issue.code())));

        var overCap = withTransaction(tx -> tx(
                tx.transactionReference(),
                new Mt101Message.Amount("PEN", new BigDecimal("1500.00")),
                tx.beneficiary(), null, tx.remittanceInformation(), tx.detailsOfCharges()));
        var capIssues = evaluateAll(overCap);
        assertTrue(capIssues.stream().anyMatch(issue -> "TEST.AMOUNT_CAP".equals(issue.code())),
                () -> "issues: " + capIssues);
    }

    @Test
    void amountCapIgnoresOtherCurrencies() {
        // Cap es solo PEN: 1500 USD no debe disparar TEST.AMOUNT_CAP (si dispara CURRENCY? no, USD permitido).
        var message = withTransaction(tx -> tx(
                tx.transactionReference(),
                new Mt101Message.Amount("USD", new BigDecimal("1500.00")),
                tx.beneficiary(), null, tx.remittanceInformation(), tx.detailsOfCharges()));
        var issues = evaluateAll(message);
        assertTrue(issues.stream().noneMatch(issue -> "TEST.AMOUNT_CAP".equals(issue.code())),
                () -> "issues: " + issues);
    }

    @Test
    void jexlInvariantFlagsTooManyTransactions() {
        var base = compliantMessage();
        var tx = base.transactions().get(0);
        var threeTxs = new Mt101Message(base.envelope(), base.sequenceA(),
                List.of(tx, tx, tx), base.controlTotals(), null, null);
        var issues = evaluateAll(threeTxs);
        assertTrue(issues.stream().anyMatch(issue -> "TEST.MAX_TXS".equals(issue.code())),
                () -> "issues: " + issues);
    }

    @Test
    void fieldRequiredFlagsMissingExecutionDate() {
        var base = compliantMessage();
        var withoutDate = new Mt101Message(base.envelope(),
                new Mt101Message.SequenceA("PROC-1", null, 1, 1, null,
                        null, base.sequenceA().orderingCustomer(), null, null),
                base.transactions(), base.controlTotals(), null, null);
        var issues = evaluateAll(withoutDate);
        assertTrue(issues.stream().anyMatch(issue -> "TEST.DATE_REQUIRED".equals(issue.code())),
                () -> "issues: " + issues);
    }

    // --- helpers ---

    private List<ValidationIssue> evaluateAll(Mt101Message message) {
        var issues = new java.util.ArrayList<ValidationIssue>();
        for (ValidationPredicate rule : provider.findRules("bank:TEST", "SWIFT", "MT101")) {
            issues.addAll(rule.evaluate(message));
        }
        return issues;
    }

    private Mt101Message compliantMessage() {
        return new Mt101Message(
                null,
                new Mt101Message.SequenceA("PROC-1", null, 1, 1, LocalDate.of(2026, 6, 11),
                        null,
                        new Mt101Message.Party("H", "001", null, List.of("ACME")),
                        null, null),
                List.of(tx("TX-1",
                        new Mt101Message.Amount("PEN", new BigDecimal("100.00")),
                        new Mt101Message.Party("", "0072-1", null, List.of("BENE")),
                        null, "FACTURA 458", "SHA")),
                new Mt101Message.ControlTotals(1, Map.of("PEN", new BigDecimal("100.00"))),
                null, null);
    }

    private Mt101Message withTransaction(java.util.function.UnaryOperator<Mt101Message.Transaction> mutator) {
        var base = compliantMessage();
        var mutated = mutator.apply(base.transactions().get(0));
        return new Mt101Message(base.envelope(), base.sequenceA(), List.of(mutated),
                base.controlTotals(), null, null);
    }

    private Mt101Message.Transaction tx(String reference,
                                        Mt101Message.Amount amount,
                                        Mt101Message.Party beneficiary,
                                        String regulatoryReporting,
                                        String remittance,
                                        String charges) {
        return new Mt101Message.Transaction(
                1, reference, null, null, amount,
                null, null, null, null, beneficiary,
                remittance, regulatoryReporting, null, charges, null, null);
    }

    private void seed(Statement statement, String code, String severity, String kind, String body) throws Exception {
        statement.executeUpdate("insert into payment_validation_rule "
                + "(rule_set, code, standard, applies_to, severity, predicate_kind, predicate_body, active) values "
                + "('bank:TEST', '" + code + "', 'SWIFT', 'MT101', '" + severity + "', '" + kind + "', '"
                + body.replace("'", "''") + "', true)");
    }

    private List<PaymentValidationRuleReader.RuleRow> loadActiveRules(String ruleSet,
                                                                      String standard,
                                                                      String appliesTo) {
        var rules = new ArrayList<PaymentValidationRuleReader.RuleRow>();
        var sql = "select rule_set, code, standard, applies_to, severity, predicate_kind, predicate_body "
                + "from payment_validation_rule where active = true"
                + (isWildcard(ruleSet) ? "" : " and lower(rule_set) = lower(?)")
                + (isWildcard(standard) ? "" : " and lower(standard) = lower(?)")
                + (isWildcard(appliesTo) ? "" : " and lower(applies_to) = lower(?)")
                + " order by rule_set, code";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            var parameter = 1;
            if (!isWildcard(ruleSet)) {
                statement.setString(parameter++, ruleSet);
            }
            if (!isWildcard(standard)) {
                statement.setString(parameter++, standard);
            }
            if (!isWildcard(appliesTo)) {
                statement.setString(parameter++, appliesTo);
            }
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    rules.add(new PaymentValidationRuleReader.RuleRow(
                            rs.getString("rule_set"),
                            rs.getString("code"),
                            rs.getString("standard"),
                            rs.getString("applies_to"),
                            rs.getString("severity"),
                            rs.getString("predicate_kind"),
                            rs.getString("predicate_body")));
                }
            }
            return rules;
        } catch (SQLException error) {
            throw new IllegalStateException(error);
        }
    }

    private boolean isWildcard(String requested) {
        return requested == null || requested.isBlank() || "*".equals(requested);
    }

    private DataSource dataSource() {
        var pgDataSource = new PGSimpleDataSource();
        pgDataSource.setURL(POSTGRES.getJdbcUrl());
        pgDataSource.setUser(POSTGRES.getUsername());
        pgDataSource.setPassword(POSTGRES.getPassword());
        return pgDataSource;
    }
}
