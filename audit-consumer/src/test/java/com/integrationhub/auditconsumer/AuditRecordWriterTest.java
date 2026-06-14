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
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Persistencia idempotente en el store frio audit_record_event.
 */
@Testcontainers
class AuditRecordWriterTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("audit_cold")
            .withUsername("postgres")
            .withPassword("postgres");

    private DataSource dataSource;
    private AuditRecordWriter writer;

    @BeforeEach
    void setUp() throws Exception {
        var pg = new PGSimpleDataSource();
        pg.setURL(POSTGRES.getJdbcUrl());
        pg.setUser(POSTGRES.getUsername());
        pg.setPassword(POSTGRES.getPassword());
        dataSource = pg;
        writer = new AuditRecordWriter(dataSource);
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("drop table if exists audit_record_event");
            statement.execute("""
                    create table audit_record_event (
                        id bigserial primary key,
                        event_id varchar(64) not null,
                        trace_id varchar(120),
                        record_id varchar(64),
                        stage varchar(80) not null,
                        status varchar(30),
                        process_execution_id bigint,
                        task_definition_id bigint,
                        message text,
                        payload_json text,
                        event_ts timestamp not null,
                        ingested_at timestamp not null default current_timestamp
                    )""");
            statement.execute("create unique index ux_audit_record_event_event_id on audit_record_event (event_id)");
        }
    }

    private AuditEnvelope record(String eventId) {
        return new AuditEnvelope(eventId, "exec-7", "PROC-1", AuditLevel.RECORD,
                "RECORD_SENT", "SENT", 7L, 3L, null, null, Map.of(), Instant.now(), 1);
    }

    @Test
    void persistsAndDeduplicates() throws Exception {
        var id = UUID.randomUUID().toString();
        writer.insertRecordEvent(record(id));
        writer.insertRecordEvent(record(id));
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             var rs = statement.executeQuery("select count(*) from audit_record_event where record_id = 'PROC-1'")) {
            rs.next();
            assertEquals(1, rs.getInt(1));
        }
    }
}
