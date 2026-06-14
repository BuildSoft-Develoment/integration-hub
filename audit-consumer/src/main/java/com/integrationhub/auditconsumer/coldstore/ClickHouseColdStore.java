package com.integrationhub.auditconsumer.coldstore;

import com.integrationhub.platform.audit.AuditEnvelope;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.util.Properties;

/**
 * Store frio sobre ClickHouse para trazabilidad E2E a millones (columnar,
 * append-only). Conexion lazy via JDBC; se activa con
 * {@code audit.cold-store.type=CLICKHOUSE}.
 *
 * <p>La dedup la da el {@code ReplacingMergeTree} por {@code event_id} del lado de
 * ClickHouse (la entrega del MQ es at-least-once).</p>
 */
public final class ClickHouseColdStore implements ColdStore {

    private static final String INSERT = """
            insert into audit_record_event
                (event_id, trace_id, record_id, stage, status, process_execution_id, task_definition_id, message, payload_json, event_ts)
            values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;

    private final String url;
    private final String username;
    private final String password;

    public ClickHouseColdStore(String url, String username, String password) {
        this.url = url;
        this.username = username;
        this.password = password;
    }

    @Override
    public void write(AuditEnvelope envelope) {
        var props = new Properties();
        if (username != null && !username.isBlank()) {
            props.setProperty("user", username);
            props.setProperty("password", password == null ? "" : password);
        }
        try (Connection connection = DriverManager.getConnection(url, props);
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
            throw new IllegalStateException("Cannot persist audit_record_event to ClickHouse for "
                    + envelope.eventId(), error);
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
