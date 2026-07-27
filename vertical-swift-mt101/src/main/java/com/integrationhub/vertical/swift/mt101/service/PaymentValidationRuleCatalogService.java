package com.integrationhub.vertical.swift.mt101.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.vertical.swift.mt101.api.request.PaymentValidationRuleImportRequest;
import com.integrationhub.vertical.swift.mt101.api.request.PaymentValidationRuleRequest;
import com.integrationhub.vertical.swift.mt101.repository.PaymentValidationRuleRepository;
import com.integrationhub.platform.spi.api.PageResponse;
import com.integrationhub.vertical.swift.mt101.entity.PaymentValidationRule;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@ApplicationScoped
public class PaymentValidationRuleCatalogService {

    private static final Set<String> PREDICATE_KINDS = Set.of(
            "FIELD_REQUIRED",
            "FIELD_FORBIDDEN",
            "OPTION_ALLOWED",
            "MAX_LENGTH",
            "CURRENCY_ALLOWED",
            "AMOUNT_MAX",
            "CHARGES_ALLOWED",
            "JEXL"
    );

    private final PaymentValidationRuleRepository repository;
    private final ObjectMapper objectMapper;

    public PaymentValidationRuleCatalogService(PaymentValidationRuleRepository repository,
                                               ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public PageResponse<PaymentValidationRule> list(String ruleSet,
                                                    String queryText,
                                                    String standard,
                                                    String appliesTo,
                                                    String status,
                                                    int page,
                                                    int size) {
        var query = new StringBuilder("from PaymentValidationRule r where 1=1");
        var parameters = new HashMap<String, Object>();
        if (ruleSet != null && !ruleSet.isBlank()) {
            query.append(" and lower(r.ruleSet) = :ruleSet");
            parameters.put("ruleSet", ruleSet.trim().toLowerCase(Locale.ROOT));
        }
        if (queryText != null && !queryText.isBlank()) {
            query.append(" and (lower(r.code) like :q or lower(r.ruleSet) like :q)");
            parameters.put("q", "%" + queryText.trim().toLowerCase(Locale.ROOT) + "%");
        }
        if (standard != null && !standard.isBlank()) {
            query.append(" and lower(r.standard) = :standard");
            parameters.put("standard", standard.trim().toLowerCase(Locale.ROOT));
        }
        if (appliesTo != null && !appliesTo.isBlank()) {
            query.append(" and lower(r.appliesTo) = :appliesTo");
            parameters.put("appliesTo", appliesTo.trim().toLowerCase(Locale.ROOT));
        }
        if ("active".equalsIgnoreCase(status)) {
            query.append(" and r.active = true");
        } else if ("inactive".equalsIgnoreCase(status)) {
            query.append(" and r.active = false");
        }
        query.append(" order by r.ruleSet, r.code");

        var panacheQuery = repository.find(query.toString(), parameters);
        var total = panacheQuery.count();
        panacheQuery.page(Math.max(page, 0), Math.max(size, 1));
        return new PageResponse<>(total, panacheQuery.list());
    }

    public List<PaymentValidationRule> exportRuleSet(String ruleSet) {
        if (ruleSet == null || ruleSet.isBlank()) {
            throw new IllegalArgumentException("ruleSet is required for export");
        }
        return repository.listByRuleSet(ruleSet.trim());
    }

    @Transactional
    public PaymentValidationRule create(PaymentValidationRuleRequest request) {
        var rule = new PaymentValidationRule();
        apply(rule, request, null);
        repository.persist(rule);
        return rule;
    }

    @Transactional
    public PaymentValidationRule update(Long ruleId, PaymentValidationRuleRequest request) {
        var rule = repository.findRequired(ruleId);
        apply(rule, request, null);
        return rule;
    }

    @Transactional
    public PaymentValidationRule setActive(Long ruleId, boolean active) {
        var rule = repository.findRequired(ruleId);
        rule.active = active;
        return rule;
    }

    @Transactional
    public ImportResult importRules(PaymentValidationRuleImportRequest request) {
        if (request == null || request.rules() == null || request.rules().isEmpty()) {
            throw new IllegalArgumentException("rules is required for import");
        }
        var importRuleSet = normalizeRuleSet(request.ruleSet());
        if (request.replaceExisting()) {
            repository.deleteByRuleSet(importRuleSet);
        }
        var count = 0;
        for (var item : request.rules()) {
            var rule = new PaymentValidationRule();
            apply(rule, item, importRuleSet);
            repository.persist(rule);
            count++;
        }
        return new ImportResult(importRuleSet, count, request.replaceExisting());
    }

    private void apply(PaymentValidationRule rule,
                       PaymentValidationRuleRequest request,
                       String forcedRuleSet) {
        if (request == null) {
            throw new IllegalArgumentException("Payment validation rule request is required");
        }
        rule.ruleSet = forcedRuleSet == null ? normalizeRuleSet(request.ruleSet()) : forcedRuleSet;
        rule.code = required(request.code(), "code", 80);
        rule.standard = required(request.standard(), "standard", 20).toUpperCase(Locale.ROOT);
        rule.appliesTo = required(request.appliesTo(), "appliesTo", 50).toUpperCase(Locale.ROOT);
        rule.severity = normalizeSeverity(request.severity());
        rule.predicateKind = normalizePredicateKind(request.predicateKind());
        rule.predicateBody = validatePredicateBody(request.predicateBody());
        rule.active = request.active();
    }

    private String normalizeRuleSet(String raw) {
        return required(raw, "ruleSet", 50);
    }

    private String normalizeSeverity(String raw) {
        var value = required(raw, "severity", 1).toUpperCase(Locale.ROOT);
        if (!Set.of("E", "W", "I").contains(value)) {
            throw new IllegalArgumentException("severity must be E, W or I");
        }
        return value;
    }

    private String normalizePredicateKind(String raw) {
        var value = required(raw, "predicateKind", 20).toUpperCase(Locale.ROOT);
        if (!PREDICATE_KINDS.contains(value)) {
            throw new IllegalArgumentException("Unsupported predicateKind: " + value);
        }
        return value;
    }

    private String validatePredicateBody(String raw) {
        var value = required(raw, "predicateBody", Integer.MAX_VALUE);
        try {
            objectMapper.readTree(value);
        } catch (Exception error) {
            throw new IllegalArgumentException("predicateBody must be valid JSON", error);
        }
        return value;
    }

    private String required(String raw, String field, int maxLength) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException(field + " is required");
        }
        var value = raw.trim();
        if (value.length() > maxLength) {
            throw new IllegalArgumentException(field + " exceeds " + maxLength + " characters");
        }
        return value;
    }

    public record ImportResult(String ruleSet, int importedCount, boolean replacedExisting) {
    }
}
