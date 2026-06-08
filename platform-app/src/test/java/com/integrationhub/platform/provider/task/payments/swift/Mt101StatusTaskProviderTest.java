package com.integrationhub.platform.provider.task.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.junit5.WireMockRuntimeInfo;
import com.github.tomakehurst.wiremock.junit5.WireMockTest;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.postgresql.ds.PGSimpleDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;
import java.net.http.HttpClient;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.Map;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.getRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.reset;
import static com.github.tomakehurst.wiremock.client.WireMock.stubFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static com.github.tomakehurst.wiremock.client.WireMock.urlMatching;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathMatching;
import static com.github.tomakehurst.wiremock.client.WireMock.verify;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 008-mensajeria-pagos RF-005, T-013
 */
@Testcontainers
@WireMockTest
class Mt101StatusTaskProviderTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("status_test")
            .withUsername("postgres")
            .withPassword("postgres");

    private DataSource dataSource;
    private Mt101StatusTaskProvider provider;

    @BeforeEach
    void setUp() throws Exception {
        dataSource = dataSource();
        provider = new Mt101StatusTaskProvider(new ObjectMapper(), HttpClient.newHttpClient(),
                dataSource, null);
        prepareSchema();
        reset();
    }

    @AfterAll
    static void stopContainer() {
        POSTGRES.stop();
    }

    @Test
    void queriesGatewayPerRecordAndPersistsConfirmations(WireMockRuntimeInfo wm) throws Exception {
        stubFor(get(urlPathMatching("/v1/swift/status/.*"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\"status\":\"CONFIRMED\",\"gatewayReference\":\"GW-OK\"}")));

        var records = List.<Map<String, Object>>of(
                Map.of("sendersReference", "PROC-1", "gatewayReference", "GW-1", "archiveId", 100L),
                Map.of("sendersReference", "PROC-2", "gatewayReference", "GW-2", "archiveId", 101L));

        var result = provider.execute(contextWith("pay-mt101.records", records), Map.of(
                "mode", "query",
                "input", Map.of("sourceTaskRef", "pay-mt101", "sourceOutput", "records"),
                "query", Map.of(
                        "url", wm.getHttpBaseUrl() + "/v1/swift/status/${gatewayReference}",
                        "method", "GET"),
                "expectedGatewayResponse", Map.of(
                        "statusField", "$.status",
                        "referenceField", "$.gatewayReference")));

        assertTrue(result.success(), () -> "expected success, got: " + result.details());
        assertEquals(2, result.outputs().get("queriedCount"));
        assertEquals(2, result.outputs().get("confirmedCount"));
        assertEquals(0, result.outputs().get("errorCount"));

        verify(getRequestedFor(urlEqualTo("/v1/swift/status/GW-1")));
        verify(getRequestedFor(urlEqualTo("/v1/swift/status/GW-2")));

        @SuppressWarnings("unchecked")
        var byStatus = (Map<String, Integer>) result.outputs().get("countByStatus");
        assertEquals(2, byStatus.get("CONFIRMED"));

        assertEquals(2, countRows("mt101_confirmation"));
        assertEquals(2, countRowsWithStatus("CONFIRMED"));
    }

    @Test
    void counts4xxAsErrorWithoutDbInsert(WireMockRuntimeInfo wm) throws Exception {
        stubFor(get(urlMatching(".*"))
                .willReturn(aResponse().withStatus(404).withBody("not found")));

        var records = List.<Map<String, Object>>of(
                Map.of("sendersReference", "PROC-NF", "gatewayReference", "MISSING", "archiveId", 1L));

        var result = provider.execute(contextWith("pay-mt101.records", records), Map.of(
                "mode", "query",
                "input", Map.of("sourceTaskRef", "pay-mt101", "sourceOutput", "records"),
                "query", Map.of("url", wm.getHttpBaseUrl() + "/v1/swift/status/${gatewayReference}")));

        assertFalse(result.success());
        assertEquals(1, result.outputs().get("errorCount"));
        assertEquals(0, countRows("mt101_confirmation"),
                "no debe insertar confirmation cuando el gateway responde con error");
    }

    @Test
    void skipsWhenNoRecords(WireMockRuntimeInfo wm) {
        var context = new TaskContext(1L, 1L);
        context.attributes().put("taskOutputs", Map.of());
        var result = provider.execute(context, Map.of(
                "mode", "query",
                "input", Map.of("sourceTaskRef", "pay-mt101", "sourceOutput", "records"),
                "query", Map.of("url", wm.getHttpBaseUrl() + "/x")));
        assertTrue(result.success());
        assertTrue(result.details().toLowerCase().contains("skipped"));
    }

    @Test
    void rejectsPollMode(WireMockRuntimeInfo wm) {
        var records = List.<Map<String, Object>>of(Map.of("gatewayReference", "X"));
        var error = assertThrows(IllegalArgumentException.class,
                () -> provider.execute(contextWith("pay-mt101.records", records), Map.of(
                        "mode", "poll",
                        "input", Map.of("sourceTaskRef", "pay-mt101", "sourceOutput", "records"),
                        "query", Map.of("url", wm.getHttpBaseUrl() + "/x"))));
        assertTrue(error.getMessage().contains("M-2"),
                "modo poll debe rechazar referenciando dependencia M-2");
    }

    @Test
    void rejectsWhenUrlMissing() {
        var records = List.<Map<String, Object>>of(Map.of("gatewayReference", "X"));
        var error = assertThrows(IllegalArgumentException.class,
                () -> provider.execute(contextWith("pay-mt101.records", records), Map.of(
                        "mode", "query",
                        "input", Map.of("sourceTaskRef", "pay-mt101", "sourceOutput", "records"))));
        assertTrue(error.getMessage().contains("query.url"));
    }

    @Test
    void usesCustomJsonPathForStatusField(WireMockRuntimeInfo wm) throws Exception {
        stubFor(get(urlMatching(".*"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withBody("{\"data\":{\"state\":\"SETTLED\"},\"id\":\"INNER\"}")));

        var records = List.<Map<String, Object>>of(
                Map.of("gatewayReference", "G", "archiveId", 1L));
        var result = provider.execute(contextWith("pay-mt101.records", records), Map.of(
                "mode", "query",
                "input", Map.of("sourceTaskRef", "pay-mt101", "sourceOutput", "records"),
                "query", Map.of("url", wm.getHttpBaseUrl() + "/x"),
                "expectedGatewayResponse", Map.of(
                        "statusField", "$.data.state",
                        "referenceField", "$.id")));

        assertTrue(result.success());
        @SuppressWarnings("unchecked")
        var byStatus = (Map<String, Integer>) result.outputs().get("countByStatus");
        assertEquals(1, byStatus.get("SETTLED"));
    }

    // --- helpers ---

    private TaskContext contextWith(String key, List<?> records) {
        var context = new TaskContext(1L, 1L);
        context.attributes().put("taskOutputs", Map.of(key, records));
        return context;
    }

    private DataSource dataSource() {
        var pg = new PGSimpleDataSource();
        pg.setURL(POSTGRES.getJdbcUrl());
        pg.setUser(POSTGRES.getUsername());
        pg.setPassword(POSTGRES.getPassword());
        return pg;
    }

    private void prepareSchema() throws SQLException {
        try (Connection c = dataSource.getConnection();
             Statement stmt = c.createStatement()) {
            stmt.executeUpdate("drop table if exists mt101_confirmation");
            stmt.executeUpdate("create table mt101_confirmation (" +
                    " id bigserial primary key," +
                    " archive_id bigint," +
                    " confirmation_type varchar(10) not null," +
                    " gateway_reference varchar(35)," +
                    " confirmed_status varchar(20)," +
                    " raw_payload text," +
                    " received_at timestamp not null default current_timestamp)");
        }
    }

    private int countRows(String table) throws SQLException {
        try (Connection c = dataSource.getConnection();
             Statement stmt = c.createStatement();
             var rs = stmt.executeQuery("select count(*) from " + table)) {
            rs.next();
            return rs.getInt(1);
        }
    }

    private int countRowsWithStatus(String status) throws SQLException {
        try (Connection c = dataSource.getConnection();
             var stmt = c.prepareStatement("select count(*) from mt101_confirmation where confirmed_status = ?")) {
            stmt.setString(1, status);
            try (var rs = stmt.executeQuery()) {
                rs.next();
                return rs.getInt(1);
            }
        }
    }
}
