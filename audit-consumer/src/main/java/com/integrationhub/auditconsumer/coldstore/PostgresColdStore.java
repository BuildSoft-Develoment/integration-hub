package com.integrationhub.auditconsumer.coldstore;

import com.integrationhub.platform.audit.AuditEnvelope;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;

/**
 * Store frio sobre Postgres ({@code audit_record_event}, append-only). Idempotente
 * ({@code ON CONFLICT(event_id)}) para la entrega at-least-once. Backend por defecto.
 */
public final class PostgresColdStore implements ColdStore {

    private static final String INSERT = """
            insert into audit_record_event
                (event_id, trace_id, record_id, stage, status, process_execution_id, task_definition_id,
                 message, payload_json, standard, message_type, source_file_name, source_file_hash,
                 record_number, business_key, business_key_hash, payment_reference, transaction_reference,
                 uetr, archive_id, gateway_reference, event_ts)
            values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            on conflict (event_id) do nothing
            """;

    private final DataSource dataSource;

    public PostgresColdStore(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void write(AuditEnvelope envelope) {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(INSERT)) {
            statement.setString(1, envelope.eventId());
            statement.setString(2, envelope.traceId());
            statement.setString(3, envelope.recordId());
            statement.setString(4, envelope.stage());
            statement.setString(5, envelope.status());
            setNullableLong(statement, 6, envelope.processExecutionId());
            setNullableLong(statement, 7, envelope.taskDefinitionId());
            statement.setString(8, envelope.message());
            statement.setString(9, envelope.payloadJson());
            statement.setString(10, envelope.standard());
            statement.setString(11, envelope.messageType());
            statement.setString(12, envelope.sourceFileName());
            statement.setString(13, envelope.sourceFileHash());
            setNullableLong(statement, 14, envelope.recordNumber());
            statement.setString(15, envelope.businessKey());
            statement.setString(16, envelope.businessKeyHash());
            statement.setString(17, envelope.paymentReference());
            statement.setString(18, envelope.transactionReference());
            statement.setString(19, envelope.uetr());
            setNullableLong(statement, 20, envelope.archiveId());
            statement.setString(21, envelope.gatewayReference());
            statement.setTimestamp(22, envelope.timestamp() == null
                    ? new Timestamp(System.currentTimeMillis())
                    : Timestamp.from(envelope.timestamp()));
            statement.executeUpdate();
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot persist audit_record_event for " + envelope.eventId(), error);
        }
    }

    private void setNullableLong(PreparedStatement statement, int index, Long value) throws SQLException {
        if (value == null) {
            statement.setNull(index, Types.BIGINT);
        } else {
            statement.setLong(index, value);
        }
    }
}
