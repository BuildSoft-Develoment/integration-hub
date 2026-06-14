package com.integrationhub.platform.provider.task.payments.swift.validation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.spi.task.payments.ValidationIssue;
import com.integrationhub.platform.spi.task.payments.ValidationPredicate;
import com.integrationhub.platform.spi.task.payments.ValidationRuleProvider;
import com.integrationhub.platform.repository.payments.validation.PaymentValidationRuleReader;
import jakarta.annotation.Priority;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.commons.jexl3.JexlBuilder;
import org.apache.commons.jexl3.JexlEngine;
import org.apache.commons.jexl3.introspection.JexlPermissions;

import java.util.ArrayList;
import java.util.List;

/**
 * {@link ValidationRuleProvider} respaldado por la tabla {@code payment_validation_rule}
 * (V12). Materializa el seam que {@code CdiValidationRuleProvider} dejo previsto:
 * <b>perfiles por banco como datos, no como codigo</b>.
 *
 * <p>Onboarding de un banco = insertar filas {@code rule_set='bank:XXX'} traducidas
 * de su guia H2H (via catalogo/API/import, por ambiente) y configurar el pipeline:</p>
 * <pre>
 *   MT101_VALIDATE { ruleSet: "structural-mvp" }   // estandar, siempre
 *   MT101_VALIDATE { ruleSet: "bank:BCP" }         // perfil del banco destino
 * </pre>
 *
 * <p>Ambos providers conviven: {@code Mt101ValidateTaskProvider} agrega los
 * predicados de TODOS los {@code ValidationRuleProvider} y filtra por
 * {@code ruleSet}, asi que las reglas estructurales (CDI) y las de banco (BD)
 * nunca se mezclan salvo peticion explicita con {@code ruleSet="*"}.</p>
 *
 * <p>Las reglas se materializan en cada {@code findRules} (sin cache): un perfil
 * editado en el catalogo aplica en la siguiente ejecucion sin reiniciar. El costo
 * es una query a una tabla de decenas de filas por ejecucion de MT101_VALIDATE.</p>
 *
 * @trace spec 008-mensajeria-pagos RF-011 (perfiles por banco)
 * @trace ADR-009
 */
@ApplicationScoped
@Priority(100)
public class DbValidationRuleProvider implements ValidationRuleProvider {

    private final PaymentValidationRuleReader ruleReader;
    private final ObjectMapper objectMapper;
    private final JexlEngine jexlEngine;

    @Inject
    public DbValidationRuleProvider(PaymentValidationRuleReader ruleReader, ObjectMapper objectMapper) {
        this.ruleReader = ruleReader;
        this.objectMapper = objectMapper;
        // RESTRICTED (default JEXL 3.3+) bloquea la introspeccion sobre el modelo
        // Mt101Message y java.util, dejando size()/accessors en null silencioso.
        // Las expresiones las autora un platform-admin via catalogo (config
        // confiable, igual que MT101_ROUTE), asi que UNRESTRICTED es aceptable.
        this.jexlEngine = new JexlBuilder()
                .permissions(JexlPermissions.UNRESTRICTED)
                .strict(false)
                .silent(true)
                .create();
    }

    @Override
    public List<ValidationPredicate> findRules(String ruleSet, String standard, String appliesTo) {
        var predicates = new ArrayList<ValidationPredicate>();
        for (var rule : ruleReader.listActiveRules(ruleSet, standard, appliesTo)) {
            var spec = new DbValidationPredicateFactory.RuleSpec(
                    rule.ruleSet(),
                    rule.code(),
                    rule.standard(),
                    rule.appliesTo(),
                    severity(rule.severity()),
                    rule.predicateKind(),
                    rule.predicateBody());
            predicates.add(DbValidationPredicateFactory.fromSpec(spec, objectMapper, jexlEngine));
        }
        return predicates;
    }

    private ValidationIssue.Severity severity(String raw) {
        if (raw == null || raw.isBlank()) {
            return ValidationIssue.Severity.ERROR;
        }
        return switch (raw.trim().toUpperCase().charAt(0)) {
            case 'W' -> ValidationIssue.Severity.WARNING;
            case 'I' -> ValidationIssue.Severity.INFO;
            default -> ValidationIssue.Severity.ERROR;
        };
    }

}
