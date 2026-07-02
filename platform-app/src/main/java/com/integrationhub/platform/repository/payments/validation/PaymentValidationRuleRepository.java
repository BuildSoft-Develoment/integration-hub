package com.integrationhub.platform.repository.payments.validation;

import com.integrationhub.platform.entity.PaymentValidationRule;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.StringJoiner;

@ApplicationScoped
public class PaymentValidationRuleRepository
        implements PanacheRepository<PaymentValidationRule>, PaymentValidationRuleReader {

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

    @Override
    @Transactional
    public List<PaymentValidationRuleReader.RuleRow> listActiveRules(String ruleSet,
                                                                     String standard,
                                                                     String appliesTo) {
        var query = new StringJoiner(" and ");
        var parameters = new java.util.ArrayList<Object>();
        query.add("active = true");
        if (!isWildcard(ruleSet)) {
            parameters.add(ruleSet.toLowerCase());
            query.add("lower(ruleSet) = ?" + parameters.size());
        }
        if (!isWildcard(standard)) {
            parameters.add(standard.toLowerCase());
            query.add("lower(standard) = ?" + parameters.size());
        }
        if (!isWildcard(appliesTo)) {
            parameters.add(appliesTo.toLowerCase());
            query.add("lower(appliesTo) = ?" + parameters.size());
        }
        return list(query + " order by ruleSet, code", parameters.toArray()).stream()
                .map(this::toRow)
                .toList();
    }

    public void deleteByRuleSet(String ruleSet) {
        delete("ruleSet", ruleSet);
    }

    private boolean isWildcard(String requested) {
        return requested == null || requested.isBlank() || "*".equals(requested);
    }

    private PaymentValidationRuleReader.RuleRow toRow(PaymentValidationRule rule) {
        return new PaymentValidationRuleReader.RuleRow(
                rule.ruleSet,
                rule.code,
                rule.standard,
                rule.appliesTo,
                rule.severity,
                rule.predicateKind,
                rule.predicateBody);
    }
}
