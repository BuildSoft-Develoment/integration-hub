package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.audit.AuditLevel;
import com.integrationhub.platform.repository.payments.swift.Mt101ReconciliationRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101RebuildRepository;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.service.execution.RecordAuditEmitter;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Task provider {@code MT101_RECONCILE}: cruza la tabla de mensajes enviados
 * ({@code mt101_archive}) contra la de confirmaciones recibidas
 * ({@code mt101_confirmation}) en una ventana temporal, y publica excepciones a
 * {@code mt101_reconciliation_exception}.
 *
 * <p>Tres tipos de excepcion:</p>
 * <ul>
 *   <li>{@code SENT_WITHOUT_CONFIRM}: archivo sin confirmacion recibida.</li>
 *   <li>{@code CONFIRM_WITHOUT_SENT}: confirmacion sin archivo emisor.</li>
 *   <li>{@code AMOUNT_MISMATCH}: ambos existen pero descalce de monto/moneda.</li>
 * </ul>
 *
 * <p>{@code executionMode} esperado: {@code once} (tarea programada diariamente,
 * tipicamente por spec 006 scheduler).</p>
 *
 * <p><b>Configuracion</b>:</p>
 * <pre>{@code
 * {
 *   "connectionRef": "12",
 *   "sentTable": "mt101_archive",
 *   "confirmationTable": "mt101_confirmation",
 *   "matchKeys": ["senders_reference"],      // misma columna en ambas tablas
 *   "matchKeys": ["id=archive_id"],          // columna archivo = columna confirmacion
 *   "asOfDate": "${today}",
 *   "lookbackDays": 5,
 *   "publishExceptionsTo": "table:12:mt101_reconciliation_exception"
 * }
 * }</pre>
 *
 * @trace spec 008-mensajeria-pagos RF-006, T-014
 * @trace ADR-009
 */
@ApplicationScoped
public class Mt101ReconcileTaskProvider implements TaskProvider {

    private static final String DEFAULT_SENT_TABLE = "mt101_archive";
    private static final String DEFAULT_CONFIRMATION_TABLE = "mt101_confirmation";
    private static final String DEFAULT_EXCEPTION_TABLE = "mt101_reconciliation_exception";
    private static final int DEFAULT_LOOKBACK_DAYS = 5;

    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final Mt101ArchiveStatusUpdater archiveStatusUpdater;
    private final Mt101ReconciliationRepository reconciliationRepository;
    private final RecordAuditEmitter recordAuditEmitter;
    private final Mt101RebuildRepository rebuildRepository = new Mt101RebuildRepository();

