package com.integrationhub.platform.service.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.integrationhub.platform.provider.task.payments.swift.Mt101BuildFromTableTaskProvider;
import com.integrationhub.platform.provider.task.payments.swift.Mt101FragmentStore;
import com.integrationhub.platform.repository.payments.swift.Mt101FailedRecordRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
import com.integrationhub.platform.service.JsonConfigurationMapper;
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
        fragmentStore.insertFragment(null, "SET", 100L, 20L, "staging_record",
                1, 50, 1, 1, sampleMessage("P1"));
        insertQuarantine("P1", "TX-25", 25L, "STRUCT.X");

        var result = service.rebuildFromQuarantine(null, "SET", "SET-FIX");

        assertEquals("SET-FIX", result.correctiveSetId());
        // P0: reconstruye las 50 filas del fragmento afectado, no solo la fila 25.
        assertEquals(50, result.rebuiltRows(), "rebuild de TODO el fragmento, no solo la fila fallida");
        assertEquals(1, result.supersededFragments());
        assertEquals(1, result.resolvedQuarantine());

        var config = capturedConfig.get();
        assertEquals("SET-FIX", config.get("fragmentSetIdTemplate"));
        assertEquals(true, config.get("replaceExisting"));
        @SuppressWarnings("unchecked")
        var source = (Map<String, Object>) config.get("source");
        @SuppressWarnings("unchecked")
        var recordIndexIn = (List<Long>) source.get("recordIndexIn");
        assertEquals(50, recordIndexIn.size(), "las 50 filas del fragmento (record_index 0-based)");
        assertTrue(recordIndexIn.contains(0L) && recordIndexIn.contains(24L) && recordIndexIn.contains(49L),
                "incluye la primera (0), la fallida (24) y la ultima (49)");
        assertTrue(config.containsKey("sequenceA"), "conserva el config original del build");

        assertEquals("SUPERSEDED", fragmentStatus("SET", "P1"));
        assertEquals("SET-FIX", supersededBy("SET", "P1"));
        assertEquals("REBUILT", quarantineStatus("SET"));
    }

    @Test
    void failsWhenNoQuarantinedRows() throws Exception {
        fragmentStore.insertFragment(null, "SET", 100L, 20L, "staging_record",
                2, 2, 1, 1, sampleMessage("P1"));

        var error = assertThrows(IllegalArgumentException.class,
                () -> service.rebuildFromQuarantine(null, "SET", "SET-FIX"));
        assertTrue(error.getMessage().contains("no quarantined rows"));
    }

    @Test
    void rejectsCorrectiveSetEqualToOriginal() {
        var error = assertThrows(IllegalArgumentException.class,
                () -> service.rebuildFromQuarantine(null, "SET", "SET"));
        assertTrue(error.getMessage().contains("must differ"));
    }

    private void insertQuarantine(String sendersReference, String transactionReference,
                                  long sourceRecordNumber, String ruleCode) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "insert into mt101_failed_record (fragment_set_id, senders_reference, transaction_reference, "
                             + "source_record_number, rule_code, status) values ('SET', ?, ?, ?, ?, 'QUARANTINED')")) {
            statement.setString(1, sendersReference);
            statement.setString(2, transactionReference);
            statement.setLong(3, sourceRecordNumber);
            statement.setString(4, ruleCode);
            statement.executeUpdate();
        }
    }

    private String fragmentStatus(String setId, String reference) throws SQLException {
        return queryString("select status from mt101_build_fragment where fragment_set_id = ? and senders_reference = ?",
                setId, reference);
    }

    private String supersededBy(String setId, String reference) throws SQLException {
        return queryString("select superseded_by from mt101_build_fragment where fragment_set_id = ? and senders_reference = ?",
                setId, reference);
    }

    private String quarantineStatus(String setId) throws SQLException {
        return queryString("select status from mt101_failed_record where fragment_set_id = ?", setId);
    }

    private String queryString(String sql, String... params) throws SQLException {
        try (Connection connection = dataSource.getConnection();
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
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("drop table if exists mt101_failed_record");
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
