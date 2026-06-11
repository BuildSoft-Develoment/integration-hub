package com.integrationhub.platform.api.request.payments;

import java.util.List;

public record PaymentValidationRuleImportRequest(
        String ruleSet,
        boolean replaceExisting,
        List<PaymentValidationRuleRequest> rules
) {
}
