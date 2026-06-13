package com.integrationhub.platform.provider.task.payments.swift.validation;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.spi.payments.ValidationIssue;
import com.integrationhub.platform.spi.payments.ValidationPredicate;
import com.integrationhub.platform.provider.task.payments.model.Mt101Message;
import org.apache.commons.jexl3.JexlEngine;
import org.apache.commons.jexl3.MapContext;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Sintetiza {@link ValidationPredicate}s desde filas de {@code payment_validation_rule}.
 *
 * <p>Los {@code predicate_kind} son genericos y parametrizables: el repositorio
 * enumera <b>mecanismos</b> de validacion, nunca las reglas concretas de un banco
 * (esas son datos del ambiente, cargadas desde la guia H2H — ver ADR-009, misma
 * politica que las NVR licenciadas). Kinds soportados y shape del
 * {@code predicate_body} (JSON):</p>
 *
 * <pre>
 *   FIELD_REQUIRED   {"path": "sequenceA.requestedExecutionDate"}
 *   FIELD_FORBIDDEN  {"path": "transactions[].regulatoryReporting"}
 *   OPTION_ALLOWED   {"path": "transactions[].beneficiary.option", "allowed": ["", "F"]}
 *   MAX_LENGTH       {"path": "transactions[].remittanceInformation", "max": 105}
 *   CURRENCY_ALLOWED {"allowed": ["PEN", "USD"]}
 *   AMOUNT_MAX       {"max": "420000.00", "currency": "PEN"}   // currency opcional
 *   CHARGES_ALLOWED  {"allowed": ["SHA"]}
 *   JEXL             {"expression": "message.transactions().size() <= 50"}
 * </pre>
 *
 * <p>JEXL recibe la variable {@code message} ({@link Mt101Message}); la expresion
 * es una invariante que debe cumplirse — {@code false} produce un issue a nivel
 * de mensaje. El modelo son records Java: los accessors se invocan con parentesis
 * ({@code message.transactions()}, no {@code message.transactions}).</p>
 *
 * @trace spec 008-mensajeria-pagos RF-011 (perfiles por banco)
 * @trace ADR-009
 */
final class DbValidationPredicateFactory {

    private static final TypeReference<Map<String, Object>> BODY_TYPE = new TypeReference<>() {
    };

    private DbValidationPredicateFactory() {
        // Factory estatica.
    }

    /** Fila de {@code payment_validation_rule} ya tipada. */
    record RuleSpec(
            String ruleSet,
            String code,
            String standard,
            String appliesTo,
            ValidationIssue.Severity severity,
            String predicateKind,
            String predicateBody
    ) {
    }

    static ValidationPredicate fromSpec(RuleSpec spec, ObjectMapper objectMapper, JexlEngine jexlEngine) {
        Map<String, Object> body;
        try {
            body = spec.predicateBody() == null || spec.predicateBody().isBlank()
                    ? Map.of()
                    : objectMapper.readValue(spec.predicateBody(), BODY_TYPE);
        } catch (Exception error) {
            throw new IllegalArgumentException("Rule " + spec.code()
                    + " has invalid predicate_body JSON: " + spec.predicateBody(), error);
        }
        var kind = spec.predicateKind() == null ? "" : spec.predicateKind().trim().toUpperCase(Locale.ROOT);
        return switch (kind) {
            case "FIELD_REQUIRED" -> fieldRequired(spec, requiredString(spec, body, "path"));
            case "FIELD_FORBIDDEN" -> fieldForbidden(spec, requiredString(spec, body, "path"));
            case "OPTION_ALLOWED" -> optionAllowed(spec, requiredString(spec, body, "path"),
                    requiredStrings(spec, body, "allowed"));
            case "MAX_LENGTH" -> maxLength(spec, requiredString(spec, body, "path"),
                    requiredInt(spec, body, "max"));
            case "CURRENCY_ALLOWED" -> currencyAllowed(spec, requiredStrings(spec, body, "allowed"));
            case "AMOUNT_MAX" -> amountMax(spec, requiredDecimal(spec, body, "max"),
                    optionalString(body, "currency"));
            case "CHARGES_ALLOWED" -> chargesAllowed(spec, requiredStrings(spec, body, "allowed"));
            case "JEXL" -> jexl(spec, requiredString(spec, body, "expression"), jexlEngine);
            default -> throw new IllegalArgumentException("Rule " + spec.code()
                    + " has unsupported predicate_kind '" + spec.predicateKind() + "'");
        };
    }

