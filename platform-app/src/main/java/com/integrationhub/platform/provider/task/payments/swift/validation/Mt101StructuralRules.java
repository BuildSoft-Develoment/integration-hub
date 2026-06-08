package com.integrationhub.platform.provider.task.payments.swift.validation;

import com.integrationhub.platform.provider.task.payments.spi.ValidationIssue;
import com.integrationhub.platform.provider.task.payments.spi.ValidationPredicate;
import com.integrationhub.platform.provider.task.payments.swift.model.Mt101Message;
import jakarta.enterprise.context.ApplicationScoped;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Reglas estructurales propias de la plataforma para MT101.
 *
 * <p><b>No son NVR oficiales de SWIFT</b>. Son validaciones genericas
 * propietarias que cualquier mensaje de pagos respeta (largo de referencias, monto
 * positivo, formato de moneda, valores de cargos, presencia de beneficiario, etc.).
 * Esto cumple ADR-009: el codigo del repo no enumera NVR licenciadas; aquellas se
 * cargan desde un {@code ValidationRuleProvider} alternativo con licencia.</p>
 *
 * <p>Set: {@code structural-mvp}. Codigos con prefijo {@code STRUCT.}.</p>
 *
 * @trace spec 008-mensajeria-pagos RF-002, T-007
 * @trace ADR-009
 */
public final class Mt101StructuralRules {

    public static final String RULE_SET = "structural-mvp";
    public static final String STANDARD = "SWIFT";
    public static final String APPLIES_TO = "MT101";

    private static final int MAX_REFERENCE_LENGTH = 16;
    private static final Pattern CURRENCY_PATTERN = Pattern.compile("^[A-Z]{3}$");
    private static final Set<String> VALID_CHARGES = Set.of("OUR", "BEN", "SHA");

    private Mt101StructuralRules() {
        // Holder de reglas; no instanciable.
    }

    /** Base con metadata comun para las reglas estructurales. */
    static abstract class StructuralPredicate implements ValidationPredicate {

        private final String code;
        private final ValidationIssue.Severity severity;

        StructuralPredicate(String code, ValidationIssue.Severity severity) {
            this.code = code;
            this.severity = severity;
        }

        @Override
        public final String code() {
            return code;
        }

        @Override
        public final String standard() {
            return STANDARD;
        }

        @Override
        public final String appliesTo() {
            return APPLIES_TO;
        }

        @Override
        public final ValidationIssue.Severity severity() {
            return severity;
        }

        @Override
        public final String ruleSet() {
            return RULE_SET;
        }
    }

    /** {@code STRUCT.SENDERS_REF_LENGTH}: senders_reference debe tener 1..16 chars. */
    @ApplicationScoped
    public static class SendersReferenceLengthRule extends StructuralPredicate {
        public SendersReferenceLengthRule() {
            super("STRUCT.SENDERS_REF_LENGTH", ValidationIssue.Severity.ERROR);
        }

        @Override
        public List<ValidationIssue> evaluate(Mt101Message message) {
            if (message == null || message.sequenceA() == null) {
                return List.of();
            }
            var ref = message.sequenceA().sendersReference();
            if (ref == null || ref.isBlank()) {
                return List.of(ValidationIssue.messageLevel(code(), ruleSet(), severity(),
                        "sendersReference is required"));
            }
            if (ref.length() > MAX_REFERENCE_LENGTH) {
                return List.of(ValidationIssue.messageLevel(code(), ruleSet(), severity(),
                        "sendersReference exceeds 16 characters: " + ref.length()));
            }
            return List.of();
        }
    }

    /** {@code STRUCT.TRANSACTION_COUNT}: el mensaje debe tener al menos 1 transaccion. */
    @ApplicationScoped
    public static class TransactionCountRule extends StructuralPredicate {
        public TransactionCountRule() {
            super("STRUCT.TRANSACTION_COUNT", ValidationIssue.Severity.ERROR);
        }

        @Override
        public List<ValidationIssue> evaluate(Mt101Message message) {
            if (message == null || message.transactions() == null || message.transactions().isEmpty()) {
                return List.of(ValidationIssue.messageLevel(code(), ruleSet(), severity(),
                        "message must contain at least one transaction"));
            }
            return List.of();
        }
    }

    /** {@code STRUCT.AMOUNT_POSITIVE}: el monto de cada transaccion debe ser &gt; 0. */
    @ApplicationScoped
    public static class AmountPositiveRule extends StructuralPredicate {
        public AmountPositiveRule() {
            super("STRUCT.AMOUNT_POSITIVE", ValidationIssue.Severity.ERROR);
        }

