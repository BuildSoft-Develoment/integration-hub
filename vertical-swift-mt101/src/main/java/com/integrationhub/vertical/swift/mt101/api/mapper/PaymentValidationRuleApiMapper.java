package com.integrationhub.vertical.swift.mt101.api.mapper;

import com.integrationhub.vertical.swift.mt101.api.response.PaymentValidationRuleResponse;
import com.integrationhub.vertical.swift.mt101.entity.PaymentValidationRule;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class PaymentValidationRuleApiMapper {

    public PaymentValidationRuleResponse toResponse(PaymentValidationRule rule) {
        return new PaymentValidationRuleResponse(
                rule.id,
                rule.ruleSet,
                rule.code,
                rule.standard,
                rule.appliesTo,
                rule.severity,
                rule.predicateKind,
                rule.predicateBody,
                rule.active
        );
    }
}
