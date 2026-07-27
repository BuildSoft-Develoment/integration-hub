package com.integrationhub.vertical.swift.mt101.api.request;

import java.util.List;

public record PaymentValidationRuleImportRequest(
        String ruleSet,
        boolean replaceExisting,
        List<PaymentValidationRuleRequest> rules
) {
}
