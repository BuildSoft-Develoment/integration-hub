package com.integrationhub.auditconsumer;

import com.integrationhub.platform.audit.AuditEnvelope;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;

/**
 * Escribe la trama RECORD en el store frio {@code audit_record_event} (append-only)
 * para trazabilidad E2E por registro. Idempotente ({@code ON CONFLICT(event_id)}).
 *
 * <p>JDBC directo: hoy aterriza en Postgres dedicado; este writer es el punto unico
 * a sustituir por ClickHouse/Elastic/lake sin tocar al consumidor.</p>
 */
@ApplicationScoped
public class AuditRecordWriter {

    private static final String INSERT = """
            insert into audit_record_event
                (event_id, trace_id, record_id, stage, status, process_execution_id, task_definition_id, message, payload_json, event_ts)
            values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            on conflict (event_id) do nothing
            """;

    private final DataSource dataSource;

    @Inject
    public AuditRecordWriter(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public void insertRecordEvent(AuditEnvelope envelope) {
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
            statement.setTimestamp(10, envelope.timestamp() == null
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
