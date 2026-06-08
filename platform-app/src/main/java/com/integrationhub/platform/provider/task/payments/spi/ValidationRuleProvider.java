package com.integrationhub.platform.provider.task.payments.spi;

import java.util.List;

/**
 * SPI para descubrir/cargar predicados de validacion activos para un set de reglas.
 *
 * <p>La implementacion default de slice 2 ({@code CdiValidationRuleProvider}) descubre
 * los predicados desde el contenedor CDI: cada {@link ValidationPredicate} con
 * {@link jakarta.enterprise.context.ApplicationScoped} aparece automaticamente.</p>
 *
 * <p>Implementaciones futuras pueden cargar predicados desde la tabla
 * {@code payment_validation_rule} (lazy compile a {@link ValidationPredicate}) o desde
 * un servicio remoto con catalogo SWIFT licenciado. La inyeccion del provider activo
 * se hace via CDI {@code @Inject Instance<ValidationRuleProvider>}; cuando hay mas de
 * uno, la prioridad la define {@code @jakarta.annotation.Priority}.</p>
 *
 * @trace spec 008-mensajeria-pagos RF-011, T-002
 * @trace ADR-009
 */
public interface ValidationRuleProvider {

    /**
     * Devuelve los predicados activos para la combinacion solicitada.
     *
     * @param ruleSet identificador del set (p.ej. {@code structural-mvp},
     *                {@code swift-fin-uat-2024-q4}).
     * @param standard {@code SWIFT}, {@code ISO20022}, {@code OPENBANKING}, o {@code "*"}
     *                 para todos.
     * @param appliesTo {@code MT101}, {@code PAIN001}, etc., o {@code "*"} para todos.
     * @return lista de predicados (puede ser vacia).
     */
    List<ValidationPredicate> findRules(String ruleSet, String standard, String appliesTo);
}
