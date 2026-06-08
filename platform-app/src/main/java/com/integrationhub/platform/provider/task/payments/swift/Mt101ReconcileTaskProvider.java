package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Types;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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
 *   "matchKeys": ["senders_reference"],
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

    public Mt101ReconcileTaskProvider(DataSource defaultDataSource,
                                      ConnectionPoolManager connectionPoolManager) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
    }

    @Override
    public String type() {
        return "MT101_RECONCILE";
    }

    @Override
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        var connectionRef = stringValue(configuration.get("connectionRef"), null);
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

        try (Connection connection = dataSource.getConnection()) {
            // SENT_WITHOUT_CONFIRM: archive sin confirmacion en la ventana.
            unmatchedSentCount = collectUnmatchedSent(connection, sentTable, confirmationTable,
                    matchKeys, fromDate, asOfDate, exceptions);
            // CONFIRM_WITHOUT_SENT: confirmacion sin archive emisor en la ventana.
            unmatchedConfirmCount = collectUnmatchedConfirm(connection, sentTable, confirmationTable,
                    matchKeys, fromDate, asOfDate, exceptions);
            // AMOUNT_MISMATCH si la tabla de confirmation expone un monto confirmado.
            // Para slice 2.1 lo omitimos (slice 2.2 lo cubre cuando exista columna confirmed_amount).
            matchedCount = countMatched(connection, sentTable, confirmationTable, matchKeys,
                    fromDate, asOfDate);
            // Persistencia opcional de las excepciones.
            if (exceptionTable != null && !exceptions.isEmpty()) {
                persistExceptions(connection, exceptionTable, asOfDate, exceptions);
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
        outputs.put("records", exceptions);

        var summary = "MT101_RECONCILE asOf=" + asOfDate
                + " matched=" + matchedCount
                + " unmatchedSent=" + unmatchedSentCount
                + " unmatchedConfirm=" + unmatchedConfirmCount;
        // No marcamos failure por excepciones; son hallazgos esperados.
        return TaskResult.success(summary, outputs);
    }

    private int collectUnmatchedSent(Connection connection, String sentTable, String confirmationTable,
                                     List<String> matchKeys, LocalDate from, LocalDate to,
                                     List<Map<String, Object>> exceptions) throws SQLException {
        var joinClause = buildJoinClause("s", "c", matchKeys);
        var sql = "select s.id, s.senders_reference from " + sentTable + " s"
                + " left join " + confirmationTable + " c on " + joinClause
                + " where s.created_at::date between ? and ?"
                + " and c.id is null";
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, from);
            statement.setObject(2, to);
            try (var rs = statement.executeQuery()) {
                int count = 0;
                while (rs.next()) {
                    var entry = new LinkedHashMap<String, Object>();
                    entry.put("exceptionType", "SENT_WITHOUT_CONFIRM");
                    entry.put("archiveId", rs.getLong("id"));
                    entry.put("confirmationId", null);
                    entry.put("sendersReference", rs.getString("senders_reference"));
                    exceptions.add(entry);
                    count++;
                }
                return count;
            }
        }
    }

    private int collectUnmatchedConfirm(Connection connection, String sentTable, String confirmationTable,
                                        List<String> matchKeys, LocalDate from, LocalDate to,
                                        List<Map<String, Object>> exceptions) throws SQLException {
        var joinClause = buildJoinClause("c", "s", matchKeys);
        var sql = "select c.id from " + confirmationTable + " c"
                + " left join " + sentTable + " s on " + joinClause
                + " where c.received_at::date between ? and ?"
                + " and s.id is null";
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, from);
            statement.setObject(2, to);
            try (var rs = statement.executeQuery()) {
                int count = 0;
                while (rs.next()) {
                    var entry = new LinkedHashMap<String, Object>();
                    entry.put("exceptionType", "CONFIRM_WITHOUT_SENT");
                    entry.put("archiveId", null);
                    entry.put("confirmationId", rs.getLong("id"));
                    exceptions.add(entry);
                    count++;
                }
                return count;
            }
        }
    }

    private int countMatched(Connection connection, String sentTable, String confirmationTable,
                             List<String> matchKeys, LocalDate from, LocalDate to) throws SQLException {
        var joinClause = buildJoinClause("s", "c", matchKeys);
        var sql = "select count(*) from " + sentTable + " s"
                + " inner join " + confirmationTable + " c on " + joinClause
                + " where s.created_at::date between ? and ?";
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, from);
            statement.setObject(2, to);
            try (var rs = statement.executeQuery()) {
                rs.next();
                return rs.getInt(1);
            }
        }
    }

    private void persistExceptions(Connection connection, String table, LocalDate asOfDate,
                                   List<Map<String, Object>> exceptions) throws SQLException {
        var sql = "insert into " + table
                + " (as_of_date, archive_id, confirmation_id, exception_type, details)"
                + " values (?, ?, ?, ?, ?)";
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            for (var ex : exceptions) {
                statement.setObject(1, asOfDate);
                if (ex.get("archiveId") == null) {
                    statement.setNull(2, Types.BIGINT);
                } else {
                    statement.setLong(2, ((Number) ex.get("archiveId")).longValue());
                }
                if (ex.get("confirmationId") == null) {
                    statement.setNull(3, Types.BIGINT);
                } else {
                    statement.setLong(3, ((Number) ex.get("confirmationId")).longValue());
                }
                statement.setString(4, (String) ex.get("exceptionType"));
                statement.setString(5, summarizeDetails(ex));
                statement.addBatch();
            }
            statement.executeBatch();
        }
    }

    private String summarizeDetails(Map<String, Object> exception) {
        var sb = new StringBuilder();
        exception.forEach((k, v) -> {
            if ("exceptionType".equals(k)) return;
            if (v == null) return;
            if (sb.length() > 0) sb.append("; ");
            sb.append(k).append('=').append(v);
        });
        return sb.toString();
    }

    private String buildJoinClause(String leftAlias, String rightAlias, List<String> keys) {
        var clauses = new ArrayList<String>(keys.size());
        for (var key : keys) {
            var col = sanitize(key);
            clauses.add(leftAlias + "." + col + " = " + rightAlias + "." + col);
        }
        return String.join(" and ", clauses);
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
}
