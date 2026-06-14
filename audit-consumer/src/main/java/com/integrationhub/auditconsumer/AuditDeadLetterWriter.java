package com.integrationhub.auditconsumer;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

/**
 * Persiste mensajes poison de auditoria. El consumer los confirma en el broker
 * despues de guardarlos aqui, evitando bloquear la cola y dejando evidencia
 * operativa para reproceso manual/controlado.
 */
@ApplicationScoped
public class AuditDeadLetterWriter {

    private static final String INSERT = """
            insert into audit_dead_letter_event
                (event_id, broker_type, topic, payload, error_message)
            values (?, ?, ?, ?, ?)
            """;

    private final DataSource dataSource;

    @Inject
    public AuditDeadLetterWriter(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public void write(String eventId, String brokerType, String topic, String payload, String errorMessage) {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(INSERT)) {
            statement.setString(1, eventId);
            statement.setString(2, brokerType);
            statement.setString(3, topic);
            statement.setString(4, payload);
            statement.setString(5, errorMessage);
            statement.executeUpdate();
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot persist audit dead-letter event", error);
        }
    }
}
