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
import jakarta.inject.Inject;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * Task provider {@code MT101_VALIDATE}: aplica los predicados activos del
 * {@code ruleSet} configurado sobre cada {@link Mt101Message} producido por la tarea
 * anterior (tipicamente {@code MT101_BUILD} o {@code MT101_BUILD_FROM_TABLE}).
 *
 * <p>{@code executionMode} esperado: {@code once}. Bypassa el
 * {@code TaskInputResolver} (que solo sabe convertir {@code ReadRecord}/{@code Map})
 * leyendo {@code Mt101Message} directo del mapa {@code taskOutputs}.</p>
 *
 * <p><b>Flujo masivo (fragment source)</b>: lee fragmentos {@code BUILT} por
 * paginas (memoria O(pageSize)) y marca cada fragmento {@code VALIDATED} o
 * {@code REJECTED} individualmente. Esto habilita el gate de estados: un
 * fragmento invalido no contamina al resto y {@code MT101_PAY} (que por defecto
 * solo lee {@code ARCHIVED}) nunca despacha mensajes sin validar.</p>
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
    /** Estado de fragmentos que VALIDATE consume por defecto (gate de entrada). */
    private static final List<String> FRAGMENT_READ_STATUSES = List.of("BUILT");

    private final Instance<ValidationRuleProvider> ruleProviders;
    private final Mt101FragmentStore fragmentStore;

    @Inject
    public Mt101ValidateTaskProvider(Instance<ValidationRuleProvider> ruleProviders,
                                     Mt101FragmentStore fragmentStore) {
        this.ruleProviders = ruleProviders;
        this.fragmentStore = fragmentStore;
    }

    public Mt101ValidateTaskProvider(Instance<ValidationRuleProvider> ruleProviders) {
        this(ruleProviders, null);
    }

    @Override
    public String type() {
        return "MT101_VALIDATE";
    }

    @Override
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        var ruleSet = stringValue(configuration.get("ruleSet"), DEFAULT_RULE_SET);
        var standard = stringValue(configuration.get("standard"), DEFAULT_STANDARD);
        var appliesTo = stringValue(configuration.get("appliesTo"), DEFAULT_APPLIES_TO);
        var failOn = severityValue(configuration.get("failOn"), ValidationIssue.Severity.ERROR);
        var predicates = resolveRules(ruleSet, standard, appliesTo);

        var accumulator = new ValidationAccumulator();
        var fragmentSource = Mt101MessageInputResolver.fragmentSource(context, configuration, type());

        if (!fragmentSource.isEmpty() && fragmentStore != null) {
            var pageSize = intValue(configuration.get("pageSize"), Mt101FragmentStore.DEFAULT_PAGE_SIZE);
            fragmentStore.forEachPage(fragmentSource, FRAGMENT_READ_STATUSES, pageSize, page -> {
                for (var message : page) {
                    var messageIssues = evaluateMessage(predicates, message);
                    var blocking = accumulator.add(messageIssues, failOn);
                    markFragment(fragmentSource, message, blocking, messageIssues);
                }
            });
            // Propaga el fragment source para que ARCHIVE/PAY sigan leyendo del store.
            context.attributes().put("mt101FragmentSource", fragmentSource);
        } else {
            var messages = Mt101MessageInputResolver.readMessages(context, configuration, type(), fragmentStore);
            for (var message : messages) {
                accumulator.add(evaluateMessage(predicates, message), failOn);
            }
        }

        if (accumulator.totalMessages == 0) {
            return TaskResult.success("MT101_VALIDATE skipped because there are no messages to validate");
        }

        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("validCount", accumulator.totalMessages - accumulator.invalidMessages);
        outputs.put("invalidCount", accumulator.invalidMessages);
        outputs.put("ruleSet", ruleSet);
        outputs.put("issuesBySeverity", accumulator.bySeverity());
        outputs.put("errors", accumulator.issues);
        if (!fragmentSource.isEmpty()) {
            outputs.put("fragments", fragmentSource);
        }

        var summary = "MT101_VALIDATE ruleSet=" + ruleSet
                + " messages=" + accumulator.totalMessages
                + " invalid=" + accumulator.invalidMessages
                + " issues=" + accumulator.issues.size();

        return accumulator.invalidMessages > 0
                ? TaskResult.failure(summary, outputs)
                : TaskResult.success(summary, outputs);
    }

    private List<ValidationIssue> evaluateMessage(List<ValidationPredicate> predicates, Mt101Message message) {
        var issues = new ArrayList<ValidationIssue>();
        for (var predicate : predicates) {
            var found = predicate.evaluate(message);
            if (found != null && !found.isEmpty()) {
                issues.addAll(found);
            }
        }
        return issues;
    }

    private void markFragment(Map<String, Object> fragmentSource,
                              Mt101Message message,
                              boolean blocking,
                              List<ValidationIssue> issues) {
        if (fragmentStore == null || message.sequenceA() == null
                || message.sequenceA().sendersReference() == null) {
            return;
        }
        if (blocking) {
            fragmentStore.markStatus(fragmentSource, message.sequenceA().sendersReference(),
                    "REJECTED", summarizeIssues(issues));
        } else {
            fragmentStore.markStatus(fragmentSource, message.sequenceA().sendersReference(),
                    "VALIDATED", null);
        }
    }

    private String summarizeIssues(List<ValidationIssue> issues) {
        var sb = new StringBuilder();
        for (var issue : issues) {
            if (sb.length() > 0) {
                sb.append("; ");
            }
            sb.append(issue.code()).append(": ").append(issue.message());
            if (sb.length() > 500) {
                sb.setLength(500);
                sb.append("...");
                break;
            }
        }
        return sb.toString();
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

    /** Acumula resultados por mensaje sin retener los mensajes en memoria. */
    private static final class ValidationAccumulator {
        int totalMessages;
        int invalidMessages;
        final List<ValidationIssue> issues = new ArrayList<>();

        boolean add(List<ValidationIssue> messageIssues, ValidationIssue.Severity failOn) {
            totalMessages++;
            issues.addAll(messageIssues);
            var blocking = messageIssues.stream().anyMatch(issue -> issue.severity().reaches(failOn));
            if (blocking) {
                invalidMessages++;
            }
            return blocking;
        }

        Map<String, Integer> bySeverity() {
            var counts = new TreeMap<String, Integer>();
            counts.put(ValidationIssue.Severity.ERROR.name(), 0);
            counts.put(ValidationIssue.Severity.WARNING.name(), 0);
            counts.put(ValidationIssue.Severity.INFO.name(), 0);
            for (var issue : issues) {
                counts.merge(issue.severity().name(), 1, Integer::sum);
            }
            return counts;
        }
    }

    private String stringValue(Object raw, String defaultValue) {
        if (raw == null) {
            return defaultValue;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? defaultValue : value;
    }

    private int intValue(Object raw, int defaultValue) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return defaultValue;
        }
        return Integer.parseInt(String.valueOf(raw));
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
