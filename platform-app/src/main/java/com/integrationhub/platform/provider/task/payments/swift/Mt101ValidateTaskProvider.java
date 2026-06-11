package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.platform.provider.task.payments.spi.ValidationIssue;
import com.integrationhub.platform.provider.task.payments.spi.ValidationPredicate;
import com.integrationhub.platform.provider.task.payments.spi.ValidationRuleProvider;
import com.integrationhub.platform.provider.task.payments.swift.model.Mt101Message;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * Task provider {@code MT101_VALIDATE}: aplica los predicados activos del
 * {@code ruleSet} configurado sobre cada {@link Mt101Message} producido por la tarea
 * anterior (tipicamente {@code MT101_BUILD}).
 *
 * <p>{@code executionMode} esperado: {@code once}. Bypassa el
 * {@code TaskInputResolver} (que solo sabe convertir {@code ReadRecord}/{@code Map})
 * leyendo {@code Mt101Message} directo del mapa {@code taskOutputs}.</p>
 *
 * <p><b>Outputs publicados</b>:</p>
 * <ul>
 *   <li>{@code validCount}, {@code invalidCount}, {@code ruleSet}: claves planas.</li>
 *   <li>{@code issuesBySeverity}: mapa ERROR/WARNING/INFO -&gt; count.</li>
 *   <li>{@code errors}: lista de {@link ValidationIssue} (consumible por
 *       {@code NOTIFICATION}/{@code MT101_REPAIR}).</li>
 * </ul>
 *
 * <p>{@code configuration.failOn} controla si {@link TaskResult#success(String)} o
 * {@link TaskResult#failure(String)}: por defecto {@code ERROR} (cualquier error
 * marca el resultado como falla y aborta el pipeline si esta encadenado).</p>
 *
 * @trace spec 008-mensajeria-pagos RF-002, T-007
 * @trace ADR-009
 */
@ApplicationScoped
public class Mt101ValidateTaskProvider implements TaskProvider {

    private static final String DEFAULT_RULE_SET = "structural-mvp";
    private static final String DEFAULT_STANDARD = "SWIFT";
    private static final String DEFAULT_APPLIES_TO = "MT101";
    private static final String DEFAULT_FAIL_ON = "ERROR";

    private final Instance<ValidationRuleProvider> ruleProviders;

    public Mt101ValidateTaskProvider(Instance<ValidationRuleProvider> ruleProviders) {
        this.ruleProviders = ruleProviders;
    }

    @Override
    public String type() {
        return "MT101_VALIDATE";
    }

    @Override
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        var messages = Mt101MessageInputResolver.readMessages(context, configuration, type());
        if (messages.isEmpty()) {
            return TaskResult.success("MT101_VALIDATE skipped because there are no messages to validate");
        }

        var ruleSet = stringValue(configuration.get("ruleSet"), DEFAULT_RULE_SET);
        var standard = stringValue(configuration.get("standard"), DEFAULT_STANDARD);
        var appliesTo = stringValue(configuration.get("appliesTo"), DEFAULT_APPLIES_TO);
        var failOn = severityValue(configuration.get("failOn"), ValidationIssue.Severity.ERROR);

        var predicates = resolveRules(ruleSet, standard, appliesTo);
        var issues = applyPredicates(predicates, messages);
        var bySeverity = countBySeverity(issues);

        var invalidMessageCount = countInvalidMessages(messages, issues, failOn);
        var validMessageCount = messages.size() - invalidMessageCount;

        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("validCount", validMessageCount);
        outputs.put("invalidCount", invalidMessageCount);
        outputs.put("ruleSet", ruleSet);
        outputs.put("issuesBySeverity", bySeverity);
        outputs.put("errors", issues);

        var summary = "MT101_VALIDATE ruleSet=" + ruleSet
                + " messages=" + messages.size()
                + " invalid=" + invalidMessageCount
                + " issues=" + issues.size();

        var hasFailure = issues.stream().anyMatch(issue -> issue.severity().reaches(failOn));
        return hasFailure ? TaskResult.failure(summary, outputs) : TaskResult.success(summary, outputs);
    }

    private List<ValidationPredicate> resolveRules(String ruleSet, String standard, String appliesTo) {
        if (ruleProviders.isUnsatisfied()) {
            throw new IllegalStateException("No ValidationRuleProvider registered");
        }
        var aggregated = new ArrayList<ValidationPredicate>();
        for (var provider : ruleProviders) {
            aggregated.addAll(provider.findRules(ruleSet, standard, appliesTo));
        }
        // Estabiliza el orden de evaluacion (deterministico para tests y reportes).
        aggregated.sort(Comparator.comparing(ValidationPredicate::code));
        return aggregated;
    }

    private List<ValidationIssue> applyPredicates(List<ValidationPredicate> predicates,
                                                  List<Mt101Message> messages) {
        var issues = new ArrayList<ValidationIssue>();
        for (var message : messages) {
            for (var predicate : predicates) {
                var found = predicate.evaluate(message);
                if (found != null && !found.isEmpty()) {
                    issues.addAll(found);
                }
            }
        }
        return issues;
    }

    private Map<String, Integer> countBySeverity(List<ValidationIssue> issues) {
        var counts = new TreeMap<String, Integer>();
        counts.put(ValidationIssue.Severity.ERROR.name(), 0);
        counts.put(ValidationIssue.Severity.WARNING.name(), 0);
        counts.put(ValidationIssue.Severity.INFO.name(), 0);
        for (var issue : issues) {
            counts.merge(issue.severity().name(), 1, Integer::sum);
        }
        return counts;
    }

    /**
     * Cuenta cuantos mensajes tienen al menos un issue que alcanza el umbral
     * {@code failOn}. Un mensaje invalido lo es por tener al menos un issue, no por
     * "cuantos" issues; evita contar dos veces.
     */
    private int countInvalidMessages(List<Mt101Message> messages,
                                     List<ValidationIssue> issues,
                                     ValidationIssue.Severity failOn) {
        if (issues.isEmpty()) {
            return 0;
        }
        // Sin un mapping explicito message->issue, usamos la referencia de mensaje
        // (sendersReference) y la de transaccion. Para slice 2 con un solo mensaje
        // por ejecucion, el caso comun es 0 o 1; cubrimos N usando heuristica de
        // "al menos un issue blocking sobre el conjunto" (false-positive seguro:
        // todos los mensajes se consideran invalidos si hay un solo issue blocking).
        var anyBlocking = issues.stream().anyMatch(issue -> issue.severity().reaches(failOn));
        return anyBlocking ? messages.size() : 0;
    }

    private String stringValue(Object raw, String defaultValue) {
        if (raw == null) {
            return defaultValue;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? defaultValue : value;
    }

    private ValidationIssue.Severity severityValue(Object raw, ValidationIssue.Severity defaultValue) {
        if (raw == null) {
            return defaultValue;
        }
        try {
            return ValidationIssue.Severity.valueOf(String.valueOf(raw).trim().toUpperCase());
        } catch (IllegalArgumentException ignored) {
            return defaultValue;
        }
    }
}
