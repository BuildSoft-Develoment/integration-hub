package com.integrationhub.platform.repository.payments.swift;

import jakarta.enterprise.context.ApplicationScoped;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Types;
import java.util.List;

/** Repository JDBC para confirmaciones MT101. */
@ApplicationScoped
public class Mt101ConfirmationRepository {

    public void insertConfirmations(Connection connection,
                                    String table,
                                    List<ConfirmationRow> rows) throws SQLException {
        if (rows == null || rows.isEmpty()) {
            return;
        }
        var safeTable = sanitize(table);
        var sql = "insert into " + safeTable
                + " (archive_id, confirmation_type, gateway_reference, confirmed_status, raw_payload)"
                + " values (?, ?, ?, ?, ?)";
        try (var statement = connection.prepareStatement(sql)) {
            for (var row : rows) {
                if (row.archiveId() == null) {
                    statement.setNull(1, Types.BIGINT);
                } else {
                    statement.setLong(1, row.archiveId());
                }
                statement.setString(2, row.confirmationType());
                statement.setString(3, row.gatewayReference());
                statement.setString(4, row.confirmedStatus());
                statement.setString(5, row.rawPayload());
                statement.addBatch();
            }
            statement.executeBatch();
        }
    }

    private String sanitize(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new IllegalArgumentException("Confirmation table identifier cannot be blank");
        }
        if (!identifier.matches("[a-zA-Z_][a-zA-Z0-9_]*(\\.[a-zA-Z_][a-zA-Z0-9_]*)?")) {
            throw new IllegalArgumentException("Unsafe confirmation table identifier: " + identifier);
        }
        return identifier;
    }

    public record ConfirmationRow(Long archiveId,
                                  String confirmationType,
                                  String gatewayReference,
                                  String confirmedStatus,
                                  String rawPayload) {
    }
}
