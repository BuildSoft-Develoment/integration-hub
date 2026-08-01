// @covers spec 004-observabilidad-y-auditoria RF-007 (reingenieria: prueba que cubre el/los RF en produccion — observabilidad-y-auditoria: cold-store de auditoria)
package com.integrationhub.auditconsumer.coldstore;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
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
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Persistencia idempotente del store frio Postgres (audit_record_event).
 */
@Testcontainers
class PostgresColdStoreTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("audit_cold")
            .withUsername("postgres")
            .withPassword("postgres");

    private DataSource dataSource;
    private PostgresColdStore coldStore;

    @BeforeEach
    void setUp() throws Exception {
        var pg = new PGSimpleDataSource();
        pg.setURL(POSTGRES.getJdbcUrl());
        pg.setUser(POSTGRES.getUsername());
        pg.setPassword(POSTGRES.getPassword());
        dataSource = pg;
        coldStore = new PostgresColdStore(dataSource);
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("drop table if exists audit_record_event");
            statement.execute("""
                    create table audit_record_event (
                        id bigserial primary key,
                        event_id varchar(64) not null,
                        trace_id varchar(120),
                        record_id varchar(512),
                        stage varchar(80) not null,
                        status varchar(30),
                        process_execution_id bigint,
                        task_definition_id bigint,
                        message text,
                        payload_json text,
                        standard varchar(20),
                        message_type varchar(30),
                        source_file_name varchar(255),
                        source_file_hash char(64),
                        record_number bigint,
                        business_key varchar(120),
                        business_key_hash char(64),
                        payment_reference varchar(40),
                        transaction_reference varchar(40),
                        uetr varchar(36),
                        archive_id bigint,
                        gateway_reference varchar(120),
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
        coldStore.write(record(id));
        coldStore.write(record(id));
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             var rs = statement.executeQuery("select count(*) from audit_record_event where record_id = 'PROC-1'")) {
            rs.next();
            assertEquals(1, rs.getInt(1));
        }
    }

    /**
     * Round-trip del lado consumidor (cierra el gap del visor de lineage por fila):
     * un RECORD_VALIDATION_ISSUE -tal como lo emite Mt101QuarantineService- sobrevive
     * el salto por el broker (serialize/deserialize con el mismo contrato) y queda
     * en audit_record_event consultable por (source_file_hash, record_number) -- la
     * misma clave que usa RecordLineageResource.timelineBySourceRow.
     */
    @Test
    void recordValidationIssueIsQueryableBySourceRow() throws Exception {
        var mapper = new ObjectMapper().registerModule(new JavaTimeModule());
        var emitted = validationIssueEnvelope("3af91aa0", 847192L, "LFLS123", "T847192");

        // Salto por el broker: el productor serializa, el consumidor deserializa.
        var onTheWire = mapper.writeValueAsString(emitted);
        var received = mapper.readValue(onTheWire, AuditEnvelope.class);
        coldStore.write(received);

        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "select stage, status, payment_reference, transaction_reference, message "
                             + "from audit_record_event where source_file_hash = ? and record_number = ? "
                             + "order by event_ts asc, id asc")) {
            statement.setString(1, "3af91aa0");
            statement.setLong(2, 847192L);
            try (var rs = statement.executeQuery()) {
                assertTrue(rs.next(), "el lineage por fila debe encontrar el issue");
                assertEquals("RECORD_VALIDATION_ISSUE", rs.getString("stage"));
                assertEquals("REJECTED", rs.getString("status"));
                assertEquals("LFLS123", rs.getString("payment_reference"), ":20:");
                assertEquals("T847192", rs.getString("transaction_reference"), ":21:");
                assertTrue(rs.getString("message").contains("STRUCT.FIELD_70"));
            }
        }
    }

    private AuditEnvelope validationIssueEnvelope(String sourceFileHash, long recordNumber,
                                                  String sendersReference, String transactionReference) {
        return new AuditEnvelope(
                UUID.randomUUID().toString(),
                "exec-7",
                sendersReference,
                AuditLevel.RECORD,
                "RECORD_VALIDATION_ISSUE",
                "REJECTED",
                7L,
                null,
                "STRUCT.FIELD_70: Remittance excede 4x35",
                null,
                Map.of(),
                "SWIFT",
                "MT101",
                null,
                sourceFileHash,
                recordNumber,
                null,
                null,
                sendersReference,
                transactionReference,
                null,
                null,
                null,
                Instant.now(),
                AuditEnvelope.CURRENT_SCHEMA_VERSION);
    }
}
