package com.integrationhub.platform.service.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.provider.task.payments.swift.Mt101BuildFromTableTaskProvider;
import com.integrationhub.platform.repository.payments.swift.Mt101FailedRecordRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101RebuildRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101ValidationIssueRepository;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
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
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Prueba de volumen para el ciclo nuevo: linaje relacional por fila, cuarentena
 * paginada y rebuild por tabla de seleccion, sin fallback a rangos/JSON historico.
 *
 * @covers spec 008-mensajeria-pagos RF-009, RF-022
 */
@Testcontainers
class Mt101LargeVolumeLineageRebuildTest {

    private static final int TOTAL_ROWS = 100_000;
    private static final int ROWS_PER_FRAGMENT = 50;
    private static final String SET_ID = "SET-100K";
    private static final String HASH = "hash-100k";
    private static final List<Long> BAD_ROWS = List.of(123L, 126L, 50_250L, 77_777L, 99_999L);

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("mt101_large_lineage")
            .withUsername("postgres")
            .withPassword("postgres");

    private DataSource dataSource;
    private Mt101QuarantineService quarantineService;
    private Mt101RebuildService rebuildService;
    private String fixSetId;
    private final AtomicReference<Map<String, Object>> capturedConfig = new AtomicReference<>();

    @BeforeEach
    void setUp() throws Exception {
        dataSource = dataSource();
        prepareSchema();
        seedOneHundredThousandRowsWithFailures();

        quarantineService = new Mt101QuarantineService(
                dataSource,
                null,
                new Mt101ValidationIssueRepository(),
                new Mt101FragmentRepository(),
                new Mt101FailedRecordRepository(),
                new ObjectMapper());

        var fakeBuild = new Mt101BuildFromTableTaskProvider(null, null, new JsonConfigurationMapper(), null, null) {
            @Override
            public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
                capturedConfig.set(configuration);
                insertCorrectiveLineage(configuration);
                return TaskResult.success("fake corrective build", Map.of("fragmentCount", affectedReferences().size()));
            }
        };
        Mt101BuildConfigSource configSource = taskDefinitionId -> Map.of(
                "sequenceA", Map.of("sendersReferenceTemplate", "P${messageIndex}"),
                "transactionMappings", Map.of("transactionReferenceTemplate", "TX-${recordNumber}"),
                "format", "JSON");
        rebuildService = new Mt101RebuildService(
                dataSource,
                null,
                fakeBuild,
                configSource,
                new Mt101FailedRecordRepository(),
                new Mt101FragmentRepository(),
                new Mt101RebuildRepository());
    }

    @Test
    void quarantinesMultipleFailuresAndRebuildsAffectedFragmentsFromSelectionTable() throws Exception {
        var quarantined = quarantineService.quarantineFromIssues(null, SET_ID, null);

        assertEquals(BAD_ROWS.size(), quarantined);
        assertEquals(BAD_ROWS.size(), count("mt101_failed_record"));
        for (var row : BAD_ROWS) {
            assertEquals(row, failedRowNumber("TX-" + row));
            assertEquals(referenceFor(row), failedSenderReference("TX-" + row));
        }

        var requested = rebuildService.requestRebuildFromQuarantine(null, SET_ID, "operator");
        assertEquals("REQUESTED", requested.status());
        // B1: el id correctivo lo genera el servidor (<original>-FIX-<referenceCode>).
        fixSetId = requested.correctiveSetId();
        assertTrue(fixSetId.startsWith(SET_ID + "-FIX-"), "id correctivo generado por servidor: " + fixSetId);
        assertEquals(affectedReferences().size(), requested.affectedFragments());
        assertEquals(affectedReferences().size() * ROWS_PER_FRAGMENT, requested.selectedRows());

        assertTrue(selectionContains(101), "incluye filas hermanas validas del fragmento P3");
        assertTrue(selectionContains(150), "incluye el cierre del fragmento P3");
        assertTrue(selectionContains(50_201), "incluye el inicio del fragmento de la fila 50250");
        assertTrue(selectionContains(50_250), "incluye la fila fallida 50250");
        assertFalse(selectionContains(100), "no inventa rango antes del fragmento afectado");
        assertFalse(selectionContains(151), "no inventa rango entre fragmentos no contiguos");
        assertFalse(selectionContains(50_251), "no toma la fila valida posterior al fragmento afectado");

        rebuildService.approveRebuildRun(null, fixSetId, "approver");
        var result = rebuildService.executeApprovedRebuildRun(null, fixSetId, "executor");

        assertEquals(fixSetId, result.correctiveSetId());
        assertEquals(affectedReferences().size() * ROWS_PER_FRAGMENT, result.rebuiltRows());
        assertEquals(affectedReferences().size(), result.supersededFragments());
        assertEquals(BAD_ROWS.size(), result.resolvedQuarantine());

        @SuppressWarnings("unchecked")
        var source = (Map<String, Object>) capturedConfig.get().get("source");
        assertEquals(fixSetId, source.get("rebuildRunId"));
        assertFalse(source.containsKey("recordIndexIn"), "el rebuild no debe usar IN masivo");
        assertEquals(affectedReferences().size(), countWhere("mt101_build_fragment", "status = 'SUPERSEDED'"));
        assertEquals(0, countWhere("mt101_failed_record", "status = 'QUARANTINED'"));
        assertEquals(BAD_ROWS.size(), countWhere("mt101_failed_record", "status = 'REBUILD_PENDING_VALIDATION'"));
        assertEquals("BUILT", queryString("select status from mt101_rebuild_run where rebuild_run_id = '" + fixSetId + "'"));
    }

    private void seedOneHundredThousandRowsWithFailures() throws SQLException {
        var affected = affectedReferences();
        try (var connection = dataSource.getConnection()) {
            connection.setAutoCommit(false);
            try (var fragment = connection.prepareStatement("""
                         insert into mt101_build_fragment
                         (id, fragment_set_id, process_execution_id, task_definition_id, source_table,
                          source_row_from, source_row_to, staging_id_from, staging_id_to,
                          source_record_from, source_record_to, source_file_hash, source_records_json,
                          fragment_index, fragment_total, senders_reference, payload_hash,
                          raw_payload, message_json, status)
                         values (?, ?, 100, 20, 'staging_record', ?, ?, ?, ?, ?, ?, ?, null,
                                 ?, ?, ?, repeat('0', 64), '{}', '{}', ?)
                    """);
                 var record = connection.prepareStatement("""
                         insert into mt101_fragment_record
                         (fragment_id, fragment_set_id, source_file_hash, source_record_number, staging_id,
                          source_task_definition_id, source_name,
                          original_senders_reference, original_transaction_reference,
                          current_senders_reference, current_transaction_reference, status)
                         values (?, ?, ?, ?, ?, 20, 'payments-large.csv', ?, ?, ?, ?, 'BUILT')
                    """);
                 var staging = connection.prepareStatement("""
                         insert into staging_record
                         (id, process_execution_id, task_definition_id, source_name, source_file_hash,
                          record_index, payload_json)
                         values (?, 100, 20, 'payments-large.csv', ?, ?, ?)
                         on conflict do nothing
                    """);
                 var issue = connection.prepareStatement("""
                         insert into mt101_validation_issue
                         (rule_code, rule_set, severity, message, fragment_set_id,
                          senders_reference, transaction_reference)
                         values (?, 'structural-mvp', 'E', 'synthetic failure', ?, ?, ?)
                    """)) {
                var fragmentTotal = TOTAL_ROWS / ROWS_PER_FRAGMENT;
                for (int index = 1; index <= fragmentTotal; index++) {
                    var from = ((long) index - 1) * ROWS_PER_FRAGMENT + 1;
                    var to = from + ROWS_PER_FRAGMENT - 1;
                    var reference = "P" + index;
                    fragment.setLong(1, index);
                    fragment.setString(2, SET_ID);
                    fragment.setLong(3, from);
                    fragment.setLong(4, to);
                    fragment.setLong(5, 1_000_000L + from);
                    fragment.setLong(6, 1_000_000L + to);
                    fragment.setLong(7, from);
                    fragment.setLong(8, to);
                    fragment.setString(9, HASH);
                    fragment.setInt(10, index);
                    fragment.setInt(11, fragmentTotal);
                    fragment.setString(12, reference);
                    fragment.setString(13, affected.contains(reference) ? "REJECTED" : "BUILT");
                    fragment.addBatch();
                }
                fragment.executeBatch();

                for (long row = 1; row <= TOTAL_ROWS; row++) {
                    var reference = referenceFor(row);
                    record.setLong(1, fragmentIndexFor(row));
                    record.setString(2, SET_ID);
                    record.setString(3, HASH);
                    record.setLong(4, row);
                    record.setLong(5, 1_000_000L + row);
                    record.setString(6, reference);
                    record.setString(7, "TX-" + row);
                    record.setString(8, reference);
                    record.setString(9, "TX-" + row);
                    record.addBatch();
                    if (affected.contains(reference)) {
                        staging.setLong(1, 1_000_000L + row);
                        staging.setString(2, HASH);
                        staging.setLong(3, row - 1);
                        staging.setString(4, "{\"recordNumber\":" + row + "}");
                        staging.addBatch();
                    }
                    if (row % 1000 == 0) {
                        record.executeBatch();
                        staging.executeBatch();
                    }
                }
                record.executeBatch();
                staging.executeBatch();

                for (var row : BAD_ROWS) {
                    issue.setString(1, "STRUCT.BAD." + row);
                    issue.setString(2, SET_ID);
                    issue.setString(3, referenceFor(row));
                    issue.setString(4, "TX-" + row);
                    issue.addBatch();
                }
                issue.executeBatch();
            }
            connection.commit();
        }
    }

    private Set<String> affectedReferences() {
        var references = new LinkedHashSet<String>();
        for (var row : BAD_ROWS) {
            references.add(referenceFor(row));
        }
        return references;
    }

    private String referenceFor(long sourceRecordNumber) {
        return "P" + fragmentIndexFor(sourceRecordNumber);
    }

    private long fragmentIndexFor(long sourceRecordNumber) {
        return ((sourceRecordNumber - 1) / ROWS_PER_FRAGMENT) + 1;
    }

    private boolean selectionContains(long sourceRecordNumber) throws SQLException {
        return countWhere("mt101_rebuild_selection",
                "rebuild_run_id = '" + fixSetId + "' and source_record_number = " + sourceRecordNumber) > 0;
    }

    private void insertCorrectiveLineage(Map<String, Object> configuration) {
        try (var connection = dataSource.getConnection()) {
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
                         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'RFIX1', ?, ?)
                    """)) {
                select.setString(1, rebuildRunId);
                try (var rs = select.executeQuery()) {
                    while (rs.next()) {
                        var row = rs.getLong("source_record_number");
                        insert.setLong(1, fragmentId);
                        insert.setString(2, correctiveSetId);
                        insert.setString(3, SET_ID);
                        insert.setString(4, rs.getString("source_file_hash"));
                        insert.setLong(5, row);
                        insert.setLong(6, rs.getLong("staging_id"));
                        var taskDefinitionId = rs.getLong("source_task_definition_id");
                        if (rs.wasNull()) {
                            insert.setNull(7, java.sql.Types.BIGINT);
                        } else {
                            insert.setLong(7, taskDefinitionId);
                        }
                        insert.setString(8, rs.getString("source_name"));
                        insert.setString(9, rs.getString("original_senders_reference"));
                        insert.setString(10, rs.getString("original_transaction_reference"));
                        insert.setString(11, "C" + row);
                        insert.setString(12, rebuildRunId);
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
                    (id, fragment_set_id, process_execution_id, task_definition_id, source_table,
                     source_row_from, source_row_to, staging_id_from, staging_id_to,
                     source_record_from, source_record_to, source_file_hash, source_records_json,
                     fragment_index, fragment_total, senders_reference, payload_hash,
                     raw_payload, message_json, status)
                    values (900000000, ?, 100, 20, 'staging_record', 1, 1, 1, 1, 1, 1, ?,
                            '{}', 1, 1, 'RFIX1', repeat('1', 64), '{}', '{}', 'BUILT')
                    returning id
                """)) {
            statement.setString(1, correctiveSetId);
            statement.setString(2, HASH);
            try (var rs = statement.executeQuery()) {
                rs.next();
                return rs.getLong(1);
            }
        }
    }

    private Long failedRowNumber(String transactionReference) throws SQLException {
        return queryLong("select source_record_number from mt101_failed_record where transaction_reference = '"
                + transactionReference + "'");
    }

    private String failedSenderReference(String transactionReference) throws SQLException {
        return queryString("select senders_reference from mt101_failed_record where transaction_reference = '"
                + transactionReference + "'");
    }

    private long count(String tableName) throws SQLException {
        return countWhere(tableName, "true");
    }

    private long countWhere(String tableName, String whereClause) throws SQLException {
        return queryLong("select count(*) from " + tableName + " where " + whereClause);
    }

    private Long queryLong(String sql) throws SQLException {
        try (var connection = dataSource.getConnection();
             var statement = connection.createStatement();
             var rs = statement.executeQuery(sql)) {
            return rs.next() ? rs.getLong(1) : null;
        }
    }

    private String queryString(String sql) throws SQLException {
        try (var connection = dataSource.getConnection();
             var statement = connection.createStatement();
             var rs = statement.executeQuery(sql)) {
            return rs.next() ? rs.getString(1) : null;
        }
    }

    private void prepareSchema() throws SQLException {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("drop table if exists mt101_rebuild_selection");
            statement.executeUpdate("drop table if exists mt101_rebuild_run");
            statement.executeUpdate("drop sequence if exists mt101_rebuild_reference_seq");
            statement.executeUpdate("create sequence mt101_rebuild_reference_seq");
            statement.executeUpdate("drop table if exists mt101_failed_record");
            statement.executeUpdate("drop table if exists mt101_validation_issue");
            statement.executeUpdate("drop table if exists mt101_fragment_record");
            statement.executeUpdate("drop table if exists mt101_build_fragment");
            statement.executeUpdate("drop table if exists staging_record");
            statement.executeUpdate("create table mt101_build_fragment ("
                    + "id bigint primary key, fragment_set_id varchar(80) not null,"
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
            statement.executeUpdate("create unique index ux_frag_ref_large on mt101_build_fragment"
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
            statement.executeUpdate("create unique index ux_mt101_fragment_record_current_large on mt101_fragment_record "
                    + "(fragment_set_id, coalesce(source_file_hash, ''), source_record_number, coalesce(staging_id, 0))");
            statement.executeUpdate("create table mt101_validation_issue ("
                    + "id bigserial primary key, archive_id bigint, transaction_id bigint,"
                    + "rule_code varchar(80) not null, rule_set varchar(50) not null, severity char(1) not null,"
                    + "message text, fragment_set_id varchar(80), senders_reference varchar(16),"
                    + "fragment_index integer, transaction_reference varchar(35),"
                    + "detected_at timestamp not null default current_timestamp)");
            statement.executeUpdate("create table mt101_failed_record ("
                    + "id bigserial primary key, fragment_set_id varchar(80) not null,"
                    + "senders_reference varchar(16), transaction_reference varchar(35), source_file_hash varchar(64),"
                    + "source_record_number bigint, staging_id bigint, source_task_definition_id bigint,"
                    + "source_name varchar(255), rule_code varchar(80), rule_set varchar(50), severity char(1),"
                    + "message text, status varchar(40) not null default 'QUARANTINED',"
                    + "created_at timestamp not null default current_timestamp, resolved_at timestamp)");
            statement.executeUpdate("create unique index ux_mt101_failed_dedup_large on mt101_failed_record "
                    + "(fragment_set_id, coalesce(senders_reference, ''), "
                    + " coalesce(transaction_reference, ''), coalesce(rule_code, ''), coalesce(staging_id, 0))");
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
                    + "corrective_senders_reference varchar(16),"
                    + "corrective_transaction_reference varchar(35),"
                    + "status varchar(30) not null default 'SELECTED',"
                    + "selected_payload_hash varchar(64), selected_staging_version bigint,"
                    + "created_at timestamp not null default current_timestamp,"
                    + "lifecycle_updated_at timestamp)");
            statement.executeUpdate("create unique index ux_mt101_rebuild_selection_row_large on mt101_rebuild_selection "
                    + "(rebuild_run_id, coalesce(source_file_hash, ''), source_record_number, coalesce(staging_id, 0))");
            statement.executeUpdate("create table staging_record ("
                    + "id bigint primary key, process_execution_id bigint, task_definition_id bigint,"
                    + "source_name varchar(255), source_file_hash varchar(64), record_index bigint,"
                    + "payload_json text, version bigint not null default 0)");
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
