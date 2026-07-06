package com.integrationhub.platform.service.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.junit5.WireMockRuntimeInfo;
import com.github.tomakehurst.wiremock.junit5.WireMockTest;
import com.integrationhub.platform.provider.task.payments.swift.Mt101StatusQueryExecutor;
import com.integrationhub.platform.repository.payments.swift.Mt101ConfirmationRepository;
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
import java.util.Map;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.stubFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * v52-fix (pendiente #1): resolución del UNCERTAIN/DISPATCHING del PAY normal contra el gateway (MT101_STATUS),
 * sin reenviar. El gateway responde ACCEPTED/REJECTED/pendiente por :20:.
 */
@Testcontainers
@WireMockTest
class Mt101PayUncertainResolutionServiceTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("pay_uncertain_resolution")
            .withUsername("postgres")
            .withPassword("postgres");

    private DataSource dataSource;
    private Mt101FragmentRepository repository;
    private Mt101PayUncertainResolutionService service;
    private String baseUrl;

    @BeforeEach
    void setUp(WireMockRuntimeInfo wm) throws Exception {
        dataSource = dataSource();
        repository = new Mt101FragmentRepository();
        baseUrl = wm.getHttpBaseUrl();
        var objectMapper = new ObjectMapper();
        var executor = new Mt101StatusQueryExecutor(objectMapper);
        // La config de MT101_STATUS del set: URL por :20:, tokens de aceptacion/rechazo.
        var statusConfig = Map.<String, Object>of(
                "query", Map.of("url", baseUrl + "/status/${sendersReference}", "method", "GET"),
                "expectedGatewayResponse", Map.of("statusField", "$.status"),
                "acceptedStatuses", List.of("ACCEPTED"),
                "rejectedStatuses", List.of("REJECTED"));
        Mt101CorrectiveTaskConfigSource configSource = (taskDefinitionId, taskType) ->
                "MT101_STATUS".equals(taskType) ? statusConfig : null;
        service = new Mt101PayUncertainResolutionService(dataSource, null, repository, executor,
                new Mt101ConfirmationRepository(), configSource);
        prepareSchema();
    }

    @Test
    void resolvesUncertainToSentOrRejectedByGatewayAndNeverResends() throws Exception {
        var setId = "PAY-UNC-1";
        // U1 uncertain -> gateway ACCEPTED; U2 dispatching -> gateway REJECTED; U3 uncertain -> gateway pendiente.
        seed(setId, "U1", 1, "UNCERTAIN");
        seed(setId, "U2", 2, "DISPATCHING");
        seed(setId, "U3", 3, "UNCERTAIN");
        stubFor(get(urlEqualTo("/status/U1")).willReturn(aResponse().withHeader("Content-Type", "application/json")
                .withBody("{\"status\":\"ACCEPTED\"}")));
        stubFor(get(urlEqualTo("/status/U2")).willReturn(aResponse().withHeader("Content-Type", "application/json")
                .withBody("{\"status\":\"REJECTED\"}")));
        stubFor(get(urlEqualTo("/status/U3")).willReturn(aResponse().withHeader("Content-Type", "application/json")
                .withBody("{\"status\":\"PENDING\"}")));

        var result = service.resolveUncertainNormalPay(null, setId, "ana", "conciliacion post-incierto");

        assertEquals(1, result.resolvedSent(), "U1 confirmado aceptado -> SENT");
        assertEquals(1, result.resolvedRejected(), "U2 confirmado rechazado -> REJECTED");
        assertEquals(1, result.stillPending(), "U3 pendiente en el gateway -> sigue sin resolver");
        assertEquals("SENT", statusFor(setId, "U1"));
        assertEquals("REJECTED", statusFor(setId, "U2"));
        assertEquals("UNCERTAIN", statusFor(setId, "U3"), "un pendiente NUNCA se reenvia ni se fuerza a terminal");
    }

    @Test
    void gatewayErrorLeavesFragmentUncertainForRetry() throws Exception {
        var setId = "PAY-UNC-2";
        seed(setId, "E1", 1, "UNCERTAIN");
        stubFor(get(urlEqualTo("/status/E1")).willReturn(aResponse().withStatus(503).withBody("unavailable")));

        var result = service.resolveUncertainNormalPay(null, setId, "ana", "reintento");

        assertEquals(0, result.resolvedSent());
        assertEquals(0, result.resolvedRejected());
        assertEquals(1, result.gatewayErrors(), "un gateway no concluyente cuenta como error, no resuelve");
        assertEquals("UNCERTAIN", statusFor(setId, "E1"), "ante error del gateway el fragmento se mantiene");
    }

    @Test
    void resolvesRouteAwareViaPerRouteEndpoint() throws Exception {
        // v55-fix: en modo route-aware (routeQuery), cada fragmento se consulta contra el endpoint de SU ruta
        // (routed_as). Aqui la ruta REST_A tiene su propia URL y statusField.
        var setId = "PAY-UNC-ROUTE";
        seedRouted(setId, "R1", 1, "UNCERTAIN", "REST_A");
        stubFor(get(urlEqualTo("/route-a/R1")).willReturn(aResponse().withHeader("Content-Type", "application/json")
                .withBody("{\"state\":\"OK\"}")));
        var routeConfig = Map.<String, Object>of(
                "routeQuery", Map.of("REST_A",
                        Map.of("url", baseUrl + "/route-a/${sendersReference}", "statusField", "$.state")),
                "acceptedStatuses", List.of("OK"));
        Mt101CorrectiveTaskConfigSource configSource = (taskDefinitionId, taskType) ->
                "MT101_STATUS".equals(taskType) ? routeConfig : null;
        var routeService = new Mt101PayUncertainResolutionService(dataSource, null, repository,
                new Mt101StatusQueryExecutor(new ObjectMapper()), new Mt101ConfirmationRepository(), configSource);

        var result = routeService.resolveUncertainNormalPay(null, setId, "ana", "route-aware");

        assertEquals(1, result.resolvedSent(), "resuelto via el endpoint de la ruta REST_A");
        assertEquals("SENT", statusFor(setId, "R1"));
    }

    @Test
    void persistsAConfirmationRowPerResolvedFragmentCorrelatedByArchiveId() throws Exception {
        // v57-fix: por cada fragmento resuelto (SENT/REJECTED) se persiste una confirmacion de auditoria en
        // mt101_confirmation, correlacionada al archive por (senders_reference, process_execution_id). Un pendiente
        // NO deja confirmacion.
        var setId = "PAY-UNC-AUDIT";
        seed(setId, "A1", 1, "UNCERTAIN");   // -> ACCEPTED -> SENT + confirmacion
        seed(setId, "A2", 2, "UNCERTAIN");   // -> PENDING  -> sin confirmacion
        seedArchive("A1", 100L, 5001L);      // archive de A1 (process_execution_id=100, como el seed del fragmento)
        stubFor(get(urlEqualTo("/status/A1")).willReturn(aResponse().withHeader("Content-Type", "application/json")
                .withBody("{\"status\":\"ACCEPTED\",\"gatewayReference\":\"GW-A1\"}")));
        stubFor(get(urlEqualTo("/status/A2")).willReturn(aResponse().withHeader("Content-Type", "application/json")
                .withBody("{\"status\":\"PENDING\"}")));

        service.resolveUncertainNormalPay(null, setId, "ana", "audit");

        assertEquals(1L, countConfirmations(5001L), "una confirmacion para A1 correlacionada al archive");
        assertEquals("ACCEPTED", confirmedStatusFor(5001L), "la confirmacion guarda el confirmedStatus del gateway");
        assertEquals(0L, countConfirmationsByStatus("PENDING"), "un pendiente NO deja confirmacion");
    }

    // --- helpers ---

    private void seedRouted(String setId, String reference, int index, String status, String route)
            throws SQLException {
        seed(setId, reference, index, status);
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement("update mt101_build_fragment set routed_as = ? "
                     + "where fragment_set_id = ? and senders_reference = ?")) {
            statement.setString(1, route);
            statement.setString(2, setId);
            statement.setString(3, reference);
            statement.executeUpdate();
        }
    }

    private void seed(String setId, String reference, int index, String status) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement("insert into mt101_build_fragment (fragment_set_id, "
                     + "process_execution_id, task_definition_id, source_table, fragment_index, fragment_total, "
                     + "senders_reference, payload_hash, raw_payload, message_json, status) "
                     + "values (?, 100, 20, 'staging_record', ?, 3, ?, repeat('a',64), 'raw', "
                     + "'{\"sequenceA\":{\"sendersReference\":\"" + reference + "\"}}', ?)")) {
            statement.setString(1, setId);
            statement.setInt(2, index);
            statement.setString(3, reference);
            statement.setString(4, status);
            statement.executeUpdate();
        }
    }

    private void seedArchive(String sendersReference, long processExecutionId, long archiveId) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement("insert into mt101_archive (id, senders_reference, "
                     + "process_execution_id, status) values (?, ?, ?, 'SENT')")) {
            statement.setLong(1, archiveId);
            statement.setString(2, sendersReference);
            statement.setLong(3, processExecutionId);
            statement.executeUpdate();
        }
    }

    private long countConfirmations(long archiveId) throws SQLException {
        return scalarLong("select count(*) from mt101_confirmation where archive_id = " + archiveId);
    }

    private long countConfirmationsByStatus(String status) throws SQLException {
        return scalarLong("select count(*) from mt101_confirmation where confirmed_status = '" + status + "'");
    }

    private String confirmedStatusFor(long archiveId) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "select confirmed_status from mt101_confirmation where archive_id = ?")) {
            statement.setLong(1, archiveId);
            try (var rs = statement.executeQuery()) {
                rs.next();
                return rs.getString(1);
            }
        }
    }

    private long scalarLong(String sql) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql);
             var rs = statement.executeQuery()) {
            rs.next();
            return rs.getLong(1);
        }
    }

    private String statusFor(String setId, String reference) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "select status from mt101_build_fragment where fragment_set_id = ? and senders_reference = ?")) {
            statement.setString(1, setId);
            statement.setString(2, reference);
            try (var rs = statement.executeQuery()) {
                rs.next();
                return rs.getString(1);
            }
        }
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
            statement.executeUpdate("create unique index ux_pay_unc_ref on mt101_build_fragment"
                    + "(fragment_set_id, senders_reference)");
            // v57-fix: archive (para la correlacion del archive_id) + confirmation (audit).
            statement.executeUpdate("drop table if exists mt101_confirmation");
            statement.executeUpdate("drop table if exists mt101_archive");
            statement.executeUpdate("create table mt101_archive ("
                    + "id bigint primary key,"
                    + "senders_reference varchar(16) not null,"
                    + "process_execution_id bigint,"
                    + "status varchar(20) not null default 'PENDING')");
            statement.executeUpdate("create table mt101_confirmation ("
                    + "id bigserial primary key,"
                    + "archive_id bigint references mt101_archive(id) on delete cascade,"
                    + "confirmation_type varchar(10) not null,"
                    + "gateway_reference varchar(35),"
                    + "confirmed_status varchar(20),"
                    + "raw_payload text,"
                    + "received_at timestamp not null default current_timestamp)");
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
