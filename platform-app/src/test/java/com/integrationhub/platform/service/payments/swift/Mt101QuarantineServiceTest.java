package com.integrationhub.platform.service.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.integrationhub.platform.provider.task.payments.swift.Mt101FragmentStore;
import com.integrationhub.platform.repository.payments.swift.Mt101FailedRecordRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101ValidationIssueRepository;
import com.integrationhub.platform.spi.task.payments.Mt101Message;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.postgresql.ds.PGSimpleDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Cuarentena por fila: resuelve cada :21: fallido a su fila exacta del archivo via
 * el mapeo source_records_json del fragmento, y la encola idempotentemente.
 *
 * @covers spec 008-mensajeria-pagos RF-022 (cuarentena + reproceso por fila)
 */
@Testcontainers
class Mt101QuarantineServiceTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("mt101_quarantine")
            .withUsername("postgres")
            .withPassword("postgres");

    private DataSource dataSource;
    private Mt101FragmentStore fragmentStore;
    private Mt101QuarantineService service;
    private final List<com.integrationhub.platform.audit.AuditEnvelope> emitted = new java.util.ArrayList<>();

    @BeforeEach
    void setUp() throws Exception {
        dataSource = dataSource();
        var objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        fragmentStore = new Mt101FragmentStore(dataSource, null, objectMapper);
        emitted.clear();
        service = new Mt101QuarantineService(dataSource, null,
                new Mt101ValidationIssueRepository(), new Mt101FragmentRepository(),
                new Mt101FailedRecordRepository(), objectMapper, emitted::addAll);
        prepareSchema();
    }

    @Test
    void resolvesExactFileRowForFailedTransaction() throws Exception {
        // Fragmento P1 con 2 transacciones mapeadas a las filas 847192 y 847193.
        insertFragment("P1", "hashA", Map.of("TX-1", 847192L, "TX-2", 847193L));
        insertIssue("P1", "TX-1", "STRUCT.FIELD_70", "E", "Remittance excede 4x35");

        var quarantined = service.quarantineFromIssues(null, "SET", null);

        assertEquals(1, quarantined);
        var rows = service.list(null, "SET", null, 100);
        assertEquals(1, rows.size());
        var row = rows.get(0);
        assertEquals(847192L, row.sourceRecordNumber(), "la fila exacta del :21: fallido");
        assertEquals("hashA", row.sourceFileHash());
        assertEquals("TX-1", row.transactionReference());
        assertEquals("P1", row.sendersReference());
        assertEquals("STRUCT.FIELD_70", row.ruleCode());
        assertEquals("QUARANTINED", row.status());
    }

    @Test
    void emitsValidationIssueEventWithBusinessKey() throws Exception {
        insertFragment("P1", "hashA", Map.of("TX-1", 847192L));
        insertIssue("P1", "TX-1", "STRUCT.FIELD_70", "E", "Remittance excede 4x35");

        service.quarantineFromIssues(null, "SET", null);

        assertEquals(1, emitted.size(), "se emite un RECORD_VALIDATION_ISSUE por fila fallida");
        var event = emitted.get(0);
        assertEquals("RECORD_VALIDATION_ISSUE", event.stage());
        assertEquals("hashA", event.sourceFileHash());
        assertEquals(847192L, event.recordNumber(), "el evento lleva la fila exacta para el lineage por fila");
        assertEquals("P1", event.paymentReference());
        assertEquals("TX-1", event.transactionReference());
        assertTrue(event.message().contains("STRUCT.FIELD_70"));
        var firstEventId = event.eventId();

        // Idempotente: re-construir la cuarentena reusa el mismo eventId (cold store dedup).
        emitted.clear();
        service.quarantineFromIssues(null, "SET", null);
        assertEquals(1, emitted.size());
        assertEquals(firstEventId, emitted.get(0).eventId(), "eventId determinista entre re-ejecuciones");
    }

    @Test
    void messageLevelIssueWithoutExactRowFails() throws Exception {
        insertFragment("P1", "hashA", Map.of("TX-1", 1L));
        insertIssue("P1", null, "STRUCT.MESSAGE", "E", "fallo a nivel de mensaje");

        var error = assertThrows(IllegalArgumentException.class,
                () -> service.quarantineFromIssues(null, "SET", null));

        assertTrue(error.getMessage().contains("exact mt101_fragment_record lineage"));
    }

    @Test
    void quarantineIsIdempotent() throws Exception {
        insertFragment("P1", "hashA", Map.of("TX-1", 100L));
        insertIssue("P1", "TX-1", "STRUCT.X", "E", "x");

        assertEquals(1, service.quarantineFromIssues(null, "SET", null));
        assertEquals(0, service.quarantineFromIssues(null, "SET", null), "re-encolar no duplica");
        assertEquals(1, service.list(null, "SET", null, 100).size());
    }

    @Test
    void quarantineFailsForPreviousDataWithoutFragmentRecordLineage() throws Exception {
        fragmentStore.insertFragment(null, "SET", 1L, 10L, "staging_record",
                1L, 1L, 1, 1, sampleMessage("P1"));
        insertIssue("P1", "TX-1", "STRUCT.X", "E", "x");

        var error = assertThrows(IllegalStateException.class,
                () -> service.quarantineFromIssues(null, "SET", null));

        assertTrue(error.getMessage().contains("mt101_fragment_record"),
                () -> "mensaje inesperado: " + error.getMessage());
    }

    @Test
    void resolvesPerTransactionAcrossFragments() throws Exception {
        insertFragment("P1", "hashA", Map.of("TX-1", 10L, "TX-2", 11L));
        insertFragment("P2", "hashA", Map.of("TX-3", 60L, "TX-4", 61L));
        insertIssue("P1", "TX-2", "RULE.A", "E", "a");
        insertIssue("P2", "TX-3", "RULE.B", "E", "b");

        service.quarantineFromIssues(null, "SET", null);
        var rows = service.list(null, "SET", null, 100);

        assertEquals(2, rows.size());
        assertTrue(rows.stream().anyMatch(r -> r.sourceRecordNumber() == 11L && "TX-2".equals(r.transactionReference())));
        assertTrue(rows.stream().anyMatch(r -> r.sourceRecordNumber() == 60L && "TX-3".equals(r.transactionReference())));
    }

    private void insertFragment(String reference, String sourceFileHash, Map<String, Long> sourceRecords) {
        fragmentStore.insertFragments(null, List.of(new Mt101FragmentStore.FragmentInsert(
                "SET", 1L, 10L, "staging_record",
                1L, 2L, 1L, 2L, sourceFileHash, sourceRecords,
                Map.of(),
                1, 2, sampleMessage(reference))));
    }

    private void insertIssue(String sendersReference, String transactionReference,
                             String ruleCode, String severity, String message) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "insert into mt101_validation_issue (rule_code, rule_set, severity, message, "
                             + "fragment_set_id, senders_reference, transaction_reference) values (?, ?, ?, ?, ?, ?, ?)")) {
            statement.setString(1, ruleCode);
            statement.setString(2, "structural-mvp");
            statement.setString(3, severity);
            statement.setString(4, message);
            statement.setString(5, "SET");
            statement.setString(6, sendersReference);
            statement.setString(7, transactionReference);
            statement.executeUpdate();
        }
    }

    private Mt101Message sampleMessage(String reference) {
        return new Mt101Message(
                new Mt101Message.Envelope("SGOBFRPPAXXX", "BCPLPEPLXXXX", "uetr-" + reference, "N"),
                new Mt101Message.SequenceA(reference, null, 1, 2, LocalDate.of(2026, 6, 12),
                        null, new Mt101Message.Party("H", "001", null, List.of("ACME")), null, null),
                List.of(new Mt101Message.Transaction(
                        1, "TX-" + reference, null, null,
                        new Mt101Message.Amount("PEN", new BigDecimal("100.00")),
                        null, null, null, null,
                        new Mt101Message.Party("", "ACC-" + reference, null, List.of("BENE")),
                        null, null, null, "OUR", null, null)),
                new Mt101Message.ControlTotals(1, Map.of("PEN", new BigDecimal("100.00"))),
                "{\"sendersReference\":\"" + reference + "\"}",
                "JSON");
    }

    private void prepareSchema() throws SQLException {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("drop table if exists mt101_failed_record");
            statement.executeUpdate("drop table if exists mt101_validation_issue");
            statement.executeUpdate("drop table if exists mt101_fragment_record");
            statement.executeUpdate("drop table if exists mt101_build_fragment");
            statement.executeUpdate("create table mt101_build_fragment ("
                    + "id bigserial primary key, fragment_set_id varchar(80) not null,"
                    + "process_execution_id bigint, task_definition_id bigint, source_table varchar(255),"
                    + "source_row_from bigint, source_row_to bigint, staging_id_from bigint, staging_id_to bigint,"
                    + "source_record_from bigint, source_record_to bigint, source_file_hash varchar(64),"
                    + "source_records_json text, fragment_index integer not null, fragment_total integer not null,"
                    + "senders_reference varchar(16) not null, payload_hash char(64) not null,"
                    + "raw_payload text not null, message_json text not null,"
                    + "status varchar(20) not null default 'BUILT', error_message text,"
                    + "created_at timestamp not null default current_timestamp,"
                    + "updated_at timestamp not null default current_timestamp)");
            statement.executeUpdate("create unique index ux_frag_ref on mt101_build_fragment"
                    + "(fragment_set_id, senders_reference)");
            statement.executeUpdate("create table mt101_fragment_record ("
                    + "id bigserial primary key,"
                    + "fragment_id bigint references mt101_build_fragment(id) on delete cascade,"
                    + "fragment_set_id varchar(80) not null,"
                    + "original_fragment_set_id varchar(80),"
                    + "source_file_hash varchar(64),"
                    + "source_record_number bigint not null,"
                    + "staging_id bigint,"
                    + "original_senders_reference varchar(16),"
                    + "original_transaction_reference varchar(35),"
                    + "current_senders_reference varchar(16),"
                    + "current_transaction_reference varchar(35),"
                    + "rebuild_run_id varchar(80),"
                    + "status varchar(30) not null default 'BUILT',"
                    + "created_at timestamp not null default current_timestamp)");
            statement.executeUpdate("create unique index ux_mt101_fragment_record_current_q on mt101_fragment_record "
                    + "(fragment_set_id, coalesce(source_file_hash, ''), source_record_number)");
            statement.executeUpdate("create table mt101_validation_issue ("
                    + "id bigserial primary key, archive_id bigint, transaction_id bigint,"
                    + "rule_code varchar(80) not null, rule_set varchar(50) not null, severity char(1) not null,"
                    + "message text, fragment_set_id varchar(80), senders_reference varchar(16),"
                    + "fragment_index integer, transaction_reference varchar(35),"
                    + "detected_at timestamp not null default current_timestamp)");
            statement.executeUpdate("create table mt101_failed_record ("
                    + "id bigserial primary key, fragment_set_id varchar(80) not null,"
                    + "senders_reference varchar(16), transaction_reference varchar(35), source_file_hash varchar(64),"
                    + "source_record_number bigint, rule_code varchar(80), rule_set varchar(50), severity char(1),"
                    + "message text, status varchar(40) not null default 'QUARANTINED',"
                    + "created_at timestamp not null default current_timestamp, resolved_at timestamp)");
            statement.executeUpdate("create unique index ux_mt101_failed_dedup on mt101_failed_record "
                    + "(fragment_set_id, coalesce(senders_reference, ''), "
                    + " coalesce(transaction_reference, ''), coalesce(rule_code, ''))");
        }
    }

    private DataSource dataSource() {
        var pgDataSource = new PGSimpleDataSource();
        pgDataSource.setURL(POSTGRES.getJdbcUrl());
        pgDataSource.setUser(POSTGRES.getUsername());
        pgDataSource.setPassword(POSTGRES.getPassword());
        return pgDataSource;
    }
}