    @Inject
    public Mt101ReconcileTaskProvider(DataSource defaultDataSource,
                                      ConnectionPoolManager connectionPoolManager,
                                      Mt101ArchiveStatusUpdater archiveStatusUpdater,
                                      Mt101ReconciliationRepository reconciliationRepository,
                                      RecordAuditEmitter recordAuditEmitter) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.archiveStatusUpdater = archiveStatusUpdater;
        this.reconciliationRepository = reconciliationRepository;
        this.recordAuditEmitter = recordAuditEmitter;
    }

    public Mt101ReconcileTaskProvider(DataSource defaultDataSource,
                                      ConnectionPoolManager connectionPoolManager,
                                      Mt101ArchiveStatusUpdater archiveStatusUpdater,
                                      Mt101ReconciliationRepository reconciliationRepository) {
        this(defaultDataSource, connectionPoolManager, archiveStatusUpdater, reconciliationRepository, null);
    }

    public Mt101ReconcileTaskProvider(DataSource defaultDataSource,
                                      ConnectionPoolManager connectionPoolManager,
                                      Mt101ArchiveStatusUpdater archiveStatusUpdater) {
        this(defaultDataSource, connectionPoolManager, archiveStatusUpdater,
                new Mt101ReconciliationRepository());
    }

    public Mt101ReconcileTaskProvider(DataSource defaultDataSource,
                                      ConnectionPoolManager connectionPoolManager) {
        this(defaultDataSource, connectionPoolManager,
                new Mt101ArchiveStatusUpdater(defaultDataSource, connectionPoolManager));
    }

    @Override
    public String type() {
        return "MT101_RECONCILE";
    }

    @Override
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        var correctiveSource = correctivePaySource(context, configuration);
        var connectionRef = stringValue(configuration.get("connectionRef"),
                stringValue(correctiveSource.get("connectionRef"), null));
        var dataSource = resolveDataSource(connectionRef);
        var sentTable = sanitize(stringValue(configuration.get("sentTable"), DEFAULT_SENT_TABLE));
        var confirmationTable = sanitize(stringValue(configuration.get("confirmationTable"), DEFAULT_CONFIRMATION_TABLE));
        var matchKeys = parseMatchKeys(configuration.get("matchKeys"));
        var asOfDate = parseDate(configuration.get("asOfDate"), LocalDate.now());
        var lookbackDays = intValue(configuration.get("lookbackDays"), DEFAULT_LOOKBACK_DAYS);
        var fromDate = asOfDate.minusDays(lookbackDays);
        var exceptionTable = parseExceptionTable(configuration.get("publishExceptionsTo"));

        var exceptions = new ArrayList<Map<String, Object>>();
        int matchedCount;
        int unmatchedSentCount;
        int unmatchedConfirmCount;
        int amountMismatchCount = 0;
        List<String> scope;

        try (Connection connection = dataSource.getConnection()) {
            scope = correctiveScope(dataSource, correctiveSource);
            var result = reconciliationRepository.reconcile(connection, sentTable, confirmationTable,
                    parseRepositoryJoinSpecs(matchKeys), fromDate, asOfDate, exceptionTable, asOfDate, scope);
            matchedCount = result.matchedCount();
            unmatchedSentCount = result.unmatchedSentCount();
            unmatchedConfirmCount = result.unmatchedConfirmCount();
            exceptions.addAll(result.exceptions());
            // H5: marca RECONCILED las filas conciliadas en la tabla de archivo
            // (cierre del estado de negocio). Desactivable con archiveStatusSync=false.
            if (boolValue(configuration.get("archiveStatusSync"), true)) {
                try {
                    archiveStatusUpdater.markReconciled(connection, sentTable, confirmationTable,
                            parseJoinSpecs(matchKeys), fromDate, asOfDate, scope);
                } catch (SQLException reconcileError) {
                    // 42703 = columna inexistente (sentTable sin status/updated_at,
                    // e.g. tabla custom): la conciliacion-reporte sigue valida.
                    if (!"42703".equals(reconcileError.getSQLState())) {
                        throw reconcileError;
                    }
                }
            }
        } catch (SQLException error) {
            throw new IllegalStateException("MT101_RECONCILE failed: " + error.getMessage(), error);
        }

        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("matchedCount", matchedCount);
        outputs.put("unmatchedSentCount", unmatchedSentCount);
        outputs.put("unmatchedConfirmCount", unmatchedConfirmCount);
        outputs.put("amountMismatchCount", amountMismatchCount);
        outputs.put("asOfDate", asOfDate.toString());
        outputs.put("lookbackDays", lookbackDays);
        outputs.put("scopedCount", scope.size());
        outputs.put("records", exceptions);

        emitRecordAudit(exceptions.stream().map(exception -> reconciliationEnvelope(context, exception)).toList());

        var summary = "MT101_RECONCILE asOf=" + asOfDate
                + " matched=" + matchedCount
                + " unmatchedSent=" + unmatchedSentCount
                + " unmatchedConfirm=" + unmatchedConfirmCount;
        // No marcamos failure por excepciones; son hallazgos esperados.
        return TaskResult.success(summary, outputs);
    }

    private List<String> correctiveScope(DataSource dataSource, Map<String, Object> source) throws SQLException {
        var runId = stringValue(source.get("correctivePayRunId"), null);
        if (runId == null) {
            return List.of();
        }
        return rebuildRepository.correctivePaySentReferences(dataSource, runId);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> correctivePaySource(TaskContext context, Map<String, Object> configuration) {
        var rawTaskOutputs = context.attributes().get("taskOutputs");
        if (!(rawTaskOutputs instanceof Map<?, ?> taskOutputs) || taskOutputs.isEmpty()
                || !(configuration.get("input") instanceof Map<?, ?> rawInput)) {
            return Map.of();
        }
        var sourceTaskRef = stringValue(((Map<String, Object>) rawInput).get("sourceTaskRef"), "");
        if (sourceTaskRef.isBlank()) {
            return Map.of();
        }
        var sourceOutput = stringValue(((Map<String, Object>) rawInput).get("sourceOutput"), "records");
        var raw = taskOutputs.get(sourceTaskRef + "." + sourceOutput);
        if (!(raw instanceof Map<?, ?> rawMap) || !rawMap.containsKey("correctivePayRunId")) {
            return Map.of();
        }
        var source = new LinkedHashMap<String, Object>();
        rawMap.forEach((key, value) -> source.put(String.valueOf(key), value));
        return source;
    }

    private boolean boolValue(Object raw, boolean defaultValue) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return defaultValue;
        }
        return Boolean.parseBoolean(String.valueOf(raw));
    }

    private List<Mt101ArchiveStatusUpdater.JoinSpec> parseJoinSpecs(List<String> rawKeys) {
        var result = new ArrayList<Mt101ArchiveStatusUpdater.JoinSpec>(rawKeys.size());
        for (var rawKey : rawKeys) {
            result.add(parseJoinSpec(rawKey));
        }
        return result;
    }

    private Mt101ArchiveStatusUpdater.JoinSpec parseJoinSpec(String rawKey) {
        var key = rawKey == null ? "" : rawKey.trim();
        if (key.contains("=")) {
            var parts = key.split("=", 2);
            return new Mt101ArchiveStatusUpdater.JoinSpec(sanitize(parts[0].trim()), sanitize(parts[1].trim()));
        }
        var column = sanitize(key);
        return new Mt101ArchiveStatusUpdater.JoinSpec(column, column);
    }

    private List<Mt101ReconciliationRepository.JoinSpec> parseRepositoryJoinSpecs(List<String> rawKeys) {
        var result = new ArrayList<Mt101ReconciliationRepository.JoinSpec>(rawKeys.size());
        for (var rawKey : rawKeys) {
            var spec = parseJoinSpec(rawKey);
            result.add(new Mt101ReconciliationRepository.JoinSpec(spec.leftColumn(), spec.rightColumn()));
        }
        return result;
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank() || connectionPoolManager == null) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }

    private List<String> parseMatchKeys(Object raw) {
        if (raw instanceof List<?> rawList && !rawList.isEmpty()) {
            var keys = new ArrayList<String>(rawList.size());
            for (var item : rawList) {
                if (item == null) continue;
                var key = String.valueOf(item).trim();
                if (!key.isEmpty()) keys.add(key);
            }
            if (!keys.isEmpty()) return keys;
        }
        return List.of("senders_reference");
    }

    private String parseExceptionTable(Object raw) {
        if (raw == null) {
            return DEFAULT_EXCEPTION_TABLE;
        }
        var value = String.valueOf(raw).trim();
        if (value.isEmpty()) {
            return DEFAULT_EXCEPTION_TABLE;
        }
        if (value.startsWith("table:")) {
            var parts = value.substring("table:".length()).split(":");
            return parts.length >= 2 ? sanitize(parts[1]) : sanitize(parts[0]);
        }
        return sanitize(value);
    }

    private LocalDate parseDate(Object raw, LocalDate defaultValue) {
        if (raw == null) {
            return defaultValue;
        }
        var value = String.valueOf(raw).trim();
        if (value.isEmpty() || "${today}".equals(value)) {
            return defaultValue;
        }
        return LocalDate.parse(value);
    }

    private String sanitize(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new IllegalArgumentException("Identifier cannot be blank");
        }
        if (!identifier.matches("[a-zA-Z_][a-zA-Z0-9_]*(\\.[a-zA-Z_][a-zA-Z0-9_]*)?")) {
            throw new IllegalArgumentException("Unsafe identifier: " + identifier);
        }
        return identifier;
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

    private AuditEnvelope reconciliationEnvelope(TaskContext context, Map<String, Object> exception) {
        var reference = exception.get("sendersReference") == null ? null : String.valueOf(exception.get("sendersReference"));
        var archiveId = exception.get("archiveId") instanceof Number number ? number.longValue() : null;
        var type = String.valueOf(exception.getOrDefault("exceptionType", "RECONCILIATION_EXCEPTION"));
        return new AuditEnvelope(
                UUID.randomUUID().toString(),
                context.processExecutionId() == null ? null : "exec-" + context.processExecutionId(),
                reference,
                AuditLevel.RECORD,
                "PAYMENT_RECONCILIATION_EXCEPTION",
                "UNMATCHED",
                context.processExecutionId(),
                context.taskDefinitionId(),
                type,
                null,
                Map.of("exceptionType", type),
                "SWIFT",
                "MT101",
                null,
                null,
                null,
                null,
                null,
                reference,
                null,
                null,
                archiveId,
                null,
                Instant.now(),
                AuditEnvelope.CURRENT_SCHEMA_VERSION);
    }

    private void emitRecordAudit(List<AuditEnvelope> envelopes) {
        if (recordAuditEmitter != null && envelopes != null && !envelopes.isEmpty()) {
            recordAuditEmitter.emitRecords(envelopes);
        }
    }
}
