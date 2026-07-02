package com.integrationhub.platform.provider.task.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.integrationhub.platform.spi.task.TaskContext;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 008-mensajeria-pagos RF-007, T-017
 */
@Testcontainers
class Mt101RoutePersistedFragmentTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("mt101_route_fragments")
            .withUsername("postgres")
            .withPassword("postgres");

    private DataSource dataSource;
    private Mt101FragmentStore fragmentStore;
    private Mt101RouteTaskProvider provider;

    @BeforeEach
    void setUp() throws Exception {
        dataSource = dataSource();
        var objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        fragmentStore = new Mt101FragmentStore(dataSource, null, objectMapper);
        provider = new Mt101RouteTaskProvider(objectMapper, null, null, fragmentStore);
        prepareSchema();
    }

    @Test
    void routesPersistedCorrectiveFragmentsWithoutMaterializingPayOutput() throws Exception {
        var fragmentSetId = "ROUTE-FIX-1";
        insertFragment(fragmentSetId, "R1", 1, 2);
        insertFragment(fragmentSetId, "R2", 2, 2);
        var fragmentSource = fragmentStore.source(null, fragmentSetId, 2);
        fragmentStore.markStatusBatch(fragmentSource, List.of("R1", "R2"), "VALIDATED");

        var context = new TaskContext(100L, 20L);
        context.attributes().put("taskOutputs", Map.of("build.fragments", fragmentSource));
        var result = provider.execute(context, Map.of(
                "pageSize", 1,
                "input", Map.of("sourceTaskRef", "build", "sourceOutput", "fragments"),
                "rules", List.of(
                        Map.of("name", "r1", "predicate", "sequenceA.sendersReference == 'R1'", "routeTo", "REST"),
                        Map.of("name", "r2", "predicate", "sequenceA.sendersReference == 'R2'", "routeTo", "SFTP"))));

        assertTrue(result.success(), () -> "expected route success: " + result.details());
        assertEquals(2L, result.outputs().get("routedCount"));
        assertEquals("REST", routeFor(fragmentSetId, "R1"));
        assertEquals("SFTP", routeFor(fragmentSetId, "R2"));
        assertEquals("VALIDATED", statusFor(fragmentSetId, "R1"),
                "ROUTE persiste la decision pero no consume ni cambia el gate de ARCHIVE/PAY");
    }

    @Test
    void unroutedFragmentIsRejectedAtRouteSoArchiveAndPayExcludeIt() throws Exception {
        // P2 v22: un fragmento sin ruta usable (UNROUTED) falla en ROUTE y NO se archiva ni se paga.
        var fragmentSetId = "ROUTE-UNROUTED";
        insertFragment(fragmentSetId, "U1", 1, 2);
        insertFragment(fragmentSetId, "R1", 2, 2);
        var fragmentSource = fragmentStore.source(null, fragmentSetId, 2);
        fragmentStore.markStatusBatch(fragmentSource, List.of("U1", "R1"), "VALIDATED");

        var context = new TaskContext(100L, 20L);
        context.attributes().put("taskOutputs", Map.of("build.fragments", fragmentSource));
        var result = provider.execute(context, Map.of(
                "pageSize", 10,
                "input", Map.of("sourceTaskRef", "build", "sourceOutput", "fragments"),
                "rules", List.of(
                        Map.of("name", "r1", "predicate", "sequenceA.sendersReference == 'R1'", "routeTo", "REST"))));

        assertFalse(result.success(), "un fragmento sin ruta usable hace fallar ROUTE");
        assertEquals(1L, result.outputs().get("errorCount"));
        // U1 sin ruta -> REJECTED en ROUTE (con route_error): ARCHIVE/PAY lo excluyen.
        assertEquals("REJECTED", statusFor(fragmentSetId, "U1"), "el fragmento sin ruta se rechaza en ROUTE");
        assertNotNull(columnFor(fragmentSetId, "U1", "route_error"), "queda el motivo de la no-ruta");
        // R1 ruteado normalmente sigue su curso.
        assertEquals("REST", routeFor(fragmentSetId, "R1"));
        assertEquals("VALIDATED", statusFor(fragmentSetId, "R1"));
    }

    private void insertFragment(String fragmentSetId, String reference, int index, int total) {
        fragmentStore.insertFragment(null, fragmentSetId, 100L, 20L, "staging_record",
                index, index, index, total, sampleMessage(reference, index, total));
    }

    private Mt101Message sampleMessage(String reference, int index, int total) {
        return new Mt101Message(
                new Mt101Message.Envelope("SGOBFRPPAXXX", "BCPLPEPLXXXX", "uetr-" + reference, "N"),
                new Mt101Message.SequenceA(reference, null, index, total, LocalDate.of(2026, 6, 12),
                        null, new Mt101Message.Party("H", "001", null, List.of("ACME")), null, null),
                List.of(new Mt101Message.Transaction(
                        1, "TX-" + reference, null, null,
                        new Mt101Message.Amount("PEN", new BigDecimal("100.00")),
                        null, null, null, null,
                        new Mt101Message.Party("", "ACC-" + reference, null, List.of("BENE")),
                        null, null, null, "SHA", null, null)),
                new Mt101Message.ControlTotals(1, Map.of("PEN", new BigDecimal("100.00"))),
                "{\"sendersReference\":\"" + reference + "\"}",
                "JSON");
    }

    private void prepareSchema() throws SQLException {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
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
                    + "routed_as varchar(80),"
                    + "routed_at timestamp,"
                    + "route_error text,"
                    + "created_at timestamp not null default current_timestamp,"
                    + "updated_at timestamp not null default current_timestamp)");
            statement.executeUpdate("create unique index ux_route_fragment_ref on mt101_build_fragment"
                    + "(fragment_set_id, senders_reference)");
        }
    }

    private String routeFor(String setId, String reference) throws SQLException {
        return columnFor(setId, reference, "routed_as");
    }

    private String statusFor(String setId, String reference) throws SQLException {
        return columnFor(setId, reference, "status");
    }

    private String columnFor(String setId, String reference, String column) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "select " + column + " from mt101_build_fragment where fragment_set_id = ? and senders_reference = ?")) {
            statement.setString(1, setId);
            statement.setString(2, reference);
            try (var rs = statement.executeQuery()) {
                rs.next();
                return rs.getString(1);
            }
        }
    }

    private DataSource dataSource() {
        var pg = new PGSimpleDataSource();
        pg.setURL(POSTGRES.getJdbcUrl());
        pg.setUser(POSTGRES.getUsername());
        pg.setPassword(POSTGRES.getPassword());
        return pg;
    }
}
