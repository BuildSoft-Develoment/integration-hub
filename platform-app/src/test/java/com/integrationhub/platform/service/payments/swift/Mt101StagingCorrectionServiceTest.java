package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101StagingRecordRepository;
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
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Correccion de payload de una fila fallida en staging desde la API (sin tocar BD a
 * mano), paso previo al rebuild correctivo. Con auditoria STAGING_ROW_CORRECTED.
 */
@Testcontainers
class Mt101StagingCorrectionServiceTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("mt101_correction")
            .withUsername("postgres")
            .withPassword("postgres");

    private DataSource dataSource;
    private Mt101StagingCorrectionService service;
    private final List<AuditEnvelope> emitted = new ArrayList<>();

    @BeforeEach
    void setUp() throws Exception {
        dataSource = dataSource();
        emitted.clear();
        service = new Mt101StagingCorrectionService(dataSource, null,
                new Mt101FragmentRepository(), new Mt101StagingRecordRepository(), emitted::addAll);
        prepareSchema();
    }

    @Test
    void correctsStagingPayloadAndAudits() throws Exception {
        // Fragmento del set (resuelve ejecucion 100 + hash) + fila 25 fallida en staging.
        insertFragment();
        insertStaging(24, "{\"cargos\":\"BAD\"}");

        var result = service.correctRow(null, "SET", 25, "{\"cargos\":\"OUR\"}");

        assertEquals(1, result.updated());
        assertEquals("{\"cargos\":\"OUR\"}", stagingPayload(24), "el payload de la fila 25 quedo corregido");
        assertEquals(1, emitted.size());
        assertEquals("STAGING_ROW_CORRECTED", emitted.get(0).stage());
        assertEquals(25L, emitted.get(0).recordNumber());
        assertEquals("hashA", emitted.get(0).sourceFileHash());
    }

    @Test
    void failsWhenRowDoesNotExist() throws Exception {
        insertFragment();
        var error = assertThrows(IllegalArgumentException.class,
                () -> service.correctRow(null, "SET", 9999, "{\"cargos\":\"OUR\"}"));
        assertTrue(error.getMessage().contains("no staging row"));
    }

    private void insertFragment() throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var st = connection.prepareStatement(
                     "insert into mt101_build_fragment (fragment_set_id, process_execution_id, source_table, "
                             + "source_file_hash, fragment_index, fragment_total, senders_reference) "
                             + "values ('SET', 100, 'staging_record', 'hashA', 1, 1, 'P1')")) {
            st.executeUpdate();
        }
    }

    private void insertStaging(long recordIndex, String payload) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var st = connection.prepareStatement(
                     "insert into staging_record (process_execution_id, task_definition_id, record_index, payload_json) "
                             + "values (100, 9, ?, ?)")) {
            st.setLong(1, recordIndex);
            st.setString(2, payload);
            st.executeUpdate();
        }
    }

    private String stagingPayload(long recordIndex) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var st = connection.prepareStatement(
                     "select payload_json from staging_record where process_execution_id = 100 and record_index = ?")) {
            st.setLong(1, recordIndex);
            try (var rs = st.executeQuery()) {
                return rs.next() ? rs.getString(1) : null;
            }
        }
    }

    private void prepareSchema() throws SQLException {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("drop table if exists staging_record");
            statement.executeUpdate("drop table if exists mt101_build_fragment");
            statement.executeUpdate("create table staging_record ("
                    + "id bigserial primary key, process_execution_id bigint, task_definition_id bigint,"
                    + "record_index bigint, source_name varchar(255), source_file_hash varchar(64),"
                    + "payload_json text, created_at timestamp not null default current_timestamp)");
            statement.executeUpdate("create table mt101_build_fragment ("
                    + "id bigserial primary key, fragment_set_id varchar(80) not null,"
                    + "process_execution_id bigint, task_definition_id bigint, source_table varchar(255),"
                    + "staging_id_from bigint, staging_id_to bigint, source_record_from bigint, source_record_to bigint,"
                    + "source_file_hash varchar(64), fragment_index integer not null, fragment_total integer not null,"
                    + "senders_reference varchar(16) not null, status varchar(20) not null default 'BUILT',"
                    + "error_message text, created_at timestamp not null default current_timestamp,"
                    + "updated_at timestamp not null default current_timestamp)");
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