    private static ValidationPredicate fieldRequired(RuleSpec spec, String path) {
        return new SpecPredicate(spec) {
            @Override
            public List<ValidationIssue> evaluate(Mt101Message message) {
                var issues = new ArrayList<ValidationIssue>();
                for (var resolved : Mt101MessagePathResolver.resolve(message, path)) {
                    if (!Mt101MessagePathResolver.hasValue(resolved.value())) {
                        issues.add(issue(resolved.transactionReference(),
                                path + " is required by this bank profile"));
                    }
                }
                return issues;
            }
        };
    }

    private static ValidationPredicate fieldForbidden(RuleSpec spec, String path) {
        return new SpecPredicate(spec) {
            @Override
            public List<ValidationIssue> evaluate(Mt101Message message) {
                var issues = new ArrayList<ValidationIssue>();
                for (var resolved : Mt101MessagePathResolver.resolve(message, path)) {
                    if (Mt101MessagePathResolver.hasValue(resolved.value())) {
                        issues.add(issue(resolved.transactionReference(),
                                path + " is not supported by this bank profile"));
                    }
                }
                return issues;
            }
        };
    }

    private static ValidationPredicate optionAllowed(RuleSpec spec, String path, List<String> allowed) {
        var normalized = allowed.stream().map(value -> value.toUpperCase(Locale.ROOT)).toList();
        return new SpecPredicate(spec) {
            @Override
            public List<ValidationIssue> evaluate(Mt101Message message) {
                var issues = new ArrayList<ValidationIssue>();
                for (var resolved : Mt101MessagePathResolver.resolve(message, path)) {
                    if (resolved.value() == null) {
                        continue;
                    }
                    var value = String.valueOf(resolved.value()).toUpperCase(Locale.ROOT);
                    if (!normalized.contains(value)) {
                        issues.add(issue(resolved.transactionReference(),
                                path + " value '" + resolved.value() + "' not allowed; expected one of " + allowed));
                    }
                }
                return issues;
            }
        };
    }

    private static ValidationPredicate maxLength(RuleSpec spec, String path, int max) {
        return new SpecPredicate(spec) {
            @Override
            public List<ValidationIssue> evaluate(Mt101Message message) {
                var issues = new ArrayList<ValidationIssue>();
                for (var resolved : Mt101MessagePathResolver.resolve(message, path)) {
                    if (resolved.value() instanceof String text && text.length() > max) {
                        issues.add(issue(resolved.transactionReference(),
                                path + " exceeds max length " + max + " (got " + text.length() + ")"));
                    }
                }
                return issues;
            }
        };
    }

    private static ValidationPredicate currencyAllowed(RuleSpec spec, List<String> allowed) {
        var normalized = allowed.stream().map(value -> value.toUpperCase(Locale.ROOT)).toList();
        return new SpecPredicate(spec) {
            @Override
            public List<ValidationIssue> evaluate(Mt101Message message) {
                var issues = new ArrayList<ValidationIssue>();
                for (var tx : message.transactions()) {
                    var currency = tx.amount() == null ? null : tx.amount().currency();
                    if (currency != null && !normalized.contains(currency.toUpperCase(Locale.ROOT))) {
                        issues.add(issue(tx.transactionReference(),
                                "currency '" + currency + "' not allowed; expected one of " + allowed));
                    }
                }
                return issues;
            }
        };
    }

    private static ValidationPredicate amountMax(RuleSpec spec, BigDecimal max, String currency) {
        var normalizedCurrency = currency == null ? null : currency.toUpperCase(Locale.ROOT);
        return new SpecPredicate(spec) {
            @Override
            public List<ValidationIssue> evaluate(Mt101Message message) {
                var issues = new ArrayList<ValidationIssue>();
                for (var tx : message.transactions()) {
                    if (tx.amount() == null || tx.amount().value() == null) {
                        continue;
                    }
                    if (normalizedCurrency != null && (tx.amount().currency() == null
                            || !normalizedCurrency.equals(tx.amount().currency().toUpperCase(Locale.ROOT)))) {
                        continue;
                    }
                    if (tx.amount().value().compareTo(max) > 0) {
                        issues.add(issue(tx.transactionReference(),
                                "amount " + tx.amount().value().toPlainString()
                                        + (normalizedCurrency == null ? "" : " " + normalizedCurrency)
                                        + " exceeds bank profile max " + max.toPlainString()));
                    }
                }
                return issues;
            }
        };
    }

