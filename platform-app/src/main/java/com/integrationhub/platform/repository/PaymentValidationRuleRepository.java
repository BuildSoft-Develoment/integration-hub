package com.integrationhub.platform.repository;

import com.integrationhub.platform.entity.PaymentValidationRule;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class PaymentValidationRuleRepository implements PanacheRepository<PaymentValidationRule> {

    public PaymentValidationRule findRequired(Long ruleId) {
        var rule = findById(ruleId);
        if (rule == null) {
            throw new IllegalArgumentException("Payment validation rule not found: " + ruleId);
        }
        return rule;
    }

    public List<PaymentValidationRule> listByRuleSet(String ruleSet) {
        return list("ruleSet = ?1 order by code", ruleSet);
    }

    public void deleteByRuleSet(String ruleSet) {
        delete("ruleSet", ruleSet);
    }
}
