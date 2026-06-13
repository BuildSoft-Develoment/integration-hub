package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.platform.spi.task.TaskContext;
import org.junit.jupiter.api.AfterAll;
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
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 008-mensajeria-pagos RF-006, T-014
 */
@Testcontainers
class Mt101ReconcileTaskProviderTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("recon_test")
            .withUsername("postgres")
            .withPassword("postgres");

    private DataSource dataSource;
    private Mt101ReconcileTaskProvider provider;

    @BeforeEach
    void setUp() throws Exception {
        dataSource = dataSource();
        provider = new Mt101ReconcileTaskProvider(dataSource, null);
        prepareSchema();
    }

    @AfterAll
    static void stopContainer() {
        POSTGRES.stop();
    }

    @Test
    void detectsSentWithoutConfirmAndConfirmWithoutSent() throws Exception {
        var today = LocalDate.of(2026, 6, 9);
        // archive: 3 sent today; uno (PROC-3) sin confirmacion.
        insertArchive("PROC-1", today);
        insertArchive("PROC-2", today);
        insertArchive("PROC-3", today);
        // confirmation: 2 hoy (PROC-1, PROC-2) + 1 huerfana (PROC-X).
        insertConfirmation("PROC-1", today);
        insertConfirmation("PROC-2", today);
        insertConfirmation("PROC-X", today);

        var result = provider.execute(new TaskContext(1L, 1L), Map.of(
                "asOfDate", today.toString(),
                "lookbackDays", 0,
                "matchKeys", List.of("senders_reference"),
                "publishExceptionsTo", "table:0:mt101_reconciliation_exception"));

        assertTrue(result.success());
        assertEquals(2, result.outputs().get("matchedCount"));
        assertEquals(1, result.outputs().get("unmatchedSentCount"));
        assertEquals(1, result.outputs().get("unmatchedConfirmCount"));

        @SuppressWarnings("unchecked")
        var records = (List<Map<String, Object>>) result.outputs().get("records");
        assertEquals(2, records.size());
        assertTrue(records.stream().anyMatch(r -> "SENT_WITHOUT_CONFIRM".equals(r.get("exceptionType"))));
        assertTrue(records.stream().anyMatch(r -> "CONFIRM_WITHOUT_SENT".equals(r.get("exceptionType"))));

        // Persistencia: ambas excepciones quedaron en la tabla.
        assertEquals(2, countRows("mt101_reconciliation_exception"));

        // H5: las filas conciliadas (PROC-1, PROC-2) quedan RECONCILED; la no
        // conciliada (PROC-3, SENT_WITHOUT_CONFIRM) conserva su estado previo.
        assertEquals("RECONCILED", archiveStatus("PROC-1"));
        assertEquals("RECONCILED", archiveStatus("PROC-2"));
        assertEquals("ARCHIVED", archiveStatus("PROC-3"));
    }

    private String archiveStatus(String sendersReference) throws SQLException {
        try (Connection c = dataSource.getConnection();
             var stmt = c.prepareStatement("select status from mt101_archive where senders_reference = ?")) {
            stmt.setString(1, sendersReference);
            try (var rs = stmt.executeQuery()) {
                rs.next();
                return rs.getString(1);
            }
        }
    }

    @Test
    void honorsLookbackWindow() throws Exception {
        var asOf = LocalDate.of(2026, 6, 9);
        // dia 6 (fuera), dia 9 (dentro)
        insertArchive("OLD-001", asOf.minusDays(3));
        insertArchive("NEW-001", asOf);
        // sin confirmation -> ambas son SENT_WITHOUT_CONFIRM, pero la antigua queda
        // fuera de la ventana de 1 dia.

        var result = provider.execute(new TaskContext(1L, 1L), Map.of(
                "asOfDate", asOf.toString(),
                "lookbackDays", 1));

        assertEquals(0, result.outputs().get("matchedCount"));
        assertEquals(1, result.outputs().get("unmatchedSentCount"),
                "solo NEW-001 debe contar en ventana de 1 dia");
    }

    @Test
    void zeroExceptionsWhenAllMatch() throws Exception {
        var today = LocalDate.of(2026, 6, 9);
        insertArchive("OK-1", today);
        insertConfirmation("OK-1", today);

        var result = provider.execute(new TaskContext(1L, 1L), Map.of(
                "asOfDate", today.toString(),
                "lookbackDays", 0));

        assertEquals(1, result.outputs().get("matchedCount"));
        assertEquals(0, result.outputs().get("unmatchedSentCount"));
        assertEquals(0, result.outputs().get("unmatchedConfirmCount"));
        assertEquals(0, countRows("mt101_reconciliation_exception"));
    }

    @Test
    void supportsDifferentColumnMatchForProductionArchiveConfirmationSchema() throws Exception {
        var today = LocalDate.of(2026, 6, 9);
        var archiveId = insertArchive("OK-ID", today);
        insertConfirmationForArchive(archiveId, today);

        var result = provider.execute(new TaskContext(1L, 1L), Map.of(
                "asOfDate", today.toString(),
                "lookbackDays", 0,
                "matchKeys", List.of("id=archive_id")));

        assertEquals(1, result.outputs().get("matchedCount"));
        assertEquals(0, result.outputs().get("unmatchedSentCount"));
        assertEquals(0, result.outputs().get("unmatchedConfirmCount"));
    }

    // --- helpers ---

    private DataSource dataSource() {
        var pg = new PGSimpleDataSource();
        pg.setURL(POSTGRES.getJdbcUrl());
        pg.setUser(POSTGRES.getUsername());
        pg.setPassword(POSTGRES.getPassword());
        return pg;
    }

    private void prepareSchema() throws SQLException {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("drop table if exists mt101_reconciliation_exception");
            statement.executeUpdate("drop table if exists mt101_confirmation");
            statement.executeUpdate("drop table if exists mt101_archive");
            statement.executeUpdate("create table mt101_archive (" +
                    " id bigserial primary key," +
                    " senders_reference varchar(16) not null," +
                    " status varchar(20) not null default 'ARCHIVED'," +
                    " created_at timestamp not null default current_timestamp," +
                    " updated_at timestamp not null default current_timestamp)");
            statement.executeUpdate("create table mt101_confirmation (" +
                    " id bigserial primary key," +
                    " archive_id bigint," +
                    " senders_reference varchar(16) not null," +
                    " received_at timestamp not null default current_timestamp)");
            statement.executeUpdate("create table mt101_reconciliation_exception (" +
                    " id bigserial primary key," +
                    " as_of_date date not null," +
                    " archive_id bigint," +
                    " confirmation_id bigint," +
                    " exception_type varchar(30) not null," +
                    " details text)");
        }
    }

    private long insertArchive(String ref, LocalDate createdAt) throws SQLException {
        try (Connection c = dataSource.getConnection();
             var stmt = c.prepareStatement("insert into mt101_archive (senders_reference, created_at) values (?, ?) returning id")) {
            stmt.setString(1, ref);
            stmt.setObject(2, createdAt.atStartOfDay());
            try (var rs = stmt.executeQuery()) {
                rs.next();
                return rs.getLong(1);
            }
        }
    }

    private void insertConfirmation(String ref, LocalDate receivedAt) throws SQLException {
        try (Connection c = dataSource.getConnection();
             var stmt = c.prepareStatement("insert into mt101_confirmation (senders_reference, received_at) values (?, ?)")) {
            stmt.setString(1, ref);
            stmt.setObject(2, receivedAt.atStartOfDay());
            stmt.executeUpdate();
        }
    }

    private void insertConfirmationForArchive(long archiveId, LocalDate receivedAt) throws SQLException {
        try (Connection c = dataSource.getConnection();
             var stmt = c.prepareStatement(
                     "insert into mt101_confirmation (archive_id, senders_reference, received_at) values (?, ?, ?)")) {
            stmt.setLong(1, archiveId);
            stmt.setString(2, "UNUSED");
            stmt.setObject(3, receivedAt.atStartOfDay());
            stmt.executeUpdate();
        }
    }

    private int countRows(String table) throws SQLException {
        try (Connection c = dataSource.getConnection();
             Statement stmt = c.createStatement();
             var rs = stmt.executeQuery("select count(*) from " + table)) {
            rs.next();
            return rs.getInt(1);
        }
    }
}
