package com.integrationhub.platform.provider.task.payments.swift.validation;

import com.integrationhub.platform.spi.task.payments.ValidationPredicate;
import com.integrationhub.platform.spi.task.payments.ValidationRuleProvider;
import jakarta.annotation.Priority;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;

import java.util.List;

/**
 * Implementacion default de {@link ValidationRuleProvider}: descubre todos los
 * {@link ValidationPredicate} registrados como beans CDI y los filtra por
 * {@code ruleSet}, {@code standard} y {@code appliesTo}.
 *
 * <p>Implementaciones DB-backed o licenciadas tienen prioridad mayor via
 * {@link Priority @Priority} y desactivan esta default.</p>
 *
 * @trace spec 008-mensajeria-pagos RF-011, T-002
 * @trace ADR-009
 */
@ApplicationScoped
@Priority(0)
public class CdiValidationRuleProvider implements ValidationRuleProvider {

    private final Instance<ValidationPredicate> predicates;

    public CdiValidationRuleProvider(Instance<ValidationPredicate> predicates) {
        this.predicates = predicates;
    }

    @Override
    public List<ValidationPredicate> findRules(String ruleSet, String standard, String appliesTo) {
        return predicates.stream()
                .filter(ValidationPredicate::active)
                .filter(p -> matches(ruleSet, p.ruleSet()))
                .filter(p -> matches(standard, p.standard()))
                .filter(p -> matches(appliesTo, p.appliesTo()))
                .toList();
    }

    private boolean matches(String requested, String candidate) {
        if (requested == null || requested.isBlank() || "*".equals(requested)) {
            return true;
        }
        return requested.equalsIgnoreCase(candidate);
    }
}
