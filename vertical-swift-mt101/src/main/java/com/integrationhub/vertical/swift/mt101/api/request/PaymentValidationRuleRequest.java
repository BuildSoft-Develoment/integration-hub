package com.integrationhub.vertical.swift.mt101.api.request;

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
