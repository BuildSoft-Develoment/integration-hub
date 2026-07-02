package com.integrationhub.auditconsumer;

import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.audit.AuditLevel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.postgresql.ds.PGSimpleDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Persistencia idempotente en audit_event. Crea una tabla minima (sin FKs) para
 * aislar el consumidor del schema completo de platform-app.
 */
@Testcontainers
class AuditEventWriterTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("audit_consumer")
            .withUsername("postgres")
            .withPassword("postgres");

    private DataSource dataSource;
    private AuditEventWriter writer;

    @BeforeEach
    void setUp() throws Exception {
        var pg = new PGSimpleDataSource();
        pg.setURL(POSTGRES.getJdbcUrl());
        pg.setUser(POSTGRES.getUsername());
        pg.setPassword(POSTGRES.getPassword());
        dataSource = pg;
        writer = new AuditEventWriter(dataSource);
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("drop table if exists audit_event");
            statement.execute("""
                    create table audit_event (
                        id bigserial primary key,
                        event_id varchar(64),
                        process_execution_id bigint,
                        task_definition_id bigint,
                        event_type varchar(80) not null,
                        status varchar(30) not null,
                        message text,
                        payload_json text,
                        created_at timestamp not null default current_timestamp
                    )""");
            statement.execute("create unique index ux_audit_event_event_id on audit_event (event_id)");
        }
    }

    private AuditEnvelope process(String eventId) {
        return new AuditEnvelope(eventId, "exec-1", null, AuditLevel.PROCESS,
                "PROCESS_STARTED", "RUNNING", 1L, null, "started", "{\"k\":1}", Map.of(), Instant.now(), 1);
    }

    @Test
    void persistsProcessEvent() throws Exception {
        writer.insertProcessEvent(process(UUID.randomUUID().toString()));
        assertEquals(1, count());
    }

    @Test
    void deduplicatesByEventId() throws Exception {
        var eventId = UUID.randomUUID().toString();
        writer.insertProcessEvent(process(eventId));
        writer.insertProcessEvent(process(eventId)); // reentrega at-least-once
        assertEquals(1, count());
    }

    @Test
    void persistsProcessEventsInBatch() throws Exception {
        var repeated = UUID.randomUUID().toString();
        writer.insertProcessEvents(List.of(
                process(UUID.randomUUID().toString()),
                process(UUID.randomUUID().toString()),
                process(repeated),
                process(repeated)
        ));
        assertEquals(3, count());
    }

    private int count() throws SQLException {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             var rs = statement.executeQuery("select count(*) from audit_event")) {
            rs.next();
            return rs.getInt(1);
        }
    }
}
