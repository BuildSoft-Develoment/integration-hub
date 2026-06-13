package com.integrationhub.platform.repository;

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
                + "fragment_set_id, senders_reference, fragment_index) "
                + "values (null, null, ?, ?, ?, ?, ?, ?, ?)";
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
                statement.addBatch();
            }
            statement.executeBatch();
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
                           Integer fragmentIndex) {
    }
}
