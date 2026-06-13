package com.integrationhub.platform.repository.payments.swift;

import jakarta.enterprise.context.ApplicationScoped;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Types;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Repository JDBC para conciliacion MT101. */
@ApplicationScoped
public class Mt101ReconciliationRepository {

    public ReconciliationResult reconcile(Connection connection,
                                          String sentTable,
                                          String confirmationTable,
                                          List<JoinSpec> matchKeys,
                                          LocalDate from,
                                          LocalDate to,
                                          String exceptionTable,
                                          LocalDate asOfDate) throws SQLException {
        var safeSentTable = sanitize(sentTable);
        var safeConfirmationTable = sanitize(confirmationTable);
        var safeExceptionTable = exceptionTable == null ? null : sanitize(exceptionTable);
        var exceptions = new ArrayList<Map<String, Object>>();
        var unmatchedSent = collectUnmatchedSent(connection, safeSentTable, safeConfirmationTable,
                matchKeys, from, to, exceptions);
        var unmatchedConfirm = collectUnmatchedConfirm(connection, safeSentTable, safeConfirmationTable,
                matchKeys, from, to, exceptions);
        var matched = countMatched(connection, safeSentTable, safeConfirmationTable, matchKeys, from, to);
        if (safeExceptionTable != null && !exceptions.isEmpty()) {
            persistExceptions(connection, safeExceptionTable, asOfDate, exceptions);
        }
        return new ReconciliationResult(matched, unmatchedSent, unmatchedConfirm, exceptions);
    }

    private int collectUnmatchedSent(Connection connection,
                                     String sentTable,
                                     String confirmationTable,
                                     List<JoinSpec> matchKeys,
                                     LocalDate from,
                                     LocalDate to,
                                     List<Map<String, Object>> exceptions) throws SQLException {
        var joinClause = buildJoinClause("s", "c", matchKeys);
        var sql = "select s.id, s.senders_reference from " + sentTable + " s"
                + " left join " + confirmationTable + " c on " + joinClause
                + " where s.created_at::date between ? and ?"
                + " and c.id is null";
        try (var statement = connection.prepareStatement(sql)) {
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

    private int collectUnmatchedConfirm(Connection connection,
                                        String sentTable,
                                        String confirmationTable,
                                        List<JoinSpec> matchKeys,
                                        LocalDate from,
                                        LocalDate to,
                                        List<Map<String, Object>> exceptions) throws SQLException {
        var joinClause = buildJoinClause("s", "c", matchKeys);
        var sql = "select c.id from " + confirmationTable + " c"
                + " left join " + sentTable + " s on " + joinClause
                + " where c.received_at::date between ? and ?"
                + " and s.id is null";
        try (var statement = connection.prepareStatement(sql)) {
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

    private int countMatched(Connection connection,
                             String sentTable,
                             String confirmationTable,
                             List<JoinSpec> matchKeys,
                             LocalDate from,
                             LocalDate to) throws SQLException {
        var joinClause = buildJoinClause("s", "c", matchKeys);
        var sql = "select count(*) from " + sentTable + " s"
                + " inner join " + confirmationTable + " c on " + joinClause
                + " where s.created_at::date between ? and ?";
        try (var statement = connection.prepareStatement(sql)) {
            statement.setObject(1, from);
            statement.setObject(2, to);
            try (var rs = statement.executeQuery()) {
                rs.next();
                return rs.getInt(1);
            }
        }
    }

    private void persistExceptions(Connection connection,
                                   String table,
                                   LocalDate asOfDate,
                                   List<Map<String, Object>> exceptions) throws SQLException {
        var sql = "insert into " + table
                + " (as_of_date, archive_id, confirmation_id, exception_type, details)"
                + " values (?, ?, ?, ?, ?)";
        try (var statement = connection.prepareStatement(sql)) {
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
        exception.forEach((key, value) -> {
            if ("exceptionType".equals(key) || value == null) {
                return;
            }
            if (sb.length() > 0) {
                sb.append("; ");
            }
            sb.append(key).append('=').append(value);
        });
        return sb.toString();
    }

    private String buildJoinClause(String leftAlias, String rightAlias, List<JoinSpec> keys) {
        var clauses = new ArrayList<String>(keys.size());
        for (var key : keys) {
            clauses.add(leftAlias + "." + sanitize(key.leftColumn())
                    + " = " + rightAlias + "." + sanitize(key.rightColumn()));
        }
        return String.join(" and ", clauses);
    }

    private String sanitize(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new IllegalArgumentException("Reconciliation identifier cannot be blank");
        }
        if (!identifier.matches("[a-zA-Z_][a-zA-Z0-9_]*(\\.[a-zA-Z_][a-zA-Z0-9_]*)?")) {
            throw new IllegalArgumentException("Unsafe reconciliation identifier: " + identifier);
        }
        return identifier;
    }

    public record JoinSpec(String leftColumn, String rightColumn) {
    }

    public record ReconciliationResult(int matchedCount,
                                       int unmatchedSentCount,
                                       int unmatchedConfirmCount,
                                       List<Map<String, Object>> exceptions) {
    }
}
