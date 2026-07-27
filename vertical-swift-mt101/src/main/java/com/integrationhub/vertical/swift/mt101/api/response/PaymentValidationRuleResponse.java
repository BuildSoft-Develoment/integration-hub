package com.integrationhub.vertical.swift.mt101.api.response;

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
