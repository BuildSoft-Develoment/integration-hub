package com.integrationhub.vertical.swift.mt101.api.response;

public record PaymentValidationRuleImportResponse(
        String ruleSet,
        int importedCount,
        boolean replacedExisting
) {
}