    private static ValidationPredicate chargesAllowed(RuleSpec spec, List<String> allowed) {
        var normalized = allowed.stream().map(value -> value.toUpperCase(Locale.ROOT)).toList();
        return new SpecPredicate(spec) {
            @Override
            public List<ValidationIssue> evaluate(Mt101Message message) {
                var issues = new ArrayList<ValidationIssue>();
                for (var tx : message.transactions()) {
                    var charges = tx.detailsOfCharges();
                    if (charges != null && !normalized.contains(charges.toUpperCase(Locale.ROOT))) {
                        issues.add(issue(tx.transactionReference(),
                                ":71A: '" + charges + "' not allowed; expected one of " + allowed));
                    }
                }
                return issues;
            }
        };
    }

    private static ValidationPredicate jexl(RuleSpec spec, String expression, JexlEngine jexlEngine) {
        var compiled = jexlEngine.createExpression(expression);
        return new SpecPredicate(spec) {
            @Override
            public List<ValidationIssue> evaluate(Mt101Message message) {
                var context = new MapContext();
                context.set("message", message);
                Object result;
                try {
                    result = compiled.evaluate(context);
                } catch (RuntimeException error) {
                    return List.of(issue(null, "JEXL rule failed to evaluate: " + error.getMessage()));
                }
                if (Boolean.TRUE.equals(result)) {
                    return List.of();
                }
                return List.of(issue(null, "bank profile invariant violated: " + expression));
            }
        };
    }

    /** Base con metadata tomada de la fila; solo falta {@code evaluate}. */
    private abstract static class SpecPredicate implements ValidationPredicate {
        private final RuleSpec spec;

        SpecPredicate(RuleSpec spec) {
            this.spec = spec;
        }

        @Override
        public final String code() {
            return spec.code();
        }

        @Override
        public final String standard() {
            return spec.standard();
        }

        @Override
        public final String appliesTo() {
            return spec.appliesTo();
        }

        @Override
        public final ValidationIssue.Severity severity() {
            return spec.severity();
        }

        @Override
        public final String ruleSet() {
            return spec.ruleSet();
        }

        final ValidationIssue issue(String transactionReference, String message) {
            return transactionReference == null
                    ? ValidationIssue.messageLevel(code(), ruleSet(), severity(), message)
                    : ValidationIssue.transactionLevel(code(), ruleSet(), severity(), transactionReference, message);
        }
    }

    // --- parsing helpers del body ---

    private static String requiredString(RuleSpec spec, Map<String, Object> body, String key) {
        var value = optionalString(body, key);
        if (value == null) {
            throw new IllegalArgumentException("Rule " + spec.code()
                    + " predicate_body requires '" + key + "'");
        }
        return value;
    }

    private static String optionalString(Map<String, Object> body, String key) {
        var raw = body.get(key);
        if (raw == null) {
            return null;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? null : value;
    }

    private static List<String> requiredStrings(RuleSpec spec, Map<String, Object> body, String key) {
        if (!(body.get(key) instanceof List<?> rawList) || rawList.isEmpty()) {
            throw new IllegalArgumentException("Rule " + spec.code()
                    + " predicate_body requires non-empty array '" + key + "'");
        }
        return rawList.stream().map(String::valueOf).toList();
    }

    private static int requiredInt(RuleSpec spec, Map<String, Object> body, String key) {
        var raw = body.get(key);
        if (raw == null) {
            throw new IllegalArgumentException("Rule " + spec.code()
                    + " predicate_body requires '" + key + "'");
        }
        return Integer.parseInt(String.valueOf(raw));
    }

    private static BigDecimal requiredDecimal(RuleSpec spec, Map<String, Object> body, String key) {
        var raw = body.get(key);
        if (raw == null) {
            throw new IllegalArgumentException("Rule " + spec.code()
                    + " predicate_body requires '" + key + "'");
        }
        return new BigDecimal(String.valueOf(raw));
    }
}
