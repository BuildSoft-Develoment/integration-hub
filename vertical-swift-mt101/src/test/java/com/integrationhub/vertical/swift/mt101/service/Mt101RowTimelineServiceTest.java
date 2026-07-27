package com.integrationhub.vertical.swift.mt101.service;

import com.integrationhub.vertical.swift.mt101.repository.Mt101StagingRecordRepository;

import com.integrationhub.vertical.swift.mt101.repository.Mt101FailedRecordRepository;
import com.integrationhub.vertical.swift.mt101.repository.Mt101FragmentRepository;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Timeline E2E operacional de una fila: instantáneo desde staging/fragmento/cuarentena,
 * sin depender del store frío asíncrono.
 *
 * @covers spec 008-mensajeria-pagos RF-009
 */
@Testcontainers
class Mt101RowTimelineServiceTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("mt101_row_timeline")
            .withUsername("postgres")
            .withPassword("postgres");

    private DataSource dataSource;
    private Mt101RowTimelineService service;

    @BeforeEach
    void setUp() throws Exception {
        dataSource = dataSource();
        service = new Mt101RowTimelineService(dataSource, null,
                new Mt101FragmentRepository(), new Mt101FailedRecordRepository(),
                new com.integrationhub.vertical.swift.mt101.repository.Mt101StagingRecordRepository());
        prepareSchema();
    }

    @Test
    void buildsOperationalTimelineForFailedRow() throws Exception {
        // Fragmento P1 cubre filas 1-50, rechazado; fila 25 en cuarentena.
        insertFragment("P1", 1000, 1049, 1, 50, 1, 2, "REJECTED", "STRUCT.X: bad charges");
        insertQuarantine("P1", "T25", 25, "STRUCT.X", "bad charges");
        // #6: staging_id real resuelto por query (record_index = 25-1 = 24), no por formula.
        var realStagingId = insertStaging(24);

        var tl = service.rowTimeline(null, "SET", "hashA", 25, realStagingId);

        assertEquals(4, tl.size());
        assertEquals("RECORD_INGESTED", tl.get(0).stage());
        assertTrue(tl.get(0).detail().contains("staging id " + realStagingId),
                "usa el id real de staging, no la suma stagingIdFrom+offset");
        assertNotNull(tl.get(0).eventTs(), "INGESTED lleva timestamp (staging.created_at)");
        assertEquals("RECORD_BUILT", tl.get(1).stage());
        assertTrue(tl.get(1).detail().contains(":20: P1") && tl.get(1).detail().contains("1/2"));
        assertNotNull(tl.get(1).eventTs(), "BUILT lleva timestamp (fragment.created_at)");
        assertEquals("RECORD_VALIDATION_ISSUE", tl.get(2).stage());
        assertTrue(tl.get(2).detail().contains("STRUCT.X") && tl.get(2).detail().contains(":21: T25"));
        assertEquals("RECORD_REJECTED", tl.get(3).stage());
    }

    private long insertStaging(long recordIndex) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var st = connection.prepareStatement(
                     "insert into staging_record (id, process_execution_id, task_definition_id, record_index, source_file_hash, payload_json) "
                             + "values (?, 1, 9, ?, 'hashA', '{}') returning id")) {
            st.setLong(1, 10_000L + recordIndex + 1);
            st.setLong(2, recordIndex);
            try (var rs = st.executeQuery()) {
                rs.next();
                return rs.getLong(1);
            }
        }
    }

    @Test
    void emptyWhenNoFragmentCoversRow() throws Exception {
        insertFragment("P1", 1000, 1049, 1, 50, 1, 2, "VALIDATED", null);
        assertEquals(List.of(), service.rowTimeline(null, "SET", "hashA", 9999, 19999));
    }

    @Test
    void includesConfirmedAndReconciledFinancialMilestones() throws Exception {
        insertFragment("P1", 1000, 1049, 1, 50, 1, 2, "SENT", null);
        var realStagingId = insertStaging(24);
        var archiveId = insertArchive("P1", "RECONCILED");
        insertConfirmation(archiveId, "ACCP", "GW-1");

        var tl = service.rowTimeline(null, "SET", "hashA", 25, realStagingId);

        assertTrue(tl.stream().anyMatch(m -> "RECORD_ARCHIVED".equals(m.stage())),
                "timeline debe incluir el archive operativo");
        assertTrue(tl.stream().anyMatch(m -> "PAYMENT_STATUS_CONFIRMED".equals(m.stage())),
                "timeline debe incluir confirmacion bancaria");
        assertTrue(tl.stream().anyMatch(m -> "PAYMENT_RECONCILED".equals(m.stage())),
                "timeline debe cerrar conciliacion por fila");
    }

    private void insertFragment(String ref, long stagingFrom, long stagingTo, long recFrom, long recTo,
                                int idx, int total, String status, String error) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var st = connection.prepareStatement(
                     "insert into mt101_build_fragment (fragment_set_id, process_execution_id, task_definition_id, "
                             + "source_table, staging_id_from, staging_id_to, source_record_from, source_record_to, "
                             + "source_file_hash, fragment_index, fragment_total, senders_reference, status, error_message) "
                             + "values ('SET', 1, 1, 'staging_record', ?, ?, ?, ?, 'hashA', ?, ?, ?, ?, ?) returning id")) {
            st.setLong(1, stagingFrom);
            st.setLong(2, stagingTo);
            st.setLong(3, recFrom);
            st.setLong(4, recTo);
            st.setInt(5, idx);
            st.setInt(6, total);
            st.setString(7, ref);
            st.setString(8, status);
            st.setString(9, error);
            try (var rs = st.executeQuery()) {
                rs.next();
                insertFragmentRecords(connection, rs.getLong(1), ref, recFrom, recTo);
            }
        }
    }

    private void insertFragmentRecords(Connection connection, long fragmentId, String ref, long recFrom, long recTo)
            throws SQLException {
        try (var st = connection.prepareStatement(
                "insert into mt101_fragment_record (fragment_id, fragment_set_id, source_file_hash, "
                        + "source_record_number, staging_id, current_senders_reference, current_transaction_reference) "
                        + "values (?, 'SET', 'hashA', ?, ?, ?, ?)")) {
            for (long row = recFrom; row <= recTo; row++) {
                st.setLong(1, fragmentId);
                st.setLong(2, row);
                st.setLong(3, 10_000L + row);
                st.setString(4, ref);
                st.setString(5, "T" + row);
                st.addBatch();
            }
            st.executeBatch();
        }
    }

    private void insertQuarantine(String ref, String txRef, long recordNumber, String rule, String message) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var st = connection.prepareStatement(
                     "insert into mt101_failed_record (fragment_set_id, senders_reference, transaction_reference, "
                             + "source_file_hash, source_record_number, staging_id, rule_code, message, status) "
                             + "values ('SET', ?, ?, 'hashA', ?, ?, ?, ?, 'QUARANTINED')")) {
            st.setString(1, ref);
            st.setString(2, txRef);
            st.setLong(3, recordNumber);
            st.setLong(4, 10_000L + recordNumber);
            st.setString(5, rule);
            st.setString(6, message);
            st.executeUpdate();
        }
    }

    private long insertArchive(String reference, String status) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var st = connection.prepareStatement(
                     "insert into mt101_archive (senders_reference, process_execution_id, status, created_at, updated_at) "
                             + "values (?, 1, ?, current_timestamp, current_timestamp) returning id")) {
            st.setString(1, reference);
            st.setString(2, status);
            try (var rs = st.executeQuery()) {
                rs.next();
                return rs.getLong(1);
            }
        }
    }

    private void insertConfirmation(long archiveId, String status, String gatewayReference) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var st = connection.prepareStatement(
                     "insert into mt101_confirmation "
                             + "(archive_id, confirmation_type, gateway_reference, confirmed_status) "
                             + "values (?, 'STATUS_API', ?, ?)")) {
            st.setLong(1, archiveId);
            st.setString(2, gatewayReference);
            st.setString(3, status);
            st.executeUpdate();
        }
    }

    private void prepareSchema() throws SQLException {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("drop table if exists staging_record");
            statement.executeUpdate("drop table if exists mt101_reconciliation_exception");
            statement.executeUpdate("drop table if exists mt101_confirmation");
            statement.executeUpdate("drop table if exists mt101_archive");
            statement.executeUpdate("create table staging_record ("
                    + "id bigserial primary key, process_execution_id bigint, task_definition_id bigint,"
                    + "record_index bigint, source_name varchar(255), source_file_hash varchar(64),"
                    + "payload_json text, created_at timestamp not null default current_timestamp)");
            statement.executeUpdate("drop table if exists mt101_failed_record");
            statement.executeUpdate("drop table if exists mt101_fragment_record");
            statement.executeUpdate("drop table if exists mt101_build_fragment");
            statement.executeUpdate("create table mt101_build_fragment ("
                    + "id bigserial primary key, fragment_set_id varchar(80) not null,"
                    + "process_execution_id bigint, task_definition_id bigint, source_table varchar(255),"
                    + "staging_id_from bigint, staging_id_to bigint, source_record_from bigint, source_record_to bigint,"
                    + "source_file_hash varchar(64), fragment_index integer not null, fragment_total integer not null,"
                    + "senders_reference varchar(16) not null, status varchar(20) not null default 'BUILT',"
                    + "error_message text, created_at timestamp not null default current_timestamp,"
                    + "updated_at timestamp not null default current_timestamp)");
            statement.executeUpdate("create table mt101_fragment_record ("
                    + "id bigserial primary key, fragment_id bigint references mt101_build_fragment(id),"
                    + "fragment_set_id varchar(80) not null, original_fragment_set_id varchar(80), source_file_hash varchar(64),"
                    + "source_record_number bigint not null, staging_id bigint,"
                    + "original_senders_reference varchar(16), original_transaction_reference varchar(35),"
                    + "rebuild_run_id varchar(80),"
                    + "current_senders_reference varchar(16), current_transaction_reference varchar(35))");
            statement.executeUpdate("create table mt101_failed_record ("
                    + "id bigserial primary key, fragment_set_id varchar(80) not null,"
                    + "senders_reference varchar(16), transaction_reference varchar(35), source_file_hash varchar(64),"
                    + "source_record_number bigint, staging_id bigint, source_task_definition_id bigint, source_name varchar(255),"
                    + "rule_code varchar(80), rule_set varchar(50), severity char(1),"
                    + "message text, status varchar(40) not null default 'QUARANTINED',"
                    + "created_at timestamp not null default current_timestamp, resolved_at timestamp)");
            statement.executeUpdate("create table mt101_archive ("
                    + "id bigserial primary key, senders_reference varchar(16) not null,"
                    + "process_execution_id bigint,"
                    + "status varchar(20) not null default 'ARCHIVED',"
                    + "created_at timestamp not null default current_timestamp,"
                    + "updated_at timestamp not null default current_timestamp)");
            statement.executeUpdate("create table mt101_confirmation ("
                    + "id bigserial primary key, archive_id bigint references mt101_archive(id),"
                    + "confirmation_type varchar(10) not null, gateway_reference varchar(35),"
                    + "confirmed_status varchar(20), received_at timestamp not null default current_timestamp)");
            statement.executeUpdate("create table mt101_reconciliation_exception ("
                    + "id bigserial primary key, as_of_date date not null default '" + LocalDate.now() + "',"
                    + "archive_id bigint references mt101_archive(id), confirmation_id bigint,"
                    + "exception_type varchar(30) not null, details text, resolved_at timestamp)");
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
