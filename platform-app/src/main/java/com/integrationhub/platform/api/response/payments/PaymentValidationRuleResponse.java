package com.integrationhub.platform.api.response.payments;

public record PaymentValidationRuleResponse(
        Long id,
        String ruleSet,
        String code,
        String standard,
        String appliesTo,
        String severity,
        String predicateKind,
        String predicateBody,
        boolean active
) {
}
