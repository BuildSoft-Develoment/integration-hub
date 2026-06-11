package com.integrationhub.platform.api.response.payments;

public record PaymentValidationRuleImportResponse(
        String ruleSet,
        int importedCount,
        boolean replacedExisting
) {
}
