package com.integrationhub.platform.repository.payments.swift;

import jakarta.enterprise.context.ApplicationScoped;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.sql.Types;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** Repository JDBC de la cola de cuarentena de filas MT101 fallidas. */
@ApplicationScoped
public class Mt101FailedRecordRepository {

    /**
     * Inserta filas en cuarentena de forma idempotente (ON CONFLICT DO NOTHING sobre
     * el indice de dedup). Devuelve cuantas filas nuevas se insertaron.
     */
    public int insertBatch(DataSource dataSource, List<FailedRecordRow> rows) throws SQLException {
        if (rows == null || rows.isEmpty()) {
            return 0;
        }
        var sql = "insert into mt101_failed_record "
                + "(fragment_set_id, senders_reference, transaction_reference, source_file_hash, "
                + " source_record_number, rule_code, rule_set, severity, message) "
                + "values (?, ?, ?, ?, ?, ?, ?, ?, ?) "
                + "on conflict (fragment_set_id, coalesce(senders_reference, ''), "
                + "             coalesce(transaction_reference, ''), coalesce(rule_code, '')) do nothing";
        var inserted = 0;
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            for (var row : rows) {
                statement.setString(1, row.fragmentSetId());
                statement.setString(2, row.sendersReference());
                statement.setString(3, row.transactionReference());
                statement.setString(4, row.sourceFileHash());
                if (row.sourceRecordNumber() == null) statement.setNull(5, Types.BIGINT);
                else statement.setLong(5, row.sourceRecordNumber());
                statement.setString(6, row.ruleCode());
                statement.setString(7, row.ruleSet());
                statement.setString(8, row.severity());
                statement.setString(9, row.message());
                inserted += statement.executeUpdate();
            }
        }
        return inserted;
    }

    public List<FailedRecord> findBySet(DataSource dataSource,
                                        String fragmentSetId,
                                        String status,
                                        int limit) throws SQLException {
        var sql = new StringBuilder("""
                select id, fragment_set_id, senders_reference, transaction_reference, source_file_hash,
                       source_record_number, rule_code, rule_set, severity, message, status, created_at, resolved_at
                  from mt101_failed_record
                 where fragment_set_id = ?
                """);
        if (status != null && !status.isBlank()) {
            sql.append(" and status = ?");
        }
        sql.append(" order by source_record_number asc nulls last, id asc limit ?");

        var result = new ArrayList<FailedRecord>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql.toString())) {
            var parameter = 1;
            statement.setString(parameter++, fragmentSetId);
            if (status != null && !status.isBlank()) {
                statement.setString(parameter++, status);
            }
            statement.setInt(parameter, Math.max(limit, 1));
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    result.add(new FailedRecord(
                            rs.getLong("id"),
                            rs.getString("fragment_set_id"),
                            rs.getString("senders_reference"),
                            rs.getString("transaction_reference"),
                            rs.getString("source_file_hash"),
                            nullableLong(rs, "source_record_number"),
                            rs.getString("rule_code"),
                            rs.getString("rule_set"),
                            rs.getString("severity"),
                            rs.getString("message"),
                            rs.getString("status"),
                            timestamp(rs, "created_at"),
                            timestamp(rs, "resolved_at")));
                }
            }
        }
        return result;
    }

    /** Marca como resueltas (REBUILT/DISCARDED) las filas en cuarentena de un set. */
    public int updateStatusBySet(DataSource dataSource,
                                 String fragmentSetId,
                                 String fromStatus,
                                 String toStatus) throws SQLException {
        var sql = "update mt101_failed_record set status = ?, resolved_at = current_timestamp "
                + "where fragment_set_id = ? and status = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, toStatus);
            statement.setString(2, fragmentSetId);
            statement.setString(3, fromStatus);
            return statement.executeUpdate();
        }
    }

    public record FailedRecordRow(
            String fragmentSetId,
            String sendersReference,
            String transactionReference,
            String sourceFileHash,
            Long sourceRecordNumber,
            String ruleCode,
            String ruleSet,
            String severity,
            String message
    ) {
    }

    public record FailedRecord(
            long id,
            String fragmentSetId,
            String sendersReference,
            String transactionReference,
            String sourceFileHash,
            Long sourceRecordNumber,
            String ruleCode,
            String ruleSet,
            String severity,
            String message,
            String status,
            LocalDateTime createdAt,
            LocalDateTime resolvedAt
    ) {
    }

    private Long nullableLong(java.sql.ResultSet rs, String column) throws SQLException {
        var value = rs.getLong(column);
        return rs.wasNull() ? null : value;
    }

    private LocalDateTime timestamp(java.sql.ResultSet rs, String column) throws SQLException {
        var value = rs.getTimestamp(column);
        return value == null ? null : value.toLocalDateTime();
    }
}
