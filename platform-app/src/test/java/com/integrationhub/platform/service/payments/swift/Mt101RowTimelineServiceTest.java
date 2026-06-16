package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.platform.repository.payments.swift.Mt101FailedRecordRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
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
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
                new Mt101FragmentRepository(), new Mt101FailedRecordRepository());
        prepareSchema();
    }

    @Test
    void buildsOperationalTimelineForFailedRow() throws Exception {
        // Fragmento P1 cubre filas 1-50 (staging 1000-1049), rechazado; fila 25 en cuarentena.
        insertFragment("P1", 1000, 1049, 1, 50, 1, 2, "REJECTED", "STRUCT.X: bad charges");
        insertQuarantine("P1", "T25", 25, "STRUCT.X", "bad charges");

        var tl = service.rowTimeline(null, "SET", 25);

        assertEquals(4, tl.size());
        assertEquals("RECORD_INGESTED", tl.get(0).stage());
        assertTrue(tl.get(0).detail().contains("staging id 1024"), "id exacto = 1000 + (25-1)");
        assertEquals("RECORD_BUILT", tl.get(1).stage());
        assertTrue(tl.get(1).detail().contains(":20: P1") && tl.get(1).detail().contains("1/2"));
        assertEquals("RECORD_VALIDATION_ISSUE", tl.get(2).stage());
        assertTrue(tl.get(2).detail().contains("STRUCT.X") && tl.get(2).detail().contains(":21: T25"));
        assertEquals("RECORD_REJECTED", tl.get(3).stage());
    }

    @Test
    void emptyWhenNoFragmentCoversRow() throws Exception {
        insertFragment("P1", 1000, 1049, 1, 50, 1, 2, "VALIDATED", null);
        assertEquals(List.of(), service.rowTimeline(null, "SET", 9999));
    }

    private void insertFragment(String ref, long stagingFrom, long stagingTo, long recFrom, long recTo,
                                int idx, int total, String status, String error) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var st = connection.prepareStatement(
                     "insert into mt101_build_fragment (fragment_set_id, process_execution_id, task_definition_id, "
                             + "source_table, staging_id_from, staging_id_to, source_record_from, source_record_to, "
                             + "source_file_hash, fragment_index, fragment_total, senders_reference, status, error_message) "
                             + "values ('SET', 1, 1, 'staging_record', ?, ?, ?, ?, 'hashA', ?, ?, ?, ?, ?)")) {
            st.setLong(1, stagingFrom);
            st.setLong(2, stagingTo);
            st.setLong(3, recFrom);
            st.setLong(4, recTo);
            st.setInt(5, idx);
            st.setInt(6, total);
            st.setString(7, ref);
            st.setString(8, status);
            st.setString(9, error);
            st.executeUpdate();
        }
    }

    private void insertQuarantine(String ref, String txRef, long recordNumber, String rule, String message) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var st = connection.prepareStatement(
                     "insert into mt101_failed_record (fragment_set_id, senders_reference, transaction_reference, "
                             + "source_record_number, rule_code, message, status) values ('SET', ?, ?, ?, ?, ?, 'QUARANTINED')")) {
            st.setString(1, ref);
            st.setString(2, txRef);
            st.setLong(3, recordNumber);
            st.setString(4, rule);
            st.setString(5, message);
            st.executeUpdate();
        }
    }

    private void prepareSchema() throws SQLException {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("drop table if exists mt101_failed_record");
            statement.executeUpdate("drop table if exists mt101_build_fragment");
            statement.executeUpdate("create table mt101_build_fragment ("
                    + "id bigserial primary key, fragment_set_id varchar(80) not null,"
                    + "process_execution_id bigint, task_definition_id bigint, source_table varchar(255),"
                    + "staging_id_from bigint, staging_id_to bigint, source_record_from bigint, source_record_to bigint,"
                    + "source_file_hash varchar(64), fragment_index integer not null, fragment_total integer not null,"
                    + "senders_reference varchar(16) not null, status varchar(20) not null default 'BUILT',"
                    + "error_message text, created_at timestamp not null default current_timestamp,"
                    + "updated_at timestamp not null default current_timestamp)");
            statement.executeUpdate("create table mt101_failed_record ("
                    + "id bigserial primary key, fragment_set_id varchar(80) not null,"
                    + "senders_reference varchar(16), transaction_reference varchar(35), source_file_hash varchar(64),"
                    + "source_record_number bigint, rule_code varchar(80), rule_set varchar(50), severity char(1),"
                    + "message text, status varchar(20) not null default 'QUARANTINED',"
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
