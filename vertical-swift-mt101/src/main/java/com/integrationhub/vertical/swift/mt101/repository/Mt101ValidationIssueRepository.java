package com.integrationhub.vertical.swift.mt101.repository;

import jakarta.enterprise.context.ApplicationScoped;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.sql.Types;
import java.util.List;

/** Repository JDBC para issues de validacion MT101. */
@ApplicationScoped
public class Mt101ValidationIssueRepository {

    public void insertIssues(DataSource dataSource, String table, List<IssueRow> issues) throws SQLException {
        if (issues == null || issues.isEmpty()) {
            return;
        }
        var safeTable = sanitize(table);
        var sql = "insert into " + safeTable
                + " (archive_id, transaction_id, rule_code, rule_set, severity, message, "
                + "fragment_set_id, senders_reference, fragment_index, transaction_reference) "
                + "values (null, null, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            for (var row : issues) {
                statement.setString(1, row.ruleCode());
                statement.setString(2, row.ruleSet());
                statement.setString(3, row.severity());
                statement.setString(4, row.message());
                statement.setString(5, row.fragmentSetId());
                statement.setString(6, row.sendersReference());
                if (row.fragmentIndex() == null) {
                    statement.setNull(7, Types.INTEGER);
                } else {
                    statement.setInt(7, row.fragmentIndex());
                }
                statement.setString(8, row.transactionReference());
                statement.addBatch();
            }
            statement.executeBatch();
        }
    }

    /** Lee los issues persistidos de un set (para construir la cuarentena por fila). */
    public List<IssueRecord> findBySet(DataSource dataSource, String table, String fragmentSetId) throws SQLException {
        var safeTable = sanitize(table);
        var sql = "select rule_code, rule_set, severity, message, senders_reference, transaction_reference "
                + "from " + safeTable + " where fragment_set_id = ?";
        var result = new java.util.ArrayList<IssueRecord>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, fragmentSetId);
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    result.add(new IssueRecord(
                            rs.getString("rule_code"),
                            rs.getString("rule_set"),
                            rs.getString("severity"),
                            rs.getString("message"),
                            rs.getString("senders_reference"),
                            rs.getString("transaction_reference")));
                }
            }
        }
        return result;
    }

    /** Lee issues por keyset para construir cuarentena de sets grandes sin cargar todo. */
    public List<IssueRecord> findBySetPage(DataSource dataSource,
                                           String table,
                                           String fragmentSetId,
                                           long afterId,
                                           int limit) throws SQLException {
        var safeTable = sanitize(table);
        var sql = "select id, rule_code, rule_set, severity, message, senders_reference, transaction_reference "
                + "from " + safeTable
                + " where fragment_set_id = ? and id > ? order by id asc limit ?";
        var result = new java.util.ArrayList<IssueRecord>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, fragmentSetId);
            statement.setLong(2, Math.max(afterId, 0L));
            statement.setInt(3, Math.max(limit, 1));
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    result.add(new IssueRecord(
                            rs.getLong("id"),
                            rs.getString("rule_code"),
                            rs.getString("rule_set"),
                            rs.getString("severity"),
                            rs.getString("message"),
                            rs.getString("senders_reference"),
                            rs.getString("transaction_reference")));
                }
            }
        }
        return result;
    }

    public record IssueRecord(Long id,
                              String ruleCode,
                              String ruleSet,
                              String severity,
                              String message,
                              String sendersReference,
                              String transactionReference) {
        public IssueRecord(String ruleCode,
                           String ruleSet,
                           String severity,
                           String message,
                           String sendersReference,
                           String transactionReference) {
            this(null, ruleCode, ruleSet, severity, message, sendersReference, transactionReference);
        }
    }

    private String sanitize(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new IllegalArgumentException("Issue table identifier cannot be blank");
        }
        if (!identifier.matches("[a-zA-Z_][a-zA-Z0-9_]*(\\.[a-zA-Z_][a-zA-Z0-9_]*)?")) {
            throw new IllegalArgumentException("Unsafe issue table identifier: " + identifier);
        }
        return identifier;
    }

    public record IssueRow(String ruleCode,
                           String ruleSet,
                           String severity,
                           String message,
                           String fragmentSetId,
                           String sendersReference,
                           Integer fragmentIndex,
                           String transactionReference) {
    }
}
