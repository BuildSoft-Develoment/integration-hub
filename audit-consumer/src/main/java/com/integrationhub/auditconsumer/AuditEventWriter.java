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
 * Registra la trama de auditoria en el read-model {@code audit_event} (Postgres),
 * que la UI de platform-app consulta. Idempotente: {@code ON CONFLICT (event_id)
 * DO NOTHING} absorbe la entrega at-least-once del MQ.
 *
 * <p>Usa JDBC directo (no JPA) para mantener el consumidor liviano e independiente
 * del modelo de dominio de platform-app. El schema lo posee platform-app.</p>
 */
@ApplicationScoped
public class AuditEventWriter {

    private static final String INSERT = """
            insert into audit_event
                (event_id, process_execution_id, task_definition_id, event_type, status, message, payload_json, created_at)
            values (?, ?, ?, ?, ?, ?, ?, ?)
            on conflict (event_id) do nothing
            """;

    private final DataSource dataSource;

    @Inject
    public AuditEventWriter(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public void insertProcessEvent(AuditEnvelope envelope) {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(INSERT)) {
            statement.setString(1, envelope.eventId());
            setNullableLong(statement, 2, envelope.processExecutionId());
            setNullableLong(statement, 3, envelope.taskDefinitionId());
            statement.setString(4, envelope.stage());
            statement.setString(5, envelope.status() == null ? "" : envelope.status());
            statement.setString(6, envelope.message());
            statement.setString(7, envelope.payloadJson());
            statement.setTimestamp(8, envelope.timestamp() == null
                    ? new Timestamp(System.currentTimeMillis())
                    : Timestamp.from(envelope.timestamp()));
            statement.executeUpdate();
        } catch (SQLException error) {
            // Propaga -> el consumidor hace nack y el MQ reintrega (at-least-once).
            throw new IllegalStateException("Cannot persist audit_event for " + envelope.eventId(), error);
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
