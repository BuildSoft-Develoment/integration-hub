package com.integrationhub.vertical.swift.mt101.provider.validation;

import com.integrationhub.vertical.swift.mt101.spi.ValidationRuleProvider;

import com.integrationhub.vertical.swift.mt101.spi.ValidationIssue;
import com.integrationhub.vertical.swift.mt101.spi.ValidationPredicate;
import com.integrationhub.vertical.swift.mt101.spi.Mt101Message;
import jakarta.enterprise.context.ApplicationScoped;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
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
    private static final int MAX_FIN_PAYLOAD_BYTES = 10000;
    private static final int MAX_ACCOUNT_LENGTH = 34;
    private static final int MAX_LINE_LENGTH = 35;
    private static final Pattern CURRENCY_PATTERN = Pattern.compile("^[A-Z]{3}$");
    private static final Pattern BIC_PATTERN = Pattern.compile("^[A-Z0-9]{8}([A-Z0-9]{3})?$");
    private static final Pattern SWIFT_X_TEXT = Pattern.compile("^[A-Za-z0-9 /\\-?:().,'+\\r\\n]*$");
    private static final Pattern DETAILS_OF_CHARGES_PATTERN = Pattern.compile("^[A-Z]{3}$");
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

    /** {@code STRUCT.ORDERING_CUSTOMER_PLACEMENT}: :50a: va en A o en B, nunca en ambos. */
    @ApplicationScoped
    public static class OrderingCustomerPlacementRule extends StructuralPredicate {
        public OrderingCustomerPlacementRule() {
            super("STRUCT.ORDERING_CUSTOMER_PLACEMENT", ValidationIssue.Severity.ERROR);
        }

        @Override
        public List<ValidationIssue> evaluate(Mt101Message message) {
            if (message == null || message.transactions() == null) {
                return List.of();
            }
            var sequenceAHasOrdering = message.sequenceA() != null
                    && hasPartyValue(message.sequenceA().orderingCustomer());
            var transactionsWithOrdering = message.transactions().stream()
                    .filter(tx -> hasPartyValue(tx.orderingCustomer()))
                    .count();
            if (sequenceAHasOrdering && transactionsWithOrdering > 0) {
                return List.of(ValidationIssue.messageLevel(code(), ruleSet(), severity(),
                        "orderingCustomer (:50a:) cannot be present in Sequence A and Sequence B at the same time"));
            }
            if (!sequenceAHasOrdering && transactionsWithOrdering != message.transactions().size()) {
                return List.of(ValidationIssue.messageLevel(code(), ruleSet(), severity(),
                        "orderingCustomer (:50a:) must be present once in Sequence A or in every Sequence B transaction"));
            }
            return List.of();
        }
    }

    /** {@code STRUCT.ACCOUNT_SERVICING_PLACEMENT}: :52a: va en A o B, nunca mezclado parcialmente. */
    @ApplicationScoped
    public static class AccountServicingPlacementRule extends StructuralPredicate {
        public AccountServicingPlacementRule() {
            super("STRUCT.ACCOUNT_SERVICING_PLACEMENT", ValidationIssue.Severity.ERROR);
        }

        @Override
        public List<ValidationIssue> evaluate(Mt101Message message) {
            if (message == null || message.transactions() == null) {
                return List.of();
            }
            var sequenceAHasServicing = message.sequenceA() != null
                    && hasPartyValue(message.sequenceA().accountServicingInstitution());
            var txWithServicing = message.transactions().stream()
                    .filter(tx -> hasPartyValue(tx.accountServicingInstitution()))
                    .count();
            if (sequenceAHasServicing && txWithServicing > 0) {
                return List.of(ValidationIssue.messageLevel(code(), ruleSet(), severity(),
                        "accountServicingInstitution (:52a:) cannot be present in Sequence A and Sequence B at the same time"));
            }
            return List.of();
        }
    }

    /** {@code STRUCT.TX_REF_UNIQUE}: :21: debe ser unico dentro del mensaje. */
    @ApplicationScoped
    public static class TransactionReferenceUniqueRule extends StructuralPredicate {
        public TransactionReferenceUniqueRule() {
            super("STRUCT.TX_REF_UNIQUE", ValidationIssue.Severity.ERROR);
        }

        @Override
        public List<ValidationIssue> evaluate(Mt101Message message) {
            if (message == null || message.transactions() == null) {
                return List.of();
            }
            var seen = new java.util.HashSet<String>();
            var issues = new ArrayList<ValidationIssue>();
            for (var tx : message.transactions()) {
                var ref = tx.transactionReference();
                if (ref != null && !ref.isBlank() && !seen.add(ref)) {
                    issues.add(ValidationIssue.transactionLevel(code(), ruleSet(), severity(),
                            ref, "duplicate transactionReference inside MT101 message: " + ref));
                }
            }
            return issues;
        }
    }

    /** {@code STRUCT.REQUESTED_DATE_REQUIRED}: Sequence A debe declarar :30:. */
    @ApplicationScoped
    public static class RequestedDateRequiredRule extends StructuralPredicate {
        public RequestedDateRequiredRule() {
            super("STRUCT.REQUESTED_DATE_REQUIRED", ValidationIssue.Severity.ERROR);
        }

        @Override
        public List<ValidationIssue> evaluate(Mt101Message message) {
            if (message == null || message.sequenceA() == null
                    || message.sequenceA().requestedExecutionDate() == null) {
                return List.of(ValidationIssue.messageLevel(code(), ruleSet(), severity(),
                        "requestedExecutionDate (:30:) is required"));
            }
            return List.of();
        }
    }

    /** {@code STRUCT.BIC_FORMAT}: BICs declarados deben tener 8 u 11 caracteres alfanumericos. */
    @ApplicationScoped
    public static class BicFormatRule extends StructuralPredicate {
        public BicFormatRule() {
            super("STRUCT.BIC_FORMAT", ValidationIssue.Severity.ERROR);
        }

        @Override
        public List<ValidationIssue> evaluate(Mt101Message message) {
            if (message == null) {
                return List.of();
            }
            var issues = new ArrayList<ValidationIssue>();
            if (message.sequenceA() != null) {
                validateBic(issues, null, "sequenceA.orderingCustomer.bic", message.sequenceA().orderingCustomer());
                validateBic(issues, null, "sequenceA.accountServicingInstitution.bic",
                        message.sequenceA().accountServicingInstitution());
            }
            for (var tx : message.transactions()) {
                validateBic(issues, tx.transactionReference(), "transactions.orderingCustomer.bic", tx.orderingCustomer());
                validateBic(issues, tx.transactionReference(), "transactions.accountServicingInstitution.bic",
                        tx.accountServicingInstitution());
                validateBic(issues, tx.transactionReference(), "transactions.intermediary.bic", tx.intermediary());
                validateBic(issues, tx.transactionReference(), "transactions.accountWithInstitution.bic",
                        tx.accountWithInstitution());
                validateBic(issues, tx.transactionReference(), "transactions.beneficiary.bic", tx.beneficiary());
            }
            return issues;
        }

        private void validateBic(List<ValidationIssue> issues,
                                 String txRef,
                                 String field,
                                 Mt101Message.Party party) {
            if (party == null || party.bic() == null || party.bic().isBlank()) {
                return;
            }
            if (!BIC_PATTERN.matcher(party.bic()).matches()) {
                issues.add(txRef == null
                        ? ValidationIssue.messageLevel(code(), ruleSet(), severity(),
                                field + " must be 8 or 11 uppercase alphanumeric characters: " + party.bic())
                        : ValidationIssue.transactionLevel(code(), ruleSet(), severity(), txRef,
                                field + " must be 8 or 11 uppercase alphanumeric characters: " + party.bic()));
            }
        }
    }

    /** {@code STRUCT.SWIFT_X_TEXT}: textos emitidos en FIN deben usar charset SWIFT-X basico. */
    @ApplicationScoped
    public static class SwiftXTextRule extends StructuralPredicate {
        public SwiftXTextRule() {
            super("STRUCT.SWIFT_X_TEXT", ValidationIssue.Severity.ERROR);
        }

        @Override
        public List<ValidationIssue> evaluate(Mt101Message message) {
            if (message == null) {
                return List.of();
            }
            var issues = new ArrayList<ValidationIssue>();
            if (message.sequenceA() != null) {
                validateParty(issues, null, "sequenceA.instructingParty", message.sequenceA().instructingParty());
                validateParty(issues, null, "sequenceA.orderingCustomer", message.sequenceA().orderingCustomer());
                validateParty(issues, null, "sequenceA.accountServicingInstitution",
                        message.sequenceA().accountServicingInstitution());
            }
            for (var tx : message.transactions()) {
                validateParty(issues, tx.transactionReference(), "transactions.orderingCustomer", tx.orderingCustomer());
                validateParty(issues, tx.transactionReference(), "transactions.beneficiary", tx.beneficiary());
                validateText(issues, tx.transactionReference(), "transactions.remittanceInformation",
                        tx.remittanceInformation());
                validateText(issues, tx.transactionReference(), "transactions.regulatoryReporting",
                        tx.regulatoryReporting());
            }
            return issues;
        }

        private void validateParty(List<ValidationIssue> issues,
                                   String txRef,
                                   String field,
                                   Mt101Message.Party party) {
            if (party == null) {
                return;
            }
            validateText(issues, txRef, field + ".account", party.account());
            validateText(issues, txRef, field + ".bic", party.bic());
            if (party.nameAndAddress() != null) {
                for (var line : party.nameAndAddress()) {
                    validateText(issues, txRef, field + ".nameAndAddress", line);
                }
            }
        }

        private void validateText(List<ValidationIssue> issues, String txRef, String field, String value) {
            if (value == null || SWIFT_X_TEXT.matcher(value).matches()) {
                return;
            }
            var message = field + " contains characters outside the platform SWIFT-X subset";
            issues.add(txRef == null
                    ? ValidationIssue.messageLevel(code(), ruleSet(), severity(), message)
                    : ValidationIssue.transactionLevel(code(), ruleSet(), severity(), txRef, message));
        }
    }

    /** {@code STRUCT.MESSAGE_MAX_LENGTH_10000}: payload FIN no debe exceder 10 KB. */
    @ApplicationScoped
    public static class MessageMaxLengthRule extends StructuralPredicate {
        public MessageMaxLengthRule() {
            super("STRUCT.MESSAGE_MAX_LENGTH_10000", ValidationIssue.Severity.ERROR);
        }

        @Override
        public List<ValidationIssue> evaluate(Mt101Message message) {
            if (message == null || message.rawPayload() == null) {
                return List.of();
            }
            var bytes = message.rawPayload().getBytes(StandardCharsets.UTF_8).length;
            if (bytes > MAX_FIN_PAYLOAD_BYTES) {
                return List.of(ValidationIssue.messageLevel(code(), ruleSet(), severity(),
                        "rawPayload exceeds " + MAX_FIN_PAYLOAD_BYTES + " bytes: " + bytes));
            }
            return List.of();
        }
    }

    /** {@code STRUCT.FIELD_50_52_57_59_LENGTH}: cuentas max 34x y lineas max 35x. */
    @ApplicationScoped
    public static class PartyLengthRule extends StructuralPredicate {
        public PartyLengthRule() {
            super("STRUCT.FIELD_50_52_57_59_LENGTH", ValidationIssue.Severity.ERROR);
        }

        @Override
        public List<ValidationIssue> evaluate(Mt101Message message) {
            if (message == null) {
                return List.of();
            }
            var issues = new ArrayList<ValidationIssue>();
            if (message.sequenceA() != null) {
                validateParty(issues, null, "sequenceA.instructingParty", message.sequenceA().instructingParty());
                validateParty(issues, null, "sequenceA.orderingCustomer", message.sequenceA().orderingCustomer());
                validateParty(issues, null, "sequenceA.accountServicingInstitution",
                        message.sequenceA().accountServicingInstitution());
            }
            for (var tx : message.transactions()) {
                validateParty(issues, tx.transactionReference(), "transactions.orderingCustomer", tx.orderingCustomer());
                validateParty(issues, tx.transactionReference(), "transactions.accountServicingInstitution",
                        tx.accountServicingInstitution());
                validateParty(issues, tx.transactionReference(), "transactions.intermediary", tx.intermediary());
                validateParty(issues, tx.transactionReference(), "transactions.accountWithInstitution",
                        tx.accountWithInstitution());
                validateParty(issues, tx.transactionReference(), "transactions.beneficiary", tx.beneficiary());
            }
            return issues;
        }

        private void validateParty(List<ValidationIssue> issues,
                                   String txRef,
                                   String field,
                                   Mt101Message.Party party) {
            if (party == null) {
                return;
            }
            if (party.account() != null && party.account().length() > MAX_ACCOUNT_LENGTH) {
                add(issues, txRef, field + ".account exceeds 34 characters: " + party.account().length());
            }
            if (party.nameAndAddress() != null) {
                for (var line : party.nameAndAddress()) {
                    if (line != null && line.length() > MAX_LINE_LENGTH) {
                        add(issues, txRef, field + ".nameAndAddress line exceeds 35 characters: " + line.length());
                    }
                }
            }
        }

        private void add(List<ValidationIssue> issues, String txRef, String message) {
            issues.add(txRef == null
                    ? ValidationIssue.messageLevel(code(), ruleSet(), severity(), message)
                    : ValidationIssue.transactionLevel(code(), ruleSet(), severity(), txRef, message));
        }
    }

    /** {@code STRUCT.FIELD_70_4X35}: remittance information max 4 lineas de 35. */
    @ApplicationScoped
    public static class RemittanceInformationLengthRule extends StructuralPredicate {
        public RemittanceInformationLengthRule() {
            super("STRUCT.FIELD_70_4X35", ValidationIssue.Severity.ERROR);
        }

        @Override
        public List<ValidationIssue> evaluate(Mt101Message message) {
            if (message == null) {
                return List.of();
            }
            var issues = new ArrayList<ValidationIssue>();
            for (var tx : message.transactions()) {
                validateMultiline(issues, tx.transactionReference(), tx.remittanceInformation(), 4, ":70:");
            }
            return issues;
        }

        private void validateMultiline(List<ValidationIssue> issues,
                                       String txRef,
                                       String value,
                                       int maxLines,
                                       String tag) {
            if (value == null) {
                return;
            }
            var lines = value.split("\\r?\\n", -1);
            if (lines.length > maxLines) {
                issues.add(ValidationIssue.transactionLevel(code(), ruleSet(), severity(), txRef,
                        tag + " exceeds " + maxLines + " lines"));
            }
            for (var line : lines) {
                if (line.length() > MAX_LINE_LENGTH) {
                    issues.add(ValidationIssue.transactionLevel(code(), ruleSet(), severity(), txRef,
                            tag + " line exceeds 35 characters: " + line.length()));
                }
            }
        }
    }

    /** {@code STRUCT.FIELD_77B_3X35}: regulatory reporting max 3 lineas de 35. */
    @ApplicationScoped
    public static class RegulatoryReportingLengthRule extends StructuralPredicate {
        public RegulatoryReportingLengthRule() {
            super("STRUCT.FIELD_77B_3X35", ValidationIssue.Severity.ERROR);
        }

        @Override
        public List<ValidationIssue> evaluate(Mt101Message message) {
            if (message == null) {
                return List.of();
            }
            var issues = new ArrayList<ValidationIssue>();
            for (var tx : message.transactions()) {
                if (tx.regulatoryReporting() == null) {
                    continue;
                }
                var lines = tx.regulatoryReporting().split("\\r?\\n", -1);
                if (lines.length > 3) {
                    issues.add(ValidationIssue.transactionLevel(code(), ruleSet(), severity(),
                            tx.transactionReference(), ":77B: exceeds 3 lines"));
                }
                for (var line : lines) {
                    if (line.length() > MAX_LINE_LENGTH) {
                        issues.add(ValidationIssue.transactionLevel(code(), ruleSet(), severity(),
                                tx.transactionReference(), ":77B: line exceeds 35 characters: " + line.length()));
                    }
                }
            }
            return issues;
        }
    }

    /** {@code STRUCT.FIELD_32B_FORMAT}: importe :32B: max 15 digitos significativos. */
    @ApplicationScoped
    public static class AmountFormatRule extends StructuralPredicate {
        public AmountFormatRule() {
            super("STRUCT.FIELD_32B_FORMAT", ValidationIssue.Severity.ERROR);
        }

        @Override
        public List<ValidationIssue> evaluate(Mt101Message message) {
            if (message == null) {
                return List.of();
            }
            var issues = new ArrayList<ValidationIssue>();
            for (var tx : message.transactions()) {
                var amount = tx.amount();
                if (amount == null || amount.value() == null) {
                    continue;
                }
                var normalized = amount.value().abs().stripTrailingZeros().toPlainString().replace(".", "");
                if (normalized.length() > 15) {
                    issues.add(ValidationIssue.transactionLevel(code(), ruleSet(), severity(),
                            tx.transactionReference(), ":32B: amount exceeds 15 digits"));
                }
            }
            return issues;
        }
    }

    /** {@code STRUCT.FIELD_71A_FORMAT}: charges code debe ser 3 letras. */
    @ApplicationScoped
    public static class DetailsOfChargesFormatRule extends StructuralPredicate {
        public DetailsOfChargesFormatRule() {
            super("STRUCT.FIELD_71A_FORMAT", ValidationIssue.Severity.ERROR);
        }

        @Override
        public List<ValidationIssue> evaluate(Mt101Message message) {
            if (message == null) {
                return List.of();
            }
            var issues = new ArrayList<ValidationIssue>();
            for (var tx : message.transactions()) {
                if (tx.detailsOfCharges() == null
                        || !DETAILS_OF_CHARGES_PATTERN.matcher(tx.detailsOfCharges()).matches()) {
                    issues.add(ValidationIssue.transactionLevel(code(), ruleSet(), severity(),
                            tx.transactionReference(), ":71A: must be 3 uppercase letters"));
                }
            }
            return issues;
        }
    }

    /**
     * {@code STRUCT.FIELD_28D_FORMAT}: {@code :28D:} (message index/total) debe ser
     * {@code 5n/5n} con index &gt;= 1, total &gt;= 1 e index &lt;= total. Critico para
     * fragmentacion masiva: un set con totals inconsistentes rompe el reensamblado
     * del lado receptor.
     */
    @ApplicationScoped
    public static class MessageIndexTotalFormatRule extends StructuralPredicate {
        private static final int MAX_28D_VALUE = 99999;

        public MessageIndexTotalFormatRule() {
            super("STRUCT.FIELD_28D_FORMAT", ValidationIssue.Severity.ERROR);
        }

        @Override
        public List<ValidationIssue> evaluate(Mt101Message message) {
            if (message == null || message.sequenceA() == null) {
                return List.of();
            }
            var index = message.sequenceA().messageIndex();
            var total = message.sequenceA().messageTotal();
            if (index < 1 || total < 1) {
                return List.of(ValidationIssue.messageLevel(code(), ruleSet(), severity(),
                        ":28D: index/total must both be >= 1, got " + index + "/" + total));
            }
            if (index > total) {
                return List.of(ValidationIssue.messageLevel(code(), ruleSet(), severity(),
                        ":28D: index must not exceed total, got " + index + "/" + total));
            }
            if (index > MAX_28D_VALUE || total > MAX_28D_VALUE) {
                return List.of(ValidationIssue.messageLevel(code(), ruleSet(), severity(),
                        ":28D: index/total exceed 5n format (max " + MAX_28D_VALUE + "), got "
                                + index + "/" + total));
            }
            return List.of();
        }
    }

    /**
     * {@code STRUCT.ENVELOPE_LT_FORMAT}: sender/receiver LT de blocks 1/2 deben ser
     * 12 caracteres alfanumericos (BIC8 + terminal + branch). Gate de validacion:
     * el formatter FIN ({@code safeLt}) rellena/trunca por compatibilidad, pero un
     * LT invalido nunca debe llegar a {@code MT101_PAY} sin que esta regla lo marque.
     */
    @ApplicationScoped
    public static class EnvelopeLtFormatRule extends StructuralPredicate {
        private static final Pattern LT_PATTERN = Pattern.compile("^[A-Z0-9]{12}$");

        public EnvelopeLtFormatRule() {
            super("STRUCT.ENVELOPE_LT_FORMAT", ValidationIssue.Severity.ERROR);
        }

        @Override
        public List<ValidationIssue> evaluate(Mt101Message message) {
            if (message == null || message.envelope() == null) {
                return List.of();
            }
            var issues = new ArrayList<ValidationIssue>();
            checkLt(issues, "senderLt", message.envelope().senderLt());
            checkLt(issues, "receiverLt", message.envelope().receiverLt());
            return issues;
        }

        private void checkLt(List<ValidationIssue> issues, String field, String lt) {
            if (lt == null || lt.isBlank()) {
                return;
            }
            if (!LT_PATTERN.matcher(lt).matches()) {
                issues.add(ValidationIssue.messageLevel(code(), ruleSet(), severity(),
                        "envelope." + field + " must be 12 alphanumeric characters (block 1/2 LT), got '"
                                + lt + "'"));
            }
        }
    }

    private static boolean hasPartyValue(Mt101Message.Party party) {
        return party != null
                && ((party.account() != null && !party.account().isBlank())
                    || (party.bic() != null && !party.bic().isBlank())
                    || (party.nameAndAddress() != null && !party.nameAndAddress().isEmpty()));
    }
}
