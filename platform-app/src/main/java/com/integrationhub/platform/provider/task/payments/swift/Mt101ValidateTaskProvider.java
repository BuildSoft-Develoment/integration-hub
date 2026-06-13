package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.platform.provider.task.payments.spi.ValidationIssue;
import com.integrationhub.platform.provider.task.payments.spi.ValidationPredicate;
import com.integrationhub.platform.provider.task.payments.spi.ValidationRuleProvider;
import com.integrationhub.platform.provider.task.payments.swift.model.Mt101Message;
import com.integrationhub.platform.repository.Mt101ValidationIssueRepository;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
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
    private static final String DEFAULT_ISSUE_TABLE = "mt101_validation_issue";
    private static final int DEFAULT_MAX_ISSUES_IN_OUTPUT = 1000;
    /** Estado de fragmentos que VALIDATE consume por defecto (gate de entrada). */
    private static final List<String> FRAGMENT_READ_STATUSES = List.of("BUILT");

    private final Instance<ValidationRuleProvider> ruleProviders;
    private final Mt101FragmentStore fragmentStore;
    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final Mt101ValidationIssueRepository issueRepository;

    @Inject
    public Mt101ValidateTaskProvider(Instance<ValidationRuleProvider> ruleProviders,
                                     Mt101FragmentStore fragmentStore,
                                     DataSource defaultDataSource,
                                     ConnectionPoolManager connectionPoolManager,
                                     Mt101ValidationIssueRepository issueRepository) {
        this.ruleProviders = ruleProviders;
        this.fragmentStore = fragmentStore;
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.issueRepository = issueRepository;
    }

    public Mt101ValidateTaskProvider(Instance<ValidationRuleProvider> ruleProviders,
                                     Mt101FragmentStore fragmentStore,
                                     DataSource defaultDataSource,
                                     ConnectionPoolManager connectionPoolManager) {
        this(ruleProviders, fragmentStore, defaultDataSource, connectionPoolManager,
                new Mt101ValidationIssueRepository());
    }

    public Mt101ValidateTaskProvider(Instance<ValidationRuleProvider> ruleProviders,
                                     Mt101FragmentStore fragmentStore) {
        this(ruleProviders, fragmentStore, null, null);
    }

    public Mt101ValidateTaskProvider(Instance<ValidationRuleProvider> ruleProviders) {
        this(ruleProviders, null);
    }

    @Override
    public String type() {
        return "MT101_VALIDATE";
    }

    @Override
    @Transactional(Transactional.TxType.NOT_SUPPORTED)
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        var ruleSet = stringValue(configuration.get("ruleSet"), DEFAULT_RULE_SET);
        var standard = stringValue(configuration.get("standard"), DEFAULT_STANDARD);
        var appliesTo = stringValue(configuration.get("appliesTo"), DEFAULT_APPLIES_TO);
        var failOn = severityValue(configuration.get("failOn"), ValidationIssue.Severity.ERROR);
        var issueSink = IssueSink.from(configuration.get("publishIssuesTo"));
        var maxIssuesInOutput = intValue(configuration.get("maxIssuesInOutput"), DEFAULT_MAX_ISSUES_IN_OUTPUT);
        var predicates = resolveRules(ruleSet, standard, appliesTo);

        var accumulator = new ValidationAccumulator(maxIssuesInOutput);
        var fragmentSource = Mt101MessageInputResolver.fragmentSource(context, configuration, type());

        if (!fragmentSource.isEmpty() && fragmentStore != null) {
            var pageSize = intValue(configuration.get("pageSize"), Mt101FragmentStore.DEFAULT_PAGE_SIZE);
            fragmentStore.forEachPage(fragmentSource, FRAGMENT_READ_STATUSES, pageSize, page -> {
                // Marcado por lote al cierre de cada pagina (1-2 round-trips por
                // pagina en vez de 1 UPDATE por fragmento).
                var validatedRefs = new ArrayList<String>(page.size());
                var rejectedByRef = new LinkedHashMap<String, String>();
                var pageIssues = issueSink.enabled() ? new ArrayList<IssueRow>() : null;
                for (var message : page) {
                    var messageIssues = evaluateMessage(predicates, message);
                    var blocking = accumulator.add(messageIssues, failOn);
                    if (pageIssues != null) {
                        for (var issue : messageIssues) {
                            pageIssues.add(issueRow(fragmentSource, message, issue));
                        }
                    }
                    var reference = message.sequenceA() == null ? null
                            : message.sequenceA().sendersReference();
                    if (reference == null) {
                        continue;
                    }
                    if (blocking) {
                        rejectedByRef.put(reference, summarizeIssues(messageIssues));
                    } else {
                        validatedRefs.add(reference);
                    }
                }
                persistIssueRows(issueSink, pageIssues);
                fragmentStore.markStatusBatch(fragmentSource, validatedRefs, "VALIDATED");
                fragmentStore.markStatusBatch(fragmentSource, rejectedByRef, "REJECTED");
            });
            // Propaga el fragment source para que ARCHIVE/PAY sigan leyendo del store.
            context.attributes().put("mt101FragmentSource", fragmentSource);
        } else {
            var messages = Mt101MessageInputResolver.readMessages(context, configuration, type(), fragmentStore);
            for (var message : messages) {
                var messageIssues = evaluateMessage(predicates, message);
                accumulator.add(messageIssues, failOn);
                persistIssues(issueSink, messageIssues);
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
        outputs.put("issueCount", accumulator.issueCount);
        outputs.put("issuesTruncated", accumulator.issuesTruncated());
        outputs.put("errors", accumulator.issues);
        if (!fragmentSource.isEmpty()) {
            outputs.put("fragments", fragmentSource);
        }

        var summary = "MT101_VALIDATE ruleSet=" + ruleSet
                + " messages=" + accumulator.totalMessages
                + " invalid=" + accumulator.invalidMessages
                + " issues=" + accumulator.issueCount;

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

    private void persistIssues(IssueSink issueSink, List<ValidationIssue> issues) {
        if (issues == null || issues.isEmpty()) {
            return;
        }
        var issueRows = new ArrayList<IssueRow>(issues.size());
        for (var issue : issues) {
            issueRows.add(new IssueRow(issue, null, null, null));
        }
        persistIssueRows(issueSink, issueRows);
    }

    private IssueRow issueRow(Map<String, Object> fragmentSource,
                              Mt101Message message,
                              ValidationIssue issue) {
        var sequenceA = message.sequenceA();
        return new IssueRow(
                issue,
                stringValue(fragmentSource.get("fragmentSetId"), null),
                sequenceA == null ? null : sequenceA.sendersReference(),
                sequenceA == null ? null : sequenceA.messageIndex());
    }

    private void persistIssueRows(IssueSink issueSink, List<IssueRow> issues) {
        if (!issueSink.enabled() || issues == null || issues.isEmpty()) {
            return;
        }
        var dataSource = resolveDataSource(issueSink.connectionRef());
        if (dataSource == null) {
            return;
        }
        var rows = new ArrayList<Mt101ValidationIssueRepository.IssueRow>(issues.size());
        for (var row : issues) {
            var issue = row.issue();
            rows.add(new Mt101ValidationIssueRepository.IssueRow(
                    stringValue(issue.code(), "UNKNOWN"),
                    stringValue(issue.ruleSet(), "unknown"),
                    severityCode(issue.severity()),
                    issueMessage(issue),
                    row.fragmentSetId(),
                    row.sendersReference(),
                    row.fragmentIndex()));
        }
        try {
            issueRepository.insertIssues(dataSource, issueSink.table(), rows);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot persist MT101 validation issues", error);
        }
    }

    private record IssueRow(ValidationIssue issue,
                            String fragmentSetId,
                            String sendersReference,
                            Integer fragmentIndex) {
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank() || connectionPoolManager == null) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }

    private String severityCode(ValidationIssue.Severity severity) {
        if (severity == ValidationIssue.Severity.WARNING) {
            return "W";
        }
        if (severity == ValidationIssue.Severity.INFO) {
            return "I";
        }
        return "E";
    }

    private String issueMessage(ValidationIssue issue) {
        if (issue.transactionReference() == null || issue.transactionReference().isBlank()) {
            return issue.message();
        }
        return "[transactionReference=" + issue.transactionReference() + "] " + issue.message();
    }

    /** Acumula resultados por mensaje sin retener los mensajes en memoria. */
    private static final class ValidationAccumulator {
        int totalMessages;
        int invalidMessages;
        int issueCount;
        private final int maxIssuesInOutput;
        final List<ValidationIssue> issues = new ArrayList<>();
        final EnumMap<ValidationIssue.Severity, Integer> bySeverity =
                new EnumMap<>(ValidationIssue.Severity.class);

        ValidationAccumulator(int maxIssuesInOutput) {
            this.maxIssuesInOutput = Math.max(maxIssuesInOutput, 0);
            bySeverity.put(ValidationIssue.Severity.ERROR, 0);
            bySeverity.put(ValidationIssue.Severity.WARNING, 0);
            bySeverity.put(ValidationIssue.Severity.INFO, 0);
        }

        boolean add(List<ValidationIssue> messageIssues, ValidationIssue.Severity failOn) {
            totalMessages++;
            issueCount += messageIssues.size();
            for (var issue : messageIssues) {
                bySeverity.merge(issue.severity(), 1, Integer::sum);
                if (issues.size() < maxIssuesInOutput) {
                    issues.add(issue);
                }
            }
            var blocking = messageIssues.stream().anyMatch(issue -> issue.severity().reaches(failOn));
            if (blocking) {
                invalidMessages++;
            }
            return blocking;
        }

        boolean issuesTruncated() {
            return issueCount > issues.size();
        }

        Map<String, Integer> bySeverity() {
            var counts = new TreeMap<String, Integer>();
            bySeverity.forEach((severity, count) -> counts.put(severity.name(), count));
            return counts;
        }
    }

    private record IssueSink(boolean enabled, String connectionRef, String table) {
        static IssueSink disabled() {
            return new IssueSink(false, null, DEFAULT_ISSUE_TABLE);
        }

        static IssueSink from(Object raw) {
            if (raw == null || String.valueOf(raw).isBlank()) {
                return disabled();
            }
            if (raw instanceof Map<?, ?> map) {
                var table = stringValue(map.get("table"), DEFAULT_ISSUE_TABLE);
                return enabled(stringValue(map.get("connectionRef"), null), table);
            }
            var value = String.valueOf(raw).trim();
            if ("false".equalsIgnoreCase(value) || "none".equalsIgnoreCase(value)) {
                return disabled();
            }
            if (value.startsWith("table:")) {
                var parts = value.substring("table:".length()).split(":", 2);
                if (parts.length == 2) {
                    return enabled(parts[0], parts[1]);
                }
                return enabled(null, parts[0]);
            }
            return enabled(null, value);
        }

        private static IssueSink enabled(String connectionRef, String table) {
            var normalizedTable = stringValue(table, DEFAULT_ISSUE_TABLE);
            if (!DEFAULT_ISSUE_TABLE.equals(normalizedTable)) {
                throw new IllegalArgumentException("MT101_VALIDATE only supports publishing issues to "
                        + DEFAULT_ISSUE_TABLE);
            }
            return new IssueSink(true, connectionRef, normalizedTable);
        }
    }

    private static String stringValue(Object raw, String defaultValue) {
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