        @Override
        public List<ValidationIssue> evaluate(Mt101Message message) {
            if (message == null) {
                return List.of();
            }
            var issues = new ArrayList<ValidationIssue>();
            for (var tx : message.transactions()) {
                if (tx.amount() == null || tx.amount().value() == null
                        || tx.amount().value().compareTo(BigDecimal.ZERO) <= 0) {
                    issues.add(ValidationIssue.transactionLevel(code(), ruleSet(), severity(),
                            tx.transactionReference(),
                            "amount must be greater than zero"));
                }
            }
            return issues;
        }
    }

    /** {@code STRUCT.CURRENCY_FORMAT}: la moneda debe ser 3 letras mayusculas. */
    @ApplicationScoped
    public static class CurrencyFormatRule extends StructuralPredicate {
        public CurrencyFormatRule() {
            super("STRUCT.CURRENCY_FORMAT", ValidationIssue.Severity.ERROR);
        }

        @Override
        public List<ValidationIssue> evaluate(Mt101Message message) {
            if (message == null) {
                return List.of();
            }
            var issues = new ArrayList<ValidationIssue>();
            for (var tx : message.transactions()) {
                if (tx.amount() == null || tx.amount().currency() == null
                        || !CURRENCY_PATTERN.matcher(tx.amount().currency()).matches()) {
                    issues.add(ValidationIssue.transactionLevel(code(), ruleSet(), severity(),
                            tx.transactionReference(),
                            "currency must match ISO 4217 (3 uppercase letters): "
                                    + (tx.amount() == null ? "(null)" : tx.amount().currency())));
                }
            }
            return issues;
        }
    }

    /** {@code STRUCT.CHARGES_VALUE}: detailsOfCharges debe ser OUR/BEN/SHA. */
    @ApplicationScoped
    public static class ChargesValueRule extends StructuralPredicate {
        public ChargesValueRule() {
            super("STRUCT.CHARGES_VALUE", ValidationIssue.Severity.ERROR);
        }

        @Override
        public List<ValidationIssue> evaluate(Mt101Message message) {
            if (message == null) {
                return List.of();
            }
            var issues = new ArrayList<ValidationIssue>();
            for (var tx : message.transactions()) {
                if (tx.detailsOfCharges() == null
                        || !VALID_CHARGES.contains(tx.detailsOfCharges().toUpperCase())) {
                    issues.add(ValidationIssue.transactionLevel(code(), ruleSet(), severity(),
                            tx.transactionReference(),
                            "detailsOfCharges must be OUR/BEN/SHA: " + tx.detailsOfCharges()));
                }
            }
            return issues;
        }
    }

    /** {@code STRUCT.TX_REF_LENGTH}: transactionReference debe tener 1..16 chars. */
    @ApplicationScoped
    public static class TransactionReferenceLengthRule extends StructuralPredicate {
        public TransactionReferenceLengthRule() {
            super("STRUCT.TX_REF_LENGTH", ValidationIssue.Severity.ERROR);
        }

        @Override
        public List<ValidationIssue> evaluate(Mt101Message message) {
            if (message == null) {
                return List.of();
            }
            var issues = new ArrayList<ValidationIssue>();
            for (var tx : message.transactions()) {
                var ref = tx.transactionReference();
                if (ref == null || ref.isBlank()) {
                    issues.add(ValidationIssue.transactionLevel(code(), ruleSet(), severity(),
                            ref, "transactionReference is required"));
                } else if (ref.length() > MAX_REFERENCE_LENGTH) {
                    issues.add(ValidationIssue.transactionLevel(code(), ruleSet(), severity(),
                            ref, "transactionReference exceeds 16 characters: " + ref.length()));
                }
            }
            return issues;
        }
    }

    /** {@code STRUCT.BENEFICIARY_REQUIRED}: cada transaccion debe tener beneficiario. */
    @ApplicationScoped
    public static class BeneficiaryRequiredRule extends StructuralPredicate {
        public BeneficiaryRequiredRule() {
            super("STRUCT.BENEFICIARY_REQUIRED", ValidationIssue.Severity.ERROR);
        }

        @Override
        public List<ValidationIssue> evaluate(Mt101Message message) {
            if (message == null) {
                return List.of();
            }
            var issues = new ArrayList<ValidationIssue>();
            for (var tx : message.transactions()) {
                if (tx.beneficiary() == null
                        || ((tx.beneficiary().account() == null || tx.beneficiary().account().isBlank())
                            && (tx.beneficiary().bic() == null || tx.beneficiary().bic().isBlank()))) {
                    issues.add(ValidationIssue.transactionLevel(code(), ruleSet(), severity(),
                            tx.transactionReference(),
                            "beneficiary requires at least account or BIC"));
                }
            }
            return issues;
        }
    }
}
