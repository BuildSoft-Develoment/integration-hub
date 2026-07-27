package com.integrationhub.platform.service.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.integrationhub.platform.provider.task.payments.swift.Mt101FragmentStore;
import com.integrationhub.vertical.swift.mt101.spi.Mt101Message;
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

/**
 * B3': dos archivos byte-identicos (mismo SHA) de ubicaciones distintas en una ejecucion
 * producen {@code (hash, record_index)} solapados. La identidad del linaje incluye
 * {@code staging_id} (unico por fila de origen), asi que ambas filas sobreviven en
 * {@code mt101_fragment_record} (antes el 2do archivo se descartaba en silencio) y el origen
 * (tarea DB_WRITE + nombre de archivo) queda registrado para desambiguar.
 */
@Testcontainers
class Mt101MultiSourceLineageTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("mt101_multisource")
            .withUsername("postgres")
            .withPassword("postgres");

    private DataSource dataSource;
    private Mt101FragmentStore fragmentStore;

    @BeforeEach
    void setUp() throws Exception {
        dataSource = dataSource();
        var objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        fragmentStore = new Mt101FragmentStore(dataSource, null, objectMapper);
        prepareSchema();
    }

    @Test
    void keepsBothLineagesForByteIdenticalFilesFromDifferentOrigins() throws Exception {
        // Dos staging rows del MISMO contenido (hash) y MISMA fila 1, distinto origen.
        insertStaging(1L, 10L, "/sftp/bancoA/pagos.csv");
        insertStaging(2L, 10L, "/sftp/bancoB/pagos.csv");

        // Archivo A -> fragmento P1 (fila 1 -> staging 1); Archivo B -> fragmento P2 (fila 1 -> staging 2).
        fragmentStore.insertFragments(null, List.of(fragmentForRow("P1", 1L)));
        fragmentStore.insertFragments(null, List.of(fragmentForRow("P2", 2L)));

        // Sin staging_id en la identidad, el 2do se descartaba (on conflict do nothing). Ahora: 2.
        assertEquals(2, count("select count(*) from mt101_fragment_record "
                + "where fragment_set_id = 'SET' and source_file_hash = 'hashA' and source_record_number = 1"),
                "ambas filas de linaje (una por origen) sobreviven");

        // El origen quedo registrado para desambiguar de cara al operador.
        assertEquals("/sftp/bancoA/pagos.csv", queryString(
                "select source_name from mt101_fragment_record where staging_id = 1"));
        assertEquals("/sftp/bancoB/pagos.csv", queryString(
                "select source_name from mt101_fragment_record where staging_id = 2"));
        assertEquals(2, count("select count(*) from mt101_fragment_record "
                + "where source_task_definition_id = 10"), "se registra la tarea DB_WRITE de origen");
    }

    private Mt101FragmentStore.FragmentInsert fragmentForRow(String reference, long stagingId) {
        var sourceRecords = new java.util.LinkedHashMap<String, Long>();
        sourceRecords.put("TX-" + reference, 1L);
        var stagingIds = new java.util.LinkedHashMap<Long, Long>();
        stagingIds.put(1L, stagingId);
        return new Mt101FragmentStore.FragmentInsert(
                "SET", 1L, 10L, "staging_record",
                1, 1, 1, 1, "hashA", sourceRecords, stagingIds,
                "P1".equals(reference) ? 1 : 2, 2, sampleMessage(reference));
    }

    private void insertStaging(long id, long taskDefinitionId, String sourceName) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "insert into staging_record (id, process_execution_id, task_definition_id, source_name, source_file_hash, record_index, payload_json) "
                             + "values (?, 1, ?, ?, 'hashA', 0, '{}')")) {
            statement.setLong(1, id);
            statement.setLong(2, taskDefinitionId);
            statement.setString(3, sourceName);
            statement.executeUpdate();
        }
    }

    private long count(String sql) throws SQLException {
        return queryLong(sql);
    }

    private long queryLong(String sql) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.createStatement();
             var rs = statement.executeQuery(sql)) {
            rs.next();
            return rs.getLong(1);
        }
    }

    private String queryString(String sql) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.createStatement();
             var rs = statement.executeQuery(sql)) {
            return rs.next() ? rs.getString(1) : null;
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
                        new Mt101Message.Party("", "ACC", null, List.of("BENE")),
                        null, null, null, "OUR", null, null)),
                new Mt101Message.ControlTotals(1, Map.of("PEN", new BigDecimal("100.00"))),
                "{\"sendersReference\":\"" + reference + "\"}",
                "JSON");
    }

    private void prepareSchema() throws SQLException {
        try (Connection connection = dataSource.getConnection();
             Statement s = connection.createStatement()) {
            s.executeUpdate("drop table if exists mt101_fragment_record");
            s.executeUpdate("drop table if exists mt101_build_fragment");
            s.executeUpdate("drop table if exists staging_record");
            s.executeUpdate("create table staging_record ("
                    + "id bigint primary key, process_execution_id bigint, task_definition_id bigint,"
                    + "source_name varchar(255), source_file_hash varchar(64), record_index integer, payload_json text)");
            s.executeUpdate("create table mt101_build_fragment ("
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
            s.executeUpdate("create unique index ux_frag_ref_ms on mt101_build_fragment (fragment_set_id, senders_reference)");
            s.executeUpdate("create table mt101_fragment_record ("
                    + "id bigserial primary key, fragment_id bigint references mt101_build_fragment(id) on delete cascade,"
                    + "fragment_set_id varchar(80) not null, source_file_hash varchar(64),"
                    + "source_record_number bigint not null, staging_id bigint,"
                    + "source_task_definition_id bigint, source_name varchar(255),"
                    + "original_senders_reference varchar(16), original_transaction_reference varchar(35),"
                    + "current_senders_reference varchar(16), current_transaction_reference varchar(35))");
            // Identidad B3': incluye staging_id para no descartar el 2do archivo identico.
            s.executeUpdate("create unique index ux_mt101_fragment_record_current on mt101_fragment_record "
                    + "(fragment_set_id, coalesce(source_file_hash, ''), source_record_number, coalesce(staging_id, 0))");
        }
    }

    private DataSource dataSource() {
        var ds = new PGSimpleDataSource();
        ds.setURL(POSTGRES.getJdbcUrl());
        ds.setUser(POSTGRES.getUsername());
        ds.setPassword(POSTGRES.getPassword());
        return ds;
    }
}
