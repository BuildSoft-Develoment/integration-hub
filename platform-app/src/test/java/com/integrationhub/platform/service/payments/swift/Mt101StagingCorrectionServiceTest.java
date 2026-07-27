package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.vertical.swift.mt101.repository.Mt101FragmentRepository;
import com.integrationhub.vertical.swift.mt101.repository.Mt101StagingRecordRepository;
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
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Correccion de payload de una fila fallida en staging desde la API (sin tocar BD a
 * mano), paso previo al rebuild correctivo. Con auditoria STAGING_ROW_CORRECTED.
 */
@Testcontainers
class Mt101StagingCorrectionServiceTest {

    private static final long STAGING_ID = 10025L;

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
        insertFragment("REJECTED");
        insertQuarantine(25);
        insertStaging(24, "{\"moneda\":\"PEN\",\"monto\":\"10.00\",\"cargos\":\"BAD\"}");

        var result = service.correctRow(null, "SET", "hashA", 25, STAGING_ID,
                "{\"cargos\":\"OUR\"}", null, null, null, null);

        assertEquals(1, result.updated());
        assertEquals("{\"moneda\":\"PEN\",\"monto\":\"10.00\",\"cargos\":\"OUR\"}", stagingPayload(24),
                "el patch corrige cargos sin borrar el resto del payload");
        assertEquals(1, emitted.size());
        assertEquals("STAGING_ROW_CORRECTED", emitted.get(0).stage());
        assertEquals(25L, emitted.get(0).recordNumber());
        assertEquals("hashA", emitted.get(0).sourceFileHash());
        assertTrue(emitted.get(0).attributes().get("changedFields").contains("cargos"));
        assertTrue(emitted.get(0).attributes().containsKey("oldPayloadHash"));
        assertTrue(emitted.get(0).attributes().containsKey("newPayloadHash"));
        assertEquals(1L, correctionAuditCount());
    }

    @Test
    void readRowExposesPhysicalLineForItem2() throws Exception {
        // item 2: readRow devuelve la LÍNEA FÍSICA del archivo (para "qué línea abrir"), no solo el ordinal lógico.
        insertFragment("REJECTED");
        insertQuarantine(25);
        insertStagingWithPhysicalLine(24, "{\"cargos\":\"BAD\"}", 26L); // registro lógico 25, línea física 26

        var view = service.readRow(null, "SET", "hashA", 25, STAGING_ID);

        assertEquals(25L, view.recordNumber(), "ordinal lógico visible al operador");
        assertEquals(26L, view.physicalLine(), "línea física real del archivo (con cabecera/multilínea)");
        assertNull(view.sheetName(), "CSV/TXT no tienen hoja");
    }

    @Test
    void appliesCorrectionWhenVersionMatchesAndBumpsVersion() throws Exception {
        insertFragment("REJECTED");
        insertQuarantine(25);
        insertStaging(24, "{\"cargos\":\"BAD\"}");

        var result = service.correctRow(null, "SET", "hashA", 25, STAGING_ID,
                "{\"cargos\":\"OUR\"}", "ana", 0L, null, null);

        assertEquals(1, result.updated());
        assertEquals(1L, result.version(), "la version se incrementa tras corregir");
        assertEquals("ana", emitted.get(0).attributes().get("correctedBy"));
    }

    @Test
    void rejectsCorrectionWhenVersionIsStale() throws Exception {
        insertFragment("REJECTED");
        insertQuarantine(25);
        insertStaging(24, "{\"cargos\":\"BAD\"}");

        // El operador trae version 5 pero la fila esta en version 0 -> conflicto.
        var error = assertThrows(Mt101StagingCorrectionService.StaleStagingRowException.class,
                () -> service.correctRow(null, "SET", "hashA", 25, STAGING_ID,
                        "{\"cargos\":\"OUR\"}", "ana", 5L, null, null));

        assertTrue(error.getMessage().contains("modified concurrently"));
        assertEquals("{\"cargos\":\"BAD\"}", stagingPayload(24), "no se pisa el payload en conflicto");
    }

    @Test
    void failsWhenRowDoesNotExist() throws Exception {
        insertFragment("REJECTED");
        insertQuarantine(25);
        var error = assertThrows(IllegalArgumentException.class,
                () -> service.correctRow(null, "SET", "hashA", 9999, STAGING_ID,
                        "{\"cargos\":\"OUR\"}", null, null, null, null));
        assertTrue(error.getMessage().contains("no quarantined row"));
    }

    @Test
    void rejectsCorrectionWhenRowIsNotQuarantined() throws Exception {
        insertFragment("REJECTED");
        insertStaging(24, "{\"cargos\":\"BAD\"}");

        var error = assertThrows(IllegalArgumentException.class,
                () -> service.correctRow(null, "SET", "hashA", 25, STAGING_ID,
                        "{\"cargos\":\"OUR\"}", null, null, null, null));

        assertTrue(error.getMessage().contains("no quarantined row"));
    }

    @Test
    void rejectsCorrectionWhenAffectedFragmentIsAlreadySent() throws Exception {
        insertFragment("SENT");
        insertQuarantine(25);
        insertStaging(24, "{\"cargos\":\"BAD\"}");

        var error = assertThrows(IllegalArgumentException.class,
                () -> service.correctRow(null, "SET", "hashA", 25, STAGING_ID,
                        "{\"cargos\":\"OUR\"}", null, null, null, null));

        assertTrue(error.getMessage().contains("must be REJECTED"));
    }

    private void insertFragment(String status) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var st = connection.prepareStatement(
                     "insert into mt101_build_fragment (fragment_set_id, process_execution_id, source_table, "
                             + "source_file_hash, source_record_from, source_record_to, fragment_index, fragment_total, "
                             + "senders_reference, status) "
                             + "values ('SET', 100, 'staging_record', 'hashA', 1, 50, 1, 1, 'P1', ?) returning id")) {
            st.setString(1, status);
            try (var rs = st.executeQuery()) {
                rs.next();
                insertFragmentRecord(connection, rs.getLong(1));
            }
        }
    }

    private void insertFragmentRecord(Connection connection, long fragmentId) throws SQLException {
        try (var st = connection.prepareStatement(
                "insert into mt101_fragment_record (fragment_id, fragment_set_id, source_file_hash, "
                        + "source_record_number, staging_id, current_senders_reference, current_transaction_reference) "
                        + "values (?, 'SET', 'hashA', 25, ?, 'P1', 'T25')")) {
            st.setLong(1, fragmentId);
            st.setLong(2, STAGING_ID);
            st.executeUpdate();
        }
    }

    private void insertQuarantine(long recordNumber) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var st = connection.prepareStatement(
                     "insert into mt101_failed_record (fragment_set_id, senders_reference, transaction_reference, "
                             + "source_file_hash, source_record_number, staging_id, rule_code, status) "
                             + "values ('SET', 'P1', 'T25', 'hashA', ?, ?, 'STRUCT.X', 'QUARANTINED')")) {
            st.setLong(1, recordNumber);
            st.setLong(2, STAGING_ID);
            st.executeUpdate();
        }
    }

    private void insertStaging(long recordIndex, String payload) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var st = connection.prepareStatement(
                     "insert into staging_record (id, process_execution_id, task_definition_id, record_index, source_file_hash, payload_json) "
                             + "values (?, 100, 9, ?, 'hashA', ?)")) {
            st.setLong(1, STAGING_ID);
            st.setLong(2, recordIndex);
            st.setString(3, payload);
            st.executeUpdate();
        }
    }

    private void insertStagingWithPhysicalLine(long recordIndex, String payload, long physicalLine) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var st = connection.prepareStatement(
                     "insert into staging_record (id, process_execution_id, task_definition_id, record_index, "
                             + "source_file_hash, payload_json, physical_line) values (?, 100, 9, ?, 'hashA', ?, ?)")) {
            st.setLong(1, STAGING_ID);
            st.setLong(2, recordIndex);
            st.setString(3, payload);
            st.setLong(4, physicalLine);
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

    private long correctionAuditCount() throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var st = connection.createStatement();
             var rs = st.executeQuery("select count(*) from mt101_staging_correction")) {
            rs.next();
            return rs.getLong(1);
        }
    }

    private void prepareSchema() throws SQLException {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("drop table if exists staging_record");
            statement.executeUpdate("drop table if exists mt101_staging_correction");
            statement.executeUpdate("drop table if exists mt101_failed_record");
            statement.executeUpdate("drop table if exists mt101_fragment_record");
            statement.executeUpdate("drop table if exists mt101_build_fragment");
            statement.executeUpdate("create table staging_record ("
                    + "id bigserial primary key, process_execution_id bigint, task_definition_id bigint,"
                    + "record_index bigint, source_name varchar(255), source_file_hash varchar(64),"
                    + "payload_json text, version bigint not null default 0,"
                    + "physical_line bigint, sheet_name varchar(255), sheet_row bigint,"
                    + "created_at timestamp not null default current_timestamp)");
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
                    + "source_record_number bigint, staging_id bigint, source_task_definition_id bigint, source_name varchar(255),"
                    + "rule_code varchar(80), rule_set varchar(50), severity char(1),"
                    + "message text, status varchar(40) not null default 'QUARANTINED',"
                    + "created_at timestamp not null default current_timestamp, resolved_at timestamp)");
            statement.executeUpdate("create table mt101_fragment_record ("
                    + "id bigserial primary key, fragment_id bigint references mt101_build_fragment(id),"
                    + "fragment_set_id varchar(80) not null, source_file_hash varchar(64),"
                    + "source_record_number bigint not null, staging_id bigint,"
                    + "current_senders_reference varchar(16), current_transaction_reference varchar(35))");
            statement.executeUpdate("create table mt101_staging_correction ("
                    + "id bigserial primary key, fragment_set_id varchar(80) not null,"
                    + "process_execution_id bigint not null, source_file_hash varchar(64) not null,"
                    + "source_record_number bigint not null, record_index bigint not null, staging_id bigint,"
                    + "old_payload_hash char(64), new_payload_hash char(64), changed_fields text,"
                    + "corrected_by varchar(120), correction_reason text, ticket_ref varchar(120),"
                    + "old_version bigint, new_version bigint,"
                    + "created_at timestamp not null default current_timestamp)");
            // B2: el servicio comprueba si la fila esta en un run APPROVED/BUILDING (lock).
            statement.executeUpdate("drop table if exists mt101_rebuild_selection");
            statement.executeUpdate("drop table if exists mt101_rebuild_run");
            statement.executeUpdate("create table mt101_rebuild_run ("
                    + "rebuild_run_id varchar(80) primary key, original_fragment_set_id varchar(80) not null,"
                    + "corrective_set_id varchar(80) not null, status varchar(30) not null default 'REQUESTED')");
            statement.executeUpdate("create table mt101_rebuild_selection ("
                    + "id bigserial primary key, rebuild_run_id varchar(80) not null references mt101_rebuild_run(rebuild_run_id),"
                    + "fragment_set_id varchar(80) not null, source_file_hash varchar(64),"
                    + "source_record_number bigint not null, staging_id bigint)");
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
