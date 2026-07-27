package com.integrationhub.vertical.swift.mt101.repository;

import jakarta.enterprise.context.ApplicationScoped;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Types;

/** Evidencia durable local de correcciones manuales sobre staging MT101. */
@ApplicationScoped
public class Mt101StagingCorrectionRepository {

    public void insert(Connection connection, CorrectionAuditRow row) throws SQLException {
        var sql = """
                insert into mt101_staging_correction
                    (fragment_set_id, process_execution_id, source_file_hash, source_record_number,
                     record_index, staging_id, old_payload_hash, new_payload_hash, changed_fields,
                     corrected_by, correction_reason, ticket_ref, old_version, new_version)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;
        try (var statement = connection.prepareStatement(sql)) {
            statement.setString(1, row.fragmentSetId());
            statement.setLong(2, row.processExecutionId());
            statement.setString(3, row.sourceFileHash());
            statement.setLong(4, row.sourceRecordNumber());
            statement.setLong(5, row.recordIndex());
            if (row.stagingId() == null) statement.setNull(6, Types.BIGINT);
            else statement.setLong(6, row.stagingId());
            statement.setString(7, row.oldPayloadHash());
            statement.setString(8, row.newPayloadHash());
            statement.setString(9, row.changedFields());
            statement.setString(10, row.correctedBy());
            statement.setString(11, row.correctionReason());
            statement.setString(12, row.ticketRef());
            statement.setLong(13, row.oldVersion());
            statement.setLong(14, row.newVersion());
            statement.executeUpdate();
        }
    }

    public record CorrectionAuditRow(
            String fragmentSetId,
            long processExecutionId,
            String sourceFileHash,
            long sourceRecordNumber,
            long recordIndex,
            Long stagingId,
            String oldPayloadHash,
            String newPayloadHash,
            String changedFields,
            String correctedBy,
            String correctionReason,
            String ticketRef,
            long oldVersion,
            long newVersion
    ) {
    }
}
