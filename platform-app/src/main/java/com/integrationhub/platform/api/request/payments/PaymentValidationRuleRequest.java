package com.integrationhub.platform.api.request.payments;

public record PaymentValidationRuleRequest(
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
