package com.integrationhub.platform.repository.payments.swift;

import jakarta.enterprise.context.ApplicationScoped;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.sql.Types;

/** Evidencia durable de reprocesos tecnicos MT101 solicitados desde API/UI. */
@ApplicationScoped
public class Mt101ReprocessAuditRepository {

    public void insert(DataSource dataSource, ReprocessAuditRow row) throws SQLException {
        var sql = """
                insert into mt101_reprocess_audit
                    (action, fragment_set_id, source_file_hash, record_from, record_to, from_status,
                     to_status, affected, actor, reason, ticket_ref)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, row.action());
            statement.setString(2, row.fragmentSetId());
            statement.setString(3, row.sourceFileHash());
            if (row.recordFrom() == null) statement.setNull(4, Types.BIGINT);
            else statement.setLong(4, row.recordFrom());
            if (row.recordTo() == null) statement.setNull(5, Types.BIGINT);
            else statement.setLong(5, row.recordTo());
            statement.setString(6, row.fromStatus());
            statement.setString(7, row.toStatus());
            statement.setInt(8, row.affected());
            statement.setString(9, row.actor());
            statement.setString(10, row.reason());
            statement.setString(11, row.ticketRef());
            statement.executeUpdate();
        }
    }

    public record ReprocessAuditRow(
            String action,
            String fragmentSetId,
            String sourceFileHash,
            Long recordFrom,
            Long recordTo,
            String fromStatus,
            String toStatus,
            int affected,
            String actor,
            String reason,
            String ticketRef
    ) {
    }
}
