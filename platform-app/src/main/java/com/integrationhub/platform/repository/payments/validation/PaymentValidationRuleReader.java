package com.integrationhub.platform.repository.payments.validation;

import java.util.List;

/** Contrato de lectura para reglas activas de validacion de pagos. */
@FunctionalInterface
public interface PaymentValidationRuleReader {

    List<RuleRow> listActiveRules(String ruleSet, String standard, String appliesTo);

    record RuleRow(String ruleSet,
                   String code,
                   String standard,
                   String appliesTo,
                   String severity,
                   String predicateKind,
                   String predicateBody) {
    }
}
