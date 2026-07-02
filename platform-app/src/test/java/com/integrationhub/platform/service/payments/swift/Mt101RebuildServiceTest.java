package com.integrationhub.platform.service.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.integrationhub.platform.provider.task.payments.swift.Mt101BuildFromTableTaskProvider;
import com.integrationhub.platform.provider.task.payments.swift.Mt101FragmentStore;
import com.integrationhub.platform.repository.payments.swift.Mt101FailedRecordRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
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
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Rebuild selectivo desde cuarentena: re-construye SOLO las filas corregidas en un
 * set correctivo y supersede los fragmentos originales. Cierra el ciclo
 * "reprocesar solo lo necesario".
 *
 * @covers spec 008-mensajeria-pagos RF-022
 */
@Testcontainers
class Mt101RebuildServiceTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("mt101_rebuild")
            .withUsername("postgres")
            .withPassword("postgres");

    private DataSource dataSource;
    private Mt101FragmentStore fragmentStore;
    private Mt101RebuildService service;
    private final AtomicReference<Map<String, Object>> capturedConfig = new AtomicReference<>();

    @BeforeEach
    void setUp() throws Exception {
        dataSource = dataSource();
        var objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        fragmentStore = new Mt101FragmentStore(dataSource, null, objectMapper);

        // Build provider falso: captura el config correctivo y simula 1 fragmento.
        var fakeBuild = new Mt101BuildFromTableTaskProvider(null, null, new JsonConfigurationMapper(), null, null) {
            @Override
            public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
                capturedConfig.set(configuration);
                insertCorrectiveLineage(configuration);
                return TaskResult.success("fake build", Map.of("fragmentCount", 1));
            }
        };
        Mt101BuildConfigSource configSource = taskDefinitionId -> Map.of(
                "sequenceA", Map.of("sendersReferenceTemplate", "P${messageIndex}"),
                "transactionMappings", Map.of("transactionReferenceTemplate", "TX-${recordNumber}"),
                "format", "JSON");
        service = new Mt101RebuildService(dataSource, null, fakeBuild, configSource,
                new Mt101FailedRecordRepository(), new Mt101FragmentRepository());
        prepareSchema();
    }

    @Test
    void rebuildsAllRowsOfAffectedFragmentNotJustFailed() throws Exception {
        // Fragmento P1 cubre filas 1-50 (50 transacciones); SOLO la fila 25 fallo.
        insertFragmentWithLineage("P1", 1, 50);
        setFragmentStatus("P1", "REJECTED");
        insertQuarantine("P1", "TX-25", 25L, "STRUCT.X");

        var requested = service.requestRebuildFromQuarantine(null, "SET", "ana");
        assertEquals("REQUESTED", requested.status());
        // B1: el id correctivo lo genera el servidor (<original>-FIX-<referenceCode>).
        var fix = requested.correctiveSetId();
        assertTrue(fix.startsWith("SET-FIX-"), "el correctiveSetId lo genera el servidor: " + fix);
        service.approveRebuildRun(null, fix, "luis");
        var result = service.executeApprovedRebuildRun(null, fix, "maria");

        assertEquals(fix, result.correctiveSetId());
        // P0: reconstruye las 50 filas del fragmento afectado, no solo la fila 25.
        assertEquals(50, result.rebuiltRows(), "rebuild de TODO el fragmento, no solo la fila fallida");
        assertEquals(1, result.supersededFragments());
        assertEquals(1, result.resolvedQuarantine());

        var config = capturedConfig.get();
        assertEquals(fix, config.get("fragmentSetIdTemplate"));
        assertEquals(true, config.get("replaceExisting"));
        @SuppressWarnings("unchecked")
        var source = (Map<String, Object>) config.get("source");
        assertEquals(fix, source.get("rebuildRunId"),
                "la seleccion aprobada via tabla gobierna el rebuild");
        assertTrue(!source.containsKey("recordIndexIn"), "no debe construir un IN masivo en config");
        @SuppressWarnings("unchecked")
        var sequenceA = (Map<String, Object>) config.get("sequenceA");
        assertTrue(String.valueOf(sequenceA.get("sendersReferenceTemplate")).startsWith("R"),
                "el set correctivo usa :20: propio");
        assertTrue(String.valueOf(sequenceA.get("sendersReferenceTemplate")).contains("${messageIndex}"),
                "el :20: correctivo sigue siendo unico por fragmento");
        @SuppressWarnings("unchecked")
        var mappings = (Map<String, Object>) config.get("transactionMappings");
        assertEquals("C${_sourceRecordNumber}", mappings.get("transactionReferenceTemplate"),
                "el :21: correctivo se deriva de la fila fuente estable");

        assertEquals("SUPERSEDED", fragmentStatus("SET", "P1"));
        assertEquals(fix, supersededBy("SET", "P1"));
        assertEquals("REBUILD_PENDING_VALIDATION", quarantineStatus("SET"));
        assertEquals("BUILT", rebuildRunStatus(fix));
    }

    @Test
    void governedFlowRejectsSelfApprovalAndAllowsDifferentApprover() throws Exception {
        insertFragmentWithLineage("P1", 1, 50);
        setFragmentStatus("P1", "REJECTED");
        insertQuarantine("P1", "TX-25", 25L, "STRUCT.X");

        var requested = service.requestRebuildFromQuarantine(null, "SET", "ana");
        assertEquals("REQUESTED", requested.status());
        var fix = requested.correctiveSetId();

        // Segregacion de funciones: el solicitante no puede aprobar su propio rebuild.
        assertThrows(IllegalArgumentException.class,
                () -> service.approveRebuildRun(null, fix, "ana"));

        // Un aprobador distinto si puede; luego se ejecuta.
        var approved = service.approveRebuildRun(null, fix, "luis");
        assertEquals("APPROVED", approved.status());
        var result = service.executeApprovedRebuildRun(null, fix, "maria");
        assertEquals(50, result.rebuiltRows());
        assertEquals("REBUILD_PENDING_VALIDATION", quarantineStatus("SET"));
        assertEquals("BUILT", rebuildRunStatus(fix));
    }

    @Test
    void synchronizeLifecycleAdvancesQuarantineUntilFinancialClosure() throws Exception {
        insertFragmentWithLineage("P1", 1, 50);
        setFragmentStatus("P1", "REJECTED");
        insertQuarantine("P1", "TX-25", 25L, "STRUCT.X");

        var fix = service.requestRebuildFromQuarantine(null, "SET", "ana").correctiveSetId();
        service.approveRebuildRun(null, fix, "luis");
        service.executeApprovedRebuildRun(null, fix, "maria");

        setCorrectiveFragmentStatus(fix, "RTEST1", "VALIDATED");
        assertEquals(1, service.synchronizeLifecycle(null, "SET"));
        assertEquals("VALIDATED", rebuildRunStatus(fix));
        assertEquals("REBUILD_VALIDATED", quarantineStatus("SET"));

        setCorrectiveFragmentStatus(fix, "RTEST1", "ARCHIVED");
        assertEquals(1, service.synchronizeLifecycle(null, "SET"));
        assertEquals("ARCHIVED", rebuildRunStatus(fix));
        assertEquals("REBUILD_ARCHIVED", quarantineStatus("SET"));

        setCorrectiveFragmentStatus(fix, "RTEST1", "SENT");
        assertEquals(1, service.synchronizeLifecycle(null, "SET"));
        assertEquals("SENT", rebuildRunStatus(fix));
        assertEquals("REBUILD_SENT", quarantineStatus("SET"));

        upsertArchive("RTEST1", "CONFIRMED");
        assertEquals(1, service.synchronizeLifecycle(null, "SET"));
        assertEquals("CONFIRMED", rebuildRunStatus(fix));
        assertEquals("REBUILD_CONFIRMED", quarantineStatus("SET"));

        upsertArchive("RTEST1", "RECONCILED");
        assertEquals(1, service.synchronizeLifecycle(null, "SET"));
        assertEquals("RECONCILED", rebuildRunStatus(fix));
        assertEquals("RESOLVED", quarantineStatus("SET"));

        assertEquals(0, service.synchronizeLifecycle(null, "SET"),
                "no debe reescribir si ya no hay avance de lifecycle");
    }

    @Test
    void schedulerDiscoversActiveRunsInNonDefaultJdbcConnections() throws Exception {
        var remoteDataSource = schemaDataSource("remote_scheduler");
        createSchema("remote_scheduler");
        prepareSchema(remoteDataSource);
        insertRemoteActiveRun(remoteDataSource);

        var remotePool = new ConnectionPoolManager(null, null) {
            @Override
            public List<String> activeJdbcConnectionRefs() {
                return List.of("remote-jdbc");
            }

            @Override
            public DataSource resolveJdbcDataSource(String connectionRef) {
                assertEquals("remote-jdbc", connectionRef);
                return remoteDataSource;
            }
        };
        var schedulerService = new Mt101RebuildService(dataSource, remotePool, null, null,
                new Mt101FailedRecordRepository(), new Mt101FragmentRepository());

        assertEquals("BUILT", queryString(remoteDataSource,
                "select status from mt101_rebuild_run where rebuild_run_id = ?", "FIX-REMOTE"));

        assertEquals(1, schedulerService.synchronizeActiveLifecycles());

        assertEquals("ARCHIVED", queryString(remoteDataSource,
                "select status from mt101_rebuild_run where rebuild_run_id = ?", "FIX-REMOTE"));
        assertEquals(null, queryString("select status from mt101_rebuild_run where rebuild_run_id = ?", "FIX-REMOTE"),
                "el run no existe en default; el avance vino de la conexion JDBC activa");
    }

    @Test
    void failsWhenNoQuarantinedRows() throws Exception {
        insertFragmentWithLineage("P1", 2, 2);

        var error = assertThrows(IllegalArgumentException.class,
                () -> service.requestRebuildFromQuarantine(null, "SET", "operator"));
        assertTrue(error.getMessage().contains("no quarantined rows"));
    }

    @Test
    void rejectsRebuildWhenAffectedFragmentWasAlreadySent() throws Exception {
        insertFragmentWithLineage("P1", 1, 50);
        setFragmentStatus("P1", "SENT");
        insertQuarantine("P1", "TX-25", 25L, "STRUCT.X");

        var error = assertThrows(IllegalArgumentException.class,
                () -> service.requestRebuildFromQuarantine(null, "SET", "operator"));

        assertTrue(error.getMessage().contains("only REJECTED"),
                () -> "mensaje inesperado: " + error.getMessage());
        assertEquals("SENT", fragmentStatus("SET", "P1"), "no supersede fragmentos ya enviados");
        assertEquals("QUARANTINED", quarantineStatus("SET"), "la cuarentena no se resuelve si no hubo rebuild seguro");
    }

    @Test
    void executeRequiresApproval() throws Exception {
        insertFragmentWithLineage("P1", 1, 50);
        setFragmentStatus("P1", "REJECTED");
        insertQuarantine("P1", "TX-25", 25L, "STRUCT.X");

        var run = service.requestRebuildFromQuarantine(null, "SET", "operator");
        assertEquals("REQUESTED", run.status());
        var fix = run.correctiveSetId();

        var error = assertThrows(IllegalArgumentException.class,
                () -> service.executeApprovedRebuildRun(null, fix, "runner"));
        assertTrue(error.getMessage().contains("must be APPROVED"));

        var approved = service.approveRebuildRun(null, fix, "approver");
        assertEquals("APPROVED", approved.status());
    }

    @Test
    void rejectsPreviousDataWithoutFragmentRecordLineage() throws Exception {
        fragmentStore.insertFragment(null, "SET", 100L, 20L, "staging_record",
                1, 50, 1, 1, sampleMessage("P1"));
        setFragmentStatus("P1", "REJECTED");
        insertQuarantine("P1", "TX-25", 25L, "STRUCT.X");

        var error = assertThrows(IllegalArgumentException.class,
                () -> service.requestRebuildFromQuarantine(null, "SET", "operator"));

        assertTrue(error.getMessage().contains("mt101_fragment_record"),
                () -> "mensaje inesperado: " + error.getMessage());
    }

    private void insertFragmentWithLineage(String reference, long rowFrom, long rowTo) {
        var sourceRecords = new java.util.LinkedHashMap<String, Long>();
        var stagingIds = new java.util.LinkedHashMap<Long, Long>();
        for (long row = rowFrom; row <= rowTo; row++) {
            sourceRecords.put("TX-" + row, row);
            stagingIds.put(row, 10_000L + row);
        }
        fragmentStore.insertFragments(null, List.of(new Mt101FragmentStore.FragmentInsert(
                "SET", 100L, 20L, "staging_record",
                rowFrom, rowTo, rowFrom, rowTo, "hashA", sourceRecords, stagingIds,
                1, 1, sampleMessage(reference))));
    }

    private void insertQuarantine(String sendersReference, String transactionReference,
                                  long sourceRecordNumber, String ruleCode) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "insert into mt101_failed_record (fragment_set_id, senders_reference, transaction_reference, "
                             + "source_file_hash, source_record_number, staging_id, rule_code, status) "
                             + "values ('SET', ?, ?, 'hashA', ?, ?, ?, 'QUARANTINED')")) {
            statement.setString(1, sendersReference);
            statement.setString(2, transactionReference);
            statement.setLong(3, sourceRecordNumber);
            statement.setLong(4, 10_000L + sourceRecordNumber);
            statement.setString(5, ruleCode);
            statement.executeUpdate();
        }
    }

    private void insertCorrectiveLineage(Map<String, Object> configuration) {
        try (Connection connection = dataSource.getConnection()) {
            var correctiveSetId = String.valueOf(configuration.get("fragmentSetIdTemplate"));
            @SuppressWarnings("unchecked")
            var source = (Map<String, Object>) configuration.get("source");
            var rebuildRunId = String.valueOf(source.get("rebuildRunId"));
            var fragmentId = insertCorrectiveFragment(connection, correctiveSetId);
            try (var select = connection.prepareStatement("""
                         select source_file_hash, source_record_number, staging_id,
                                source_task_definition_id, source_name,
                                original_senders_reference, original_transaction_reference
                           from mt101_rebuild_selection
                          where rebuild_run_id = ?
                          order by source_record_number
                    """);
                 var insert = connection.prepareStatement("""
                         insert into mt101_fragment_record
                         (fragment_id, fragment_set_id, original_fragment_set_id, source_file_hash, source_record_number, staging_id,
                          source_task_definition_id, source_name,
                          original_senders_reference, original_transaction_reference,
                          current_senders_reference, current_transaction_reference, rebuild_run_id)
                         values (?, ?, 'SET', ?, ?, ?, ?, ?, ?, ?, 'RTEST1', ?, ?)
                    """)) {
                select.setString(1, rebuildRunId);
                try (var rs = select.executeQuery()) {
                    while (rs.next()) {
                        insert.setLong(1, fragmentId);
                        insert.setString(2, correctiveSetId);
                        insert.setString(3, rs.getString("source_file_hash"));
                        insert.setLong(4, rs.getLong("source_record_number"));
                        insert.setLong(5, rs.getLong("staging_id"));
                        var sourceTask = rs.getObject("source_task_definition_id");
                        if (sourceTask == null) {
                            insert.setNull(6, java.sql.Types.BIGINT);
                        } else {
                            insert.setLong(6, rs.getLong("source_task_definition_id"));
                        }
                        insert.setString(7, rs.getString("source_name"));
                        insert.setString(8, rs.getString("original_senders_reference"));
                        insert.setString(9, rs.getString("original_transaction_reference"));
                        insert.setString(10, "C" + rs.getLong("source_record_number"));
                        insert.setString(11, rebuildRunId);
                        insert.addBatch();
                    }
                }
                insert.executeBatch();
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot seed fake corrective lineage", error);
        }
    }

    private long insertCorrectiveFragment(Connection connection, String correctiveSetId) throws SQLException {
        try (var statement = connection.prepareStatement("""
                    insert into mt101_build_fragment
                    (fragment_set_id, process_execution_id, task_definition_id, source_table,
                     source_row_from, source_row_to, staging_id_from, staging_id_to,
                     source_record_from, source_record_to, source_file_hash, source_records_json,
                     fragment_index, fragment_total, senders_reference, payload_hash, raw_payload, message_json, status)
                    values (?, 100, 20, 'staging_record', 1, 50, 1, 50, 1, 50, 'hashA', '{}',
                            1, 1, 'RTEST1', repeat('1', 64), '{}', '{}', 'BUILT')
                    returning id
                """)) {
            statement.setString(1, correctiveSetId);
            try (var rs = statement.executeQuery()) {
                rs.next();
                return rs.getLong(1);
            }
        }
    }

    private String fragmentStatus(String setId, String reference) throws SQLException {
        return queryString("select status from mt101_build_fragment where fragment_set_id = ? and senders_reference = ?",
                setId, reference);
    }

    private void setFragmentStatus(String reference, String status) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "update mt101_build_fragment set status = ? where fragment_set_id = 'SET' and senders_reference = ?")) {
            statement.setString(1, status);
            statement.setString(2, reference);
            statement.executeUpdate();
        }
    }

    private void setCorrectiveFragmentStatus(String setId, String reference, String status) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "update mt101_build_fragment set status = ? where fragment_set_id = ? and senders_reference = ?")) {
            statement.setString(1, status);
            statement.setString(2, setId);
            statement.setString(3, reference);
            statement.executeUpdate();
        }
    }

    private void upsertArchive(String reference, String status) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement("""
                     insert into mt101_archive (senders_reference, process_execution_id, status)
                     values (?, 100, ?)
                     on conflict (senders_reference, process_execution_id)
                     do update set status = excluded.status
                     """)) {
            statement.setString(1, reference);
            statement.setString(2, status);
            statement.executeUpdate();
        }
    }

    private String supersededBy(String setId, String reference) throws SQLException {
        return queryString("select superseded_by from mt101_build_fragment where fragment_set_id = ? and senders_reference = ?",
                setId, reference);
    }

    private String quarantineStatus(String setId) throws SQLException {
        return queryString("select status from mt101_failed_record where fragment_set_id = ?", setId);
    }

    private String rebuildRunStatus(String runId) throws SQLException {
        return queryString("select status from mt101_rebuild_run where rebuild_run_id = ?", runId);
    }

    private String queryString(String sql, String... params) throws SQLException {
        return queryString(dataSource, sql, params);
    }

    private String queryString(DataSource targetDataSource, String sql, String... params) throws SQLException {
        try (Connection connection = targetDataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) {
                statement.setString(i + 1, params[i]);
            }
            try (var rs = statement.executeQuery()) {
                return rs.next() ? rs.getString(1) : null;
            }
        }
    }

    private Mt101Message sampleMessage(String reference) {
        return new Mt101Message(
                new Mt101Message.Envelope("SGOBFRPPAXXX", "BCPLPEPLXXXX", "uetr-" + reference, "N"),
                new Mt101Message.SequenceA(reference, null, 1, 1, LocalDate.of(2026, 6, 12),
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
        prepareSchema(dataSource);
    }

    private void prepareSchema(DataSource targetDataSource) throws SQLException {
        try (Connection connection = targetDataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("drop table if exists mt101_rebuild_selection");
            statement.executeUpdate("drop table if exists mt101_rebuild_run");
            statement.executeUpdate("drop sequence if exists mt101_rebuild_reference_seq");
            statement.executeUpdate("create sequence mt101_rebuild_reference_seq");
            statement.executeUpdate("drop table if exists mt101_failed_record");
            statement.executeUpdate("drop table if exists mt101_fragment_record");
            statement.executeUpdate("drop table if exists mt101_build_fragment");
            statement.executeUpdate("create table mt101_build_fragment ("
                    + "id bigserial primary key, fragment_set_id varchar(80) not null,"
                    + "process_execution_id bigint, task_definition_id bigint, source_table varchar(255),"
                    + "source_row_from bigint, source_row_to bigint, staging_id_from bigint, staging_id_to bigint,"
                    + "source_record_from bigint, source_record_to bigint, source_file_hash varchar(64),"
                    + "source_records_json text, superseded_by varchar(80),"
                    + "fragment_index integer not null, fragment_total integer not null,"
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
                    + "staging_id bigint, source_task_definition_id bigint, source_name varchar(255),"
                    + "original_senders_reference varchar(16),"
                    + "original_transaction_reference varchar(35),"
                    + "current_senders_reference varchar(16),"
                    + "current_transaction_reference varchar(35),"
                    + "rebuild_run_id varchar(80),"
                    + "status varchar(30) not null default 'BUILT',"
                    + "created_at timestamp not null default current_timestamp)");
            statement.executeUpdate("create unique index ux_mt101_fragment_record_current_r on mt101_fragment_record "
                    + "(fragment_set_id, coalesce(source_file_hash, ''), source_record_number)");
            statement.executeUpdate("create table mt101_rebuild_run ("
                    + "rebuild_run_id varchar(80) primary key,"
                    + "original_fragment_set_id varchar(80) not null,"
                    + "corrective_set_id varchar(80) not null,"
                    + "status varchar(30) not null default 'REQUESTED',"
                    + "requested_by varchar(120), approved_by varchar(120), executed_by varchar(120),"
                    + "request_reason text, approval_reason text,"
                    + "selected_rows bigint not null default 0,"
                    + "affected_fragments integer not null default 0,"
                    + "error_message text, reference_code varchar(12), connection_ref varchar(120),"
                    + "pay_status varchar(30) not null default 'NOT_REQUESTED',"
                    + "pay_requested_by varchar(120), pay_requested_at timestamp,"
                    + "pay_approved_by varchar(120), pay_approved_at timestamp,"
                    + "pay_claimed_by varchar(120), pay_claimed_at timestamp,"
                    + "pay_requested_payload_hash varchar(64), pay_claimed_payload_hash varchar(64),"
                    + "pay_lease_until timestamp, pay_uncertain_reason text,"
                    + "pay_completed_at timestamp, pay_error_message text,"
                    + "pay_request_reason text, pay_request_ticket varchar(120),"
                    + "pay_resolved_by varchar(120), pay_resolved_at timestamp, pay_resolution_reason text,"
                    + "created_at timestamp not null default current_timestamp,"
                    + "approved_at timestamp, executed_at timestamp, built_at timestamp, completed_at timestamp,"
                    + "last_lifecycle_sync_at timestamp,"
                    + "updated_at timestamp not null default current_timestamp)");
            statement.executeUpdate("create table mt101_rebuild_selection ("
                    + "id bigserial primary key,"
                    + "rebuild_run_id varchar(80) not null references mt101_rebuild_run(rebuild_run_id) on delete cascade,"
                    + "fragment_set_id varchar(80) not null,"
                    + "source_file_hash varchar(64),"
                    + "source_record_number bigint not null,"
                    + "record_index bigint not null,"
                    + "staging_id bigint, source_task_definition_id bigint, source_name varchar(255),"
                    + "original_senders_reference varchar(16),"
                    + "original_transaction_reference varchar(35),"
                    + "corrective_senders_reference varchar(16), corrective_transaction_reference varchar(35),"
                    + "status varchar(30) not null default 'SELECTED',"
                    + "lifecycle_updated_at timestamp,"
                    + "created_at timestamp not null default current_timestamp)");
            statement.executeUpdate("alter table mt101_rebuild_selection "
                    + "add column if not exists selected_payload_hash varchar(64), "
                    + "add column if not exists selected_staging_version bigint");
            statement.executeUpdate("create unique index ux_mt101_rebuild_selection_row_r on mt101_rebuild_selection "
                    + "(rebuild_run_id, coalesce(source_file_hash, ''), source_record_number, coalesce(staging_id, 0))");
            statement.executeUpdate("drop table if exists staging_record");
            statement.executeUpdate("create table staging_record ("
                    + "id bigserial primary key, task_definition_id bigint, source_name varchar(255),"
                    + "payload_json text, version bigint not null default 0)");
            statement.executeUpdate("create table mt101_failed_record ("
                    + "id bigserial primary key, fragment_set_id varchar(80) not null,"
                    + "senders_reference varchar(16), transaction_reference varchar(35), source_file_hash varchar(64),"
                    + "source_record_number bigint, staging_id bigint, source_task_definition_id bigint, source_name varchar(255),"
                    + "rule_code varchar(80), rule_set varchar(50), severity char(1),"
                    + "message text, status varchar(40) not null default 'QUARANTINED',"
                    + "created_at timestamp not null default current_timestamp, resolved_at timestamp)");
            statement.executeUpdate("drop table if exists mt101_archive");
            statement.executeUpdate("create table mt101_archive ("
                    + "id bigserial primary key, senders_reference varchar(16) not null,"
                    + "process_execution_id bigint, status varchar(20) not null default 'ARCHIVED',"
                    + "created_at timestamp not null default current_timestamp,"
                    + "updated_at timestamp not null default current_timestamp)");
            statement.executeUpdate("create unique index ux_mt101_archive_ref_exec_r on mt101_archive "
                    + "(senders_reference, process_execution_id)");
        }
    }

    private DataSource dataSource() {
        var pgDataSource = new PGSimpleDataSource();
        pgDataSource.setURL(POSTGRES.getJdbcUrl());
        pgDataSource.setUser(POSTGRES.getUsername());
        pgDataSource.setPassword(POSTGRES.getPassword());
        return pgDataSource;
    }

    private DataSource schemaDataSource(String schema) {
        var pgDataSource = new PGSimpleDataSource();
        pgDataSource.setURL(POSTGRES.getJdbcUrl() + "&currentSchema=" + schema);
        pgDataSource.setUser(POSTGRES.getUsername());
        pgDataSource.setPassword(POSTGRES.getPassword());
        return pgDataSource;
    }

    private void createSchema(String schema) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("drop schema if exists " + schema + " cascade");
            statement.executeUpdate("create schema " + schema);
        }
    }

    private void insertRemoteActiveRun(DataSource targetDataSource) throws SQLException {
        try (Connection connection = targetDataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("""
                    insert into mt101_rebuild_run
                    (rebuild_run_id, original_fragment_set_id, corrective_set_id, status, connection_ref)
                    values ('FIX-REMOTE', 'SET-REMOTE', 'FIX-REMOTE', 'BUILT', 'remote-jdbc')
                    """);
            statement.executeUpdate("""
                    insert into mt101_build_fragment
                    (fragment_set_id, process_execution_id, task_definition_id, source_table,
                     source_row_from, source_row_to, fragment_index, fragment_total,
                     senders_reference, payload_hash, raw_payload, message_json, status)
                    values ('FIX-REMOTE', 200, 30, 'staging_record',
                            1, 1, 1, 1, 'RREMOTE1', repeat('7', 64), '{}', '{}', 'ARCHIVED')
                    """);
        }
    }
}
