package com.integrationhub.platform.service.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.integrationhub.platform.provider.task.payments.swift.Mt101FragmentStore;
import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Reproceso quirurgico: revalidar/reenviar por estado y reprocesar solo las filas
 * afectadas de un lote sin regenerar el set.
 *
 * @covers spec 008-mensajeria-pagos RF-022 (reproceso por fila/estado)
 */
@Testcontainers
class Mt101ReprocessServiceTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("mt101_reprocess")
            .withUsername("postgres")
            .withPassword("postgres");

    private DataSource dataSource;
    private Mt101FragmentStore fragmentStore;
    private Mt101ReprocessService service;

    @BeforeEach
    void setUp() throws Exception {
        dataSource = dataSource();
        var objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        fragmentStore = new Mt101FragmentStore(dataSource, null, objectMapper);
        service = new Mt101ReprocessService(dataSource, null, new Mt101FragmentRepository());
        prepareSchema();
    }

    @Test
    void resetByStatusMovesOnlyMatchingFragments() throws Exception {
        // 3 fragmentos BUILT; marcamos 1 como REJECTED y lo revalidamos (REJECTED -> BUILT).
        insertFragment("P1", 1, 50);
        insertFragment("P2", 51, 100);
        insertFragment("P3", 101, 150);
        setStatus("P2", "REJECTED", "regla X");

        var affected = service.resetByStatus(null, "SET", "REJECTED", "BUILT");

        assertEquals(1, affected, "solo el fragmento REJECTED transiciona");
        assertEquals("BUILT", status("P2"));
        assertEquals(null, errorMessage("P2"), "el error se limpia al revalidar");
        assertEquals(1L, auditCount("STATUS_RESET"));
    }

    @Test
    void reprocessSourceRowsTouchesOnlyOverlappingFragments() throws Exception {
        insertFragment("P1", 1, 50);
        insertFragment("P2", 51, 100);
        insertFragment("P3", 101, 150);
        // Todos arrancan en estado avanzado para distinguir el efecto.
        setStatus("P1", "ARCHIVED", null);
        setStatus("P2", "ARCHIVED", null);
        setStatus("P3", "ARCHIVED", null);

        // La fila 70 cae solo en P2 (51-100) -> revalidar solo ese fragmento.
        var affected = service.reprocessSourceRows(null, "SET", 70, 70, "hashA", "BUILT");

        assertEquals(1, affected.size());
        assertEquals("P2", affected.get(0).sendersReference());
        assertEquals("BUILT", status("P2"), "el fragmento de la fila 70 vuelve a BUILT");
        assertEquals("ARCHIVED", status("P1"), "los demas no se tocan");
        assertEquals("ARCHIVED", status("P3"));
        assertEquals(1L, auditCount("SOURCE_ROW_REPROCESS"));
    }

    @Test
    void reprocessSourceRowRangeSpansMultipleFragments() throws Exception {
        insertFragment("P1", 1, 50);
        insertFragment("P2", 51, 100);
        insertFragment("P3", 101, 150);
        setStatus("P1", "ARCHIVED", null);
        setStatus("P2", "ARCHIVED", null);

        // El rango 40-60 solapa P1 y P2, no P3.
        var affected = service.reprocessSourceRows(null, "SET", 40, 60, "hashA", "VALIDATED");

        assertEquals(2, affected.size());
        assertTrue(affected.stream().anyMatch(f -> "P1".equals(f.sendersReference())));
        assertTrue(affected.stream().anyMatch(f -> "P2".equals(f.sendersReference())));
        assertEquals("VALIDATED", status("P1"));
        assertEquals("VALIDATED", status("P2"));
        assertEquals("BUILT", status("P3"));
    }

    @Test
    void statusCountsSummarizeTheLot() throws Exception {
        insertFragment("P1", 1, 50);
        insertFragment("P2", 51, 100);
        insertFragment("P3", 101, 150);
        setStatus("P2", "REJECTED", "regla X");

        var counts = new Mt101FragmentRepository().statusCountsBySet(dataSource, "SET");
        var byStatus = new java.util.HashMap<String, Long>();
        counts.forEach(c -> byStatus.put(c.status(), c.count()));

        assertEquals(2L, byStatus.get("BUILT"));
        assertEquals(1L, byStatus.get("REJECTED"));
    }

    @Test
    void rejectsDisallowedTransition() {
        var error = assertThrows(IllegalArgumentException.class,
                () -> service.resetByStatus(null, "SET", "BUILT", "SENT"));
        assertTrue(error.getMessage().contains("not allowed"));
    }

    @Test
    void rejectsSentToArchivedResetWithoutBankingReversalPolicy() {
        var error = assertThrows(IllegalArgumentException.class,
                () -> service.resetByStatus(null, "SET", "SENT", "ARCHIVED"));
        assertTrue(error.getMessage().contains("not allowed"));
    }

    @Test
    void rejectsReprocessOfAlreadySentSourceRows() throws Exception {
        // P0.1: un pago ya enviado NO se puede reprocesar como un rebuild tecnico.
        insertFragment("P1", 1, 50);
        setStatus("P1", "SENT", null);

        var error = assertThrows(IllegalArgumentException.class,
                () -> service.reprocessSourceRows(null, "SET", 10, 10, "hashA", "BUILT"));

        assertTrue(error.getMessage().contains("already sent/confirmed/reconciled"));
        assertEquals("SENT", status("P1"), "el fragmento enviado NO se toca");
    }

    @Test
    void failsLoudlyWhenNoFragmentCoversRequestedRows() {
        insertFragment("P1", 1, 50);
        // La fila 9999 no esta en ningun fragmento: sin fallback, debe fallar.
        var error = assertThrows(IllegalArgumentException.class,
                () -> service.reprocessSourceRows(null, "SET", 9999, 9999, "hashA", "BUILT"));
        assertTrue(error.getMessage().contains("no MT101 fragments cover source rows"));
    }

    @Test
    void reopensRejectedRebuildBackToQuarantine() throws Exception {
        // B1': una fila cuyo correctivo fue rechazado vuelve a QUARANTINED para corregir de nuevo.
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "insert into mt101_failed_record (fragment_set_id, senders_reference, source_file_hash, "
                             + "source_record_number, rule_code, status) values ('SET', 'P2', 'hashA', 8472, 'STRUCT.X', 'REBUILD_REJECTED')")) {
            statement.executeUpdate();
        }

        var reopened = service.reopenRejectedRebuild(null, "SET", "hashA", 8472, "ana", "INC-9", "OPS-9");

        assertEquals(1, reopened);
        assertEquals("QUARANTINED", failedStatus(8472), "la fila rechazada vuelve a cuarentena");
        assertEquals(1L, auditCount("REBUILD_REOPEN"));
    }

    @Test
    void reopenFailsWhenNoRejectedRow() {
        // Sin fallback: reabrir una fila que no esta REBUILD_REJECTED es un error accionable.
        var error = assertThrows(IllegalArgumentException.class,
                () -> service.reopenRejectedRebuild(null, "SET", "hashA", 999, "ana", null, null));
        assertTrue(error.getMessage().contains("no REBUILD_REJECTED row"));
    }

    private String failedStatus(long recordNumber) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "select status from mt101_failed_record where source_record_number = ?")) {
            statement.setLong(1, recordNumber);
            try (var rs = statement.executeQuery()) {
                return rs.next() ? rs.getString(1) : null;
            }
        }
    }

    private void insertFragment(String reference, int rowFrom, int rowTo) {
        var sourceRecords = new java.util.LinkedHashMap<String, Long>();
        var stagingIds = new java.util.LinkedHashMap<Long, Long>();
        for (long row = rowFrom; row <= rowTo; row++) {
            sourceRecords.put("TX-" + row, row);
            stagingIds.put(row, 10_000L + row);
        }
        fragmentStore.insertFragments(null, List.of(new Mt101FragmentStore.FragmentInsert(
                "SET", 1L, 10L, "staging_record",
                rowFrom, rowTo, rowFrom, rowTo, "hashA", sourceRecords, stagingIds,
                rowFrom == 1 ? 1 : rowFrom == 51 ? 2 : 3, 3, sampleMessage(reference))));
    }

    private void setStatus(String reference, String status, String error) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "update mt101_build_fragment set status = ?, error_message = ? where senders_reference = ?")) {
            statement.setString(1, status);
            statement.setString(2, error);
            statement.setString(3, reference);
            statement.executeUpdate();
        }
    }

    private String status(String reference) throws SQLException {
        return readColumn(reference, "status");
    }

    private String errorMessage(String reference) throws SQLException {
        return readColumn(reference, "error_message");
    }

    private String readColumn(String reference, String column) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "select " + column + " from mt101_build_fragment where senders_reference = ?")) {
            statement.setString(1, reference);
            try (var rs = statement.executeQuery()) {
                return rs.next() ? rs.getString(1) : null;
            }
        }
    }

    private long auditCount(String action) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "select count(*) from mt101_reprocess_audit where action = ?")) {
            statement.setString(1, action);
            try (var rs = statement.executeQuery()) {
                rs.next();
                return rs.getLong(1);
            }
        }
    }

    private Mt101Message sampleMessage(String reference) {
        return new Mt101Message(
                new Mt101Message.Envelope("SGOBFRPPAXXX", "BCPLPEPLXXXX", "uetr-" + reference, "N"),
                new Mt101Message.SequenceA(reference, null, 1, 3, LocalDate.of(2026, 6, 12),
                        null, new Mt101Message.Party("H", "001", null, List.of("ACME")), null, null),
                List.of(new Mt101Message.Transaction(
                        1, "TX-" + reference, null, null,
                        new Mt101Message.Amount("PEN", new BigDecimal("100.00")),
                        null, null, null, null,
                        new Mt101Message.Party("", "ACC-" + reference, null, List.of("BENE")),
                        null, null, null, "OUR", null, null)),
                new Mt101Message.ControlTotals(1, java.util.Map.of("PEN", new BigDecimal("100.00"))),
                "{\"sendersReference\":\"" + reference + "\"}",
                "JSON");
    }

    private void prepareSchema() throws SQLException {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("drop table if exists mt101_fragment_record");
            statement.executeUpdate("drop table if exists mt101_reprocess_audit");
            statement.executeUpdate("drop table if exists mt101_build_fragment");
            statement.executeUpdate("create table mt101_build_fragment ("
                    + "id bigserial primary key,"
                    + "fragment_set_id varchar(80) not null,"
                    + "process_execution_id bigint,"
                    + "task_definition_id bigint,"
                    + "source_table varchar(255),"
                    + "source_row_from bigint,"
                    + "source_row_to bigint,"
                    + "staging_id_from bigint,"
                    + "staging_id_to bigint,"
                    + "source_record_from bigint,"
                    + "source_record_to bigint,"
                    + "source_file_hash varchar(64),"
                    + "source_records_json text,"
                    + "fragment_index integer not null,"
                    + "fragment_total integer not null,"
                    + "senders_reference varchar(16) not null,"
                    + "payload_hash char(64) not null,"
                    + "raw_payload text not null,"
                    + "message_json text not null,"
                    + "status varchar(20) not null default 'BUILT',"
                    + "error_message text,"
                    + "created_at timestamp not null default current_timestamp,"
                    + "updated_at timestamp not null default current_timestamp)");
            statement.executeUpdate("create unique index ux_test_fragment_ref on mt101_build_fragment"
                    + "(fragment_set_id, senders_reference)");
            statement.executeUpdate("create table mt101_fragment_record ("
                    + "id bigserial primary key, fragment_id bigint references mt101_build_fragment(id) on delete cascade,"
                    + "fragment_set_id varchar(80) not null, source_file_hash varchar(64),"
                    + "source_record_number bigint not null, staging_id bigint,"
                    + "source_task_definition_id bigint, source_name varchar(255),"
                    + "original_senders_reference varchar(16), original_transaction_reference varchar(35),"
                    + "current_senders_reference varchar(16), current_transaction_reference varchar(35))");
            statement.executeUpdate("drop table if exists staging_record");
            statement.executeUpdate("create table staging_record ("
                    + "id bigserial primary key, task_definition_id bigint, source_name varchar(255),"
                    + "payload_json text, version bigint not null default 0)");
            statement.executeUpdate("create table mt101_reprocess_audit ("
                    + "id bigserial primary key, action varchar(40) not null,"
                    + "fragment_set_id varchar(80) not null, source_file_hash varchar(64),"
                    + "record_from bigint, record_to bigint,"
                    + "from_status varchar(30), to_status varchar(30), affected integer not null default 0,"
                    + "actor varchar(120), reason text, ticket_ref varchar(120),"
                    + "created_at timestamp not null default current_timestamp)");
            statement.executeUpdate("drop table if exists mt101_failed_record");
            statement.executeUpdate("create table mt101_failed_record ("
                    + "id bigserial primary key, fragment_set_id varchar(80) not null,"
                    + "senders_reference varchar(16), transaction_reference varchar(35), source_file_hash varchar(64),"
                    + "source_record_number bigint, rule_code varchar(80), status varchar(40) not null default 'QUARANTINED',"
                    + "created_at timestamp not null default current_timestamp, resolved_at timestamp)");
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
