package com.integrationhub.platform.provider.task.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.junit5.WireMockRuntimeInfo;
import com.github.tomakehurst.wiremock.junit5.WireMockTest;
import com.integrationhub.platform.service.payments.swift.Mt101PayUncertainResolutionService;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import org.postgresql.ds.PGSimpleDataSource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;
import java.io.ByteArrayInputStream;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.Map;
import java.util.Properties;

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

    private static final String SFTP_USER = "swift";
    private static final String SFTP_PASSWORD = "swift123";

    @Container
    static final GenericContainer<?> SFTP = new GenericContainer<>("atmoz/sftp:alpine")
            .withExposedPorts(22)
            .withCommand(SFTP_USER + ":" + SFTP_PASSWORD + ":1001:100:upload")
            .waitingFor(Wait.forListeningPort());

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
    void capsRecordsSampleButKeepsExactCountsAndPersistsAll(WireMockRuntimeInfo wm) throws Exception {
        // H6: con maxRecordsInOutput=2 y 5 registros, el output muestra 2 pero
        // confirmedCount=5 (exacto), recordsSampled=true, y las 5 confirmaciones
        // se persisten (el flush por lotes no pierde filas).
        stubFor(get(urlPathMatching("/v1/swift/status/.*"))
                .willReturn(aResponse().withStatus(200)
                        .withBody("{\"status\":\"CONFIRMED\",\"gatewayReference\":\"GW\"}")));

        var records = new java.util.ArrayList<Map<String, Object>>();
        for (int i = 1; i <= 5; i++) {
            records.add(Map.of("sendersReference", "P" + i, "gatewayReference", "G" + i, "archiveId", (long) i));
        }

        var result = provider.execute(contextWith("pay-mt101.records", records), Map.of(
                "mode", "query",
                "maxRecordsInOutput", 2,
                "input", Map.of("sourceTaskRef", "pay-mt101", "sourceOutput", "records"),
                "query", Map.of("url", wm.getHttpBaseUrl() + "/v1/swift/status/${gatewayReference}")));

        assertEquals(5, result.outputs().get("queriedCount"));
        assertEquals(5, result.outputs().get("confirmedCount"), "conteo exacto");
        assertEquals(Boolean.TRUE, result.outputs().get("recordsSampled"));
        @SuppressWarnings("unchecked")
        var sample = (List<Map<String, Object>>) result.outputs().get("records");
        assertEquals(2, sample.size(), "el sample respeta maxRecordsInOutput");
        assertEquals(5, countRows("mt101_confirmation"), "todas las confirmaciones se persisten");
    }

    @Test
    void correctiveQueryReadsAllSentLedgerRecordsNotPayOutputSample(WireMockRuntimeInfo wm) throws Exception {
        stubFor(get(urlPathMatching("/v1/swift/status/.*"))
                .willReturn(aResponse().withStatus(200)
                        .withBody("{\"status\":\"CONFIRMED\",\"gatewayReference\":\"GW-OK\"}")));
        insertCorrectiveStatusRecord("RUN-1", "SET-FIX", "R1", "KEY-R1", 201L);
        insertCorrectiveStatusRecord("RUN-1", "SET-FIX", "R2", "KEY-R2", 202L);
        insertCorrectiveStatusRecord("RUN-1", "SET-FIX", "R3", "KEY-R3", 203L);

        var result = provider.execute(contextWith("pay-mt101.records",
                Map.of("correctivePayRunId", "RUN-1")), Map.of(
                "mode", "query",
                "pageSize", 2,
                "maxRecordsInOutput", 1,
                "input", Map.of("sourceTaskRef", "pay-mt101", "sourceOutput", "records"),
                "query", Map.of("url", wm.getHttpBaseUrl() + "/v1/swift/status/${idempotencyKey}")));

        assertTrue(result.success(), () -> "expected success, got: " + result.details());
        assertEquals(3, result.outputs().get("queriedCount"));
        assertEquals(3, result.outputs().get("confirmedCount"));
        assertEquals(Boolean.TRUE, result.outputs().get("recordsSampled"));
        assertEquals(3, countRows("mt101_confirmation"));
        verify(getRequestedFor(urlEqualTo("/v1/swift/status/KEY-R1")));
        verify(getRequestedFor(urlEqualTo("/v1/swift/status/KEY-R2")));
        verify(getRequestedFor(urlEqualTo("/v1/swift/status/KEY-R3")));
    }

    @Test
    void correctiveQueryResolvesUncertainLedgerWithoutReSendingPay(WireMockRuntimeInfo wm) throws Exception {
        stubFor(get(urlEqualTo("/v1/swift/status/KEY-R1"))
                .willReturn(aResponse().withStatus(200)
                        .withBody("{\"status\":\"ACCEPTED\",\"gatewayReference\":\"GW-OK\"}")));
        insertCorrectiveStatusRecord("RUN-UNC", "SET-FIX", "R1", "KEY-R1", 301L, "UNCERTAIN");

        var result = provider.execute(contextWith("pay-mt101.records",
                Map.of("correctivePayRunId", "RUN-UNC")), Map.of(
                "mode", "query",
                "correctivePayStatuses", List.of("UNCERTAIN"),
                "resolveCorrectivePay", true,
                "acceptedStatuses", List.of("ACCEPTED"),
                "input", Map.of("sourceTaskRef", "pay-mt101", "sourceOutput", "records"),
                "query", Map.of("url", wm.getHttpBaseUrl() + "/v1/swift/status/${idempotencyKey}")));

        assertTrue(result.success(), () -> "expected success, got: " + result.details());
        assertEquals(1, result.outputs().get("queriedCount"));
        assertEquals(1, result.outputs().get("resolvedPayCount"));
        assertEquals(1, countRowsWithPayStatus("SENT"));
        assertEquals(0, countRowsWithPayStatus("UNCERTAIN"));
        verify(1, getRequestedFor(urlEqualTo("/v1/swift/status/KEY-R1")));
    }

    @Test
    void correctiveStatusRejectedAgainstSentLedgerDoesNotFlipArchiveAndMarksConflict(WireMockRuntimeInfo wm)
            throws Exception {
        // v35 (cierre de la divergencia ledger<->archive): STATUS dice REJECTED pero el ledger ya quedo SENT
        // (aceptacion previa). No se sobrescribe el fragmento NI se vuelca el archive a REJECTED: el ledger
        // conserva SENT + pay_conflict, el run queda UNCERTAIN, y la confirmacion del banco queda como evidencia.
        stubFor(get(urlEqualTo("/v1/swift/status/KEY-C1"))
                .willReturn(aResponse().withStatus(200)
                        .withBody("{\"status\":\"REJECTED\",\"gatewayReference\":\"GW-C1\"}")));
        insertRebuildRun("RUN-CONF", "SENT");
        insertCorrectiveStatusRecord("RUN-CONF", "SET-FIX", "C1", "KEY-C1", 501L, "SENT");

        var result = provider.execute(contextWith("pay-mt101.records",
                Map.of("correctivePayRunId", "RUN-CONF")), Map.of(
                "mode", "query",
                "correctivePayStatuses", List.of("SENT"),
                "resolveCorrectivePay", true,
                "acceptedStatuses", List.of("ACCEPTED", "CONFIRMED"),
                "input", Map.of("sourceTaskRef", "pay-mt101", "sourceOutput", "records"),
                "query", Map.of("url", wm.getHttpBaseUrl() + "/v1/swift/status/${idempotencyKey}")));

        assertTrue(result.success(), () -> "expected success, got: " + result.details());
        assertEquals(1, countRowsWithPayStatus("SENT"), "el fragmento conserva SENT (no se sobrescribe)");
        assertEquals("t", queryString("select pay_conflict from mt101_corrective_pay_fragment "
                + "where corrective_senders_reference = 'C1'"), "el fragmento queda pay_conflict=true");
        assertEquals("UNCERTAIN", queryString("select pay_status from mt101_rebuild_run "
                + "where rebuild_run_id = 'RUN-CONF'"), "el run pasa a UNCERTAIN por conflicto");
        assertEquals("SENT", queryString("select status from mt101_archive where id = 501"),
                "el archive NO se vuelca a REJECTED en conflicto (coherente con el ledger)");
        assertEquals(1, countRows("mt101_confirmation"), "la confirmacion del banco queda como evidencia");
        assertEquals(1, countRows("mt101_corrective_pay_action"), "se registra PAY_CONFLICT append-only");
    }

    @Test
    void correctiveStatusQueriesEachFragmentAgainstItsRouteEndpointAndFailsLoudWhenRouteHasNoEndpoint(
            WireMockRuntimeInfo wm) throws Exception {
        // P2 v22: STATUS por perfil/ruta. Con routeQuery cada fragmento se consulta contra el
        // endpoint de SU ruta; una ruta sin endpoint declarado es error ruidoso (sin fallback al
        // endpoint de otra ruta, p. ej. consultar un SFTP contra el REST).
        stubFor(get(urlPathMatching("/rest/status/.*"))
                .willReturn(aResponse().withStatus(200)
                        .withBody("{\"status\":\"CONFIRMED\",\"gatewayReference\":\"GW-REST\"}")));
        stubFor(get(urlPathMatching("/sftp/status/.*"))
                .willReturn(aResponse().withStatus(200)
                        .withBody("{\"status\":\"CONFIRMED\",\"gatewayReference\":\"GW-SFTP\"}")));
        insertCorrectiveStatusRecord("RUN-RT", "SET-RT", "R1", "KEY-R1", 401L, "SENT", "REST");
        insertCorrectiveStatusRecord("RUN-RT", "SET-RT", "R2", "KEY-R2", 402L, "SENT", "SFTP");
        // R3 ruteado por una ruta sin entrada en routeQuery: no se puede consultar sin fallback.
        insertCorrectiveStatusRecord("RUN-RT", "SET-RT", "R3", "KEY-R3", 403L, "SENT", "SFTP_PROFILE_B");

        var result = provider.execute(contextWith("pay-mt101.records",
                Map.of("correctivePayRunId", "RUN-RT")), Map.of(
                "mode", "query",
                "input", Map.of("sourceTaskRef", "pay-mt101", "sourceOutput", "records"),
                "routeQuery", Map.of(
                        "REST", Map.of("url", wm.getHttpBaseUrl() + "/rest/status/${idempotencyKey}"),
                        "SFTP", Map.of("url", wm.getHttpBaseUrl() + "/sftp/status/${idempotencyKey}"))));

        // R3 cuenta como error -> el run falla ruidosamente.
        assertFalse(result.success(), () -> "una ruta sin endpoint hace fallar STATUS: " + result.details());
        assertEquals(3, result.outputs().get("queriedCount"));
        assertEquals(2, result.outputs().get("confirmedCount"));
        assertEquals(1, result.outputs().get("errorCount"));
        // Cada fragmento se consulto contra el endpoint de SU ruta.
        verify(getRequestedFor(urlEqualTo("/rest/status/KEY-R1")));
        verify(getRequestedFor(urlEqualTo("/sftp/status/KEY-R2")));
        // R3 NUNCA se consulto contra otro endpoint (sin fallback).
        verify(0, getRequestedFor(urlEqualTo("/rest/status/KEY-R3")));
        verify(0, getRequestedFor(urlEqualTo("/sftp/status/KEY-R3")));
        assertEquals(2, countRows("mt101_confirmation"), "solo se confirman los fragmentos con ruta resuelta");
    }

    @Test
    void correctiveStatusResolvesSftpRouteFromBankAckFile() throws Exception {
        // StatusTransport SFTP: un fragmento ruteado por SFTP se resuelve leyendo el archivo ACK/NACK que
        // el banco deja en el directorio de confirmaciones, NO por HTTP. ACK -> ACCEPTED -> SENT.
        insertCorrectiveStatusRecord("RUN-SFTP", "SET-FIX", "S1", "KEY-S1", 401L, "UNCERTAIN", "SFTP_BANK");
        writeSftpFile("/upload/S1.ack", "PaymentStatusReport: STATUS=ACCP (ACK) ref=S1");

        var result = provider.execute(contextWith("pay-mt101.records",
                Map.of("correctivePayRunId", "RUN-SFTP")), Map.of(
                "mode", "query",
                "correctivePayStatuses", List.of("UNCERTAIN"),
                "resolveCorrectivePay", true,
                "acceptedStatuses", List.of("ACCEPTED"),
                "input", Map.of("sourceTaskRef", "pay-mt101", "sourceOutput", "records"),
                "routeQuery", Map.of("SFTP_BANK", Map.of(
                        "transport", "SFTP",
                        "responseFileTemplate", "/upload/${sendersReference}.ack",
                        "acceptedTokens", List.of("ACCP", "ACK"),
                        "rejectedTokens", List.of("RJCT", "NACK"),
                        "sftp", sftpRouteConfig()))));

        assertTrue(result.success(), () -> "expected success, got: " + result.details());
        assertEquals(1, result.outputs().get("resolvedPayCount"));
        assertEquals(1, countRowsWithPayStatus("SENT"), "el ACK del banco resuelve el fragmento SFTP a SENT");
        assertEquals(0, countRowsWithPayStatus("UNCERTAIN"));
    }

    @Test
    void correctiveStatusSftpKeepsFragmentPendingWhenBankHasNotAckedYet() throws Exception {
        // Si el banco AUN no dejo el archivo de respuesta, el fragmento queda pendiente (UNCERTAIN), NO
        // error: se reintenta en otra corrida. No se asume enviado ni rechazado.
        insertCorrectiveStatusRecord("RUN-SFTP2", "SET-FIX", "S2", "KEY-S2", 402L, "UNCERTAIN", "SFTP_BANK");
        // (no se escribe ningun archivo ACK)

        var result = provider.execute(contextWith("pay-mt101.records",
                Map.of("correctivePayRunId", "RUN-SFTP2")), Map.of(
                "mode", "query",
                "correctivePayStatuses", List.of("UNCERTAIN"),
                "resolveCorrectivePay", true,
                "acceptedStatuses", List.of("ACCEPTED"),
                "input", Map.of("sourceTaskRef", "pay-mt101", "sourceOutput", "records"),
                "routeQuery", Map.of("SFTP_BANK", Map.of(
                        "transport", "SFTP",
                        "responseFileTemplate", "/upload/${sendersReference}.ack",
                        "acceptedTokens", List.of("ACCP", "ACK"),
                        "sftp", sftpRouteConfig()))));

        assertTrue(result.success(), () -> "sin ACK aun, no es error: " + result.details());
        assertEquals(0, result.outputs().get("resolvedPayCount"));
        assertEquals(0, result.outputs().get("errorCount"), "archivo de respuesta ausente = pendiente, no error");
        assertEquals(1, countRowsWithPayStatus("UNCERTAIN"), "el fragmento sigue UNCERTAIN hasta el ACK");
    }

    private Map<String, Object> sftpRouteConfig() {
        return Map.of(
                "host", SFTP.getHost(),
                "port", SFTP.getMappedPort(22),
                "username", SFTP_USER,
                "password", SFTP_PASSWORD,
                "strictHostKeyChecking", false,
                "timeoutMillis", 15000);
    }

    private void writeSftpFile(String path, String content) throws Exception {
        Session session = null;
        ChannelSftp channel = null;
        try {
            var jsch = new JSch();
            session = jsch.getSession(SFTP_USER, SFTP.getHost(), SFTP.getMappedPort(22));
            session.setPassword(SFTP_PASSWORD);
            var props = new Properties();
            props.put("StrictHostKeyChecking", "no");
            session.setConfig(props);
            session.connect(5000);
            channel = (ChannelSftp) session.openChannel("sftp");
            channel.connect(5000);
            try (var input = new ByteArrayInputStream(content.getBytes(StandardCharsets.UTF_8))) {
                channel.put(input, path, ChannelSftp.OVERWRITE);
            }
        } finally {
            if (channel != null && channel.isConnected()) channel.disconnect();
            if (session != null && session.isConnected()) session.disconnect();
        }
    }

    @Test
    void queriesGatewayPerRecordAndPersistsConfirmations(WireMockRuntimeInfo wm) throws Exception {
        insertArchive(100L);
        insertArchive(101L);
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
        assertEquals(2, countArchiveRowsWithStatus("CONFIRMED"));
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
    void rejectsUnknownMode(WireMockRuntimeInfo wm) {
        var records = List.<Map<String, Object>>of(Map.of("gatewayReference", "X"));
        var error = assertThrows(IllegalArgumentException.class,
                () -> provider.execute(contextWith("pay-mt101.records", records), Map.of(
                        "mode", "webhook",
                        "input", Map.of("sourceTaskRef", "pay-mt101", "sourceOutput", "records"),
                        "query", Map.of("url", wm.getHttpBaseUrl() + "/x"))));
        assertTrue(error.getMessage().contains("webhook"),
                () -> "mensaje inesperado: " + error.getMessage());
    }

    // ------------------------------------------------------------------
    // mode=callback (M-2 suspend/resume)
    // ------------------------------------------------------------------

    @Test
    void callbackModeSuspendsWithPendingState() {
        var records = List.<Map<String, Object>>of(
                Map.of("sendersReference", "P1", "gatewayReference", "GW-1", "archiveId", 10L),
                Map.of("sendersReference", "P2", "gatewayReference", "GW-2", "archiveId", 11L));

        var result = provider.execute(contextWith("pay-mt101.records", records), Map.of(
                "mode", "callback",
                "input", Map.of("sourceTaskRef", "pay-mt101", "sourceOutput", "records")));

        assertTrue(result.suspended(), "callback debe suspender esperando el push del banco");
        assertEquals("callback", result.suspendedState().get("mode"));
        @SuppressWarnings("unchecked")
        var pending = (List<Map<String, Object>>) result.suspendedState().get("pending");
        assertEquals(2, pending.size());
        assertEquals("P1", pending.get(0).get("sendersReference"));
    }

    @Test
    void callbackResumeWithAllConfirmationsCompletesAndPersists() throws Exception {
        var state = Map.<String, Object>of(
                "mode", "callback",
                "pending", List.of(
                        Map.of("sendersReference", "P1", "gatewayReference", "GW-1", "archiveId", 10L),
                        Map.of("sendersReference", "P2", "gatewayReference", "GW-2", "archiveId", 11L)),
                // El resume service mergea el body del POST como externalEvent.
                "externalEvent", Map.of("confirmations", List.of(
                        Map.of("sendersReference", "P1", "status", "ACCP", "raw", "{\"k\":1}"),
                        Map.of("gatewayReference", "GW-2", "status", "RJCT"))));

        var result = provider.resume(new TaskContext(1L, 1L), Map.of(), state);

        assertTrue(result.success(), () -> "expected success, got: " + result.details());
        assertFalse(result.suspended());
        assertEquals(2, result.outputs().get("confirmedCount"));
        assertEquals(0, result.outputs().get("pendingCount"));
        assertEquals(2, countRows("mt101_confirmation"));
        assertEquals(2, countRowsWithType("CALLBACK"));
        assertEquals(1, countRowsWithStatus("ACCP"));
        assertEquals(1, countRowsWithStatus("RJCT"));
    }

    @Test
    void callbackResumePartialReSuspendsWithRemainingPending() throws Exception {
        var state = Map.<String, Object>of(
                "mode", "callback",
                "pending", List.of(
                        Map.of("sendersReference", "P1", "gatewayReference", "GW-1", "archiveId", 10L),
                        Map.of("sendersReference", "P2", "gatewayReference", "GW-2", "archiveId", 11L)),
                "externalEvent", Map.of("confirmations", List.of(
                        Map.of("sendersReference", "P1", "status", "ACCP"))));

        var result = provider.resume(new TaskContext(1L, 1L), Map.of(), state);

        assertTrue(result.suspended(), "con pendientes restantes debe re-suspender");
        @SuppressWarnings("unchecked")
        var pending = (List<Map<String, Object>>) result.suspendedState().get("pending");
        assertEquals(1, pending.size());
        assertEquals("P2", pending.get(0).get("sendersReference"));
        assertEquals(1, countRows("mt101_confirmation"), "la confirmacion parcial debe persistirse");
    }

    @Test
    void callbackResumeWithEmptyEventKeepsWaiting() throws Exception {
        var state = Map.<String, Object>of(
                "mode", "callback",
                "pending", List.of(Map.of("sendersReference", "P1", "archiveId", 10L)),
                "externalEvent", Map.of("ping", true));

        var result = provider.resume(new TaskContext(1L, 1L), Map.of(), state);

        assertTrue(result.suspended(), "callback sin confirmations debe seguir esperando");
        assertEquals(0, countRows("mt101_confirmation"));
    }

    // ------------------------------------------------------------------
    // mode=poll (M-2 suspend/resume)
    // ------------------------------------------------------------------

    @Test
    void pollModeSuspendsWhileNotFinalAndCompletesOnResume(WireMockRuntimeInfo wm) throws Exception {
        stubFor(get(urlPathMatching("/v1/swift/status/.*"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withBody("{\"status\":\"PENDING\"}")));

        var records = List.<Map<String, Object>>of(
                Map.of("sendersReference", "P1", "gatewayReference", "GW-1", "archiveId", 10L));
        var configuration = Map.<String, Object>of(
                "mode", "poll",
                "input", Map.of("sourceTaskRef", "pay-mt101", "sourceOutput", "records"),
                "query", Map.of("url", wm.getHttpBaseUrl() + "/v1/swift/status/${gatewayReference}"),
                "poll", Map.of("maxAttempts", 5));

        var first = provider.execute(contextWith("pay-mt101.records", records), configuration);
        assertTrue(first.suspended(), "status PENDING (no final) debe suspender");
        assertEquals("poll", first.suspendedState().get("mode"));
        assertEquals(1, first.suspendedState().get("attempt"));
        assertEquals(0, countRows("mt101_confirmation"),
                "estados intermedios no se persisten como confirmacion");

        // El gateway ahora responde final: el resume (scheduler/manual) completa.
        reset();
        stubFor(get(urlPathMatching("/v1/swift/status/.*"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withBody("{\"status\":\"ACCEPTED\",\"gatewayReference\":\"GW-1\"}")));

        var second = provider.resume(new TaskContext(1L, 1L), configuration, first.suspendedState());
        assertTrue(second.success(), () -> "expected success, got: " + second.details());
        assertFalse(second.suspended());
        assertEquals(1, second.outputs().get("confirmedCount"));
        assertEquals(2, second.outputs().get("attempt"));
        assertEquals(1, countRows("mt101_confirmation"));
        assertEquals(1, countRowsWithType("POLL"));
    }

    @Test
    void pollModeFailsWhenMaxAttemptsExhausted(WireMockRuntimeInfo wm) {
        stubFor(get(urlMatching(".*"))
                .willReturn(aResponse().withStatus(200).withBody("{\"status\":\"PENDING\"}")));

        var configuration = Map.<String, Object>of(
                "mode", "poll",
                "input", Map.of("sourceTaskRef", "pay-mt101", "sourceOutput", "records"),
                "query", Map.of("url", wm.getHttpBaseUrl() + "/x/${gatewayReference}"),
                "poll", Map.of("maxAttempts", 2));

        var records = List.<Map<String, Object>>of(
                Map.of("sendersReference", "P1", "gatewayReference", "GW-1", "archiveId", 10L));
        var first = provider.execute(contextWith("pay-mt101.records", records), configuration);
        assertTrue(first.suspended());

        var second = provider.resume(new TaskContext(1L, 1L), configuration, first.suspendedState());
        assertFalse(second.success(), "agotar maxAttempts debe reportar failure");
        assertFalse(second.suspended());
        assertEquals(1, second.outputs().get("pendingCount"));
        assertTrue(second.details().contains("exhausted"),
                () -> "detalle inesperado: " + second.details());
    }

    @Test
    void pollModeRespectsCustomFinalStatuses(WireMockRuntimeInfo wm) throws Exception {
        stubFor(get(urlMatching(".*"))
                .willReturn(aResponse().withStatus(200).withBody("{\"status\":\"SETTLED\"}")));

        var records = List.<Map<String, Object>>of(
                Map.of("sendersReference", "P1", "gatewayReference", "GW-1", "archiveId", 10L));
        var result = provider.execute(contextWith("pay-mt101.records", records), Map.of(
                "mode", "poll",
                "input", Map.of("sourceTaskRef", "pay-mt101", "sourceOutput", "records"),
                "query", Map.of("url", wm.getHttpBaseUrl() + "/x/${gatewayReference}"),
                "poll", Map.of("finalStatuses", List.of("SETTLED"))));

        assertTrue(result.success(), () -> "SETTLED configurado como final debe completar: " + result.details());
        assertEquals(1, countRows("mt101_confirmation"));
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

    // --- v59-item4: resolveNormalPay (delegacion al servicio de resolucion del PAY normal) ---

    @Test
    void resolveNormalPayDelegatesWithExplicitSetAndDefaultActorReason() {
        var captured = new java.util.ArrayList<String>();
        var stub = capturingResolutionService(captured, new Mt101PayUncertainResolutionService.NormalPayResolution(
                3, 1, 2, 0, 1));
        var taskProvider = new Mt101StatusTaskProvider(new ObjectMapper(), dataSource, null, stub);

        var result = taskProvider.execute(new TaskContext(1L, 1L), Map.of(
                "mode", "query",
                "resolveNormalPay", true,
                "connectionRef", "7",
                "fragmentSetId", "SET-EXPLICIT"));

        // Delegacion con los argumentos correctos: connectionRef + set explicito + actor/reason por defecto (accion
        // automatica del sistema, no maker humano).
        assertEquals(List.of("7|SET-EXPLICIT|MT101_STATUS|automatic reconciliation by MT101_STATUS"), captured);
        // Mapeo del resultado a outputs (visibilidad del conteo desde el pipeline).
        assertTrue(result.success(), () -> "detalle: " + result.details());
        assertEquals("SET-EXPLICIT", result.outputs().get("fragmentSetId"));
        assertEquals(3, result.outputs().get("resolvedSent"));
        assertEquals(1, result.outputs().get("resolvedRejected"));
        assertEquals(2, result.outputs().get("stillPending"));
        assertEquals(0, result.outputs().get("gatewayErrors"));
        assertEquals(1, result.outputs().get("conflicts"));
        assertTrue(result.details().contains("conflicts=1"), () -> "detalle: " + result.details());
    }

    @Test
    void resolveNormalPayDerivesFragmentSetFromUpstreamOutput() {
        var captured = new java.util.ArrayList<String>();
        var stub = capturingResolutionService(captured, new Mt101PayUncertainResolutionService.NormalPayResolution(
                1, 0, 0, 0, 0));
        var taskProvider = new Mt101StatusTaskProvider(new ObjectMapper(), dataSource, null, stub);

        // Sin fragmentSetId explicito: se deriva del output del build upstream (espejo de como el correctivo deriva
        // correctivePayRunId de taskOutputs).
        var context = new TaskContext(1L, 1L);
        context.attributes().put("taskOutputs", Map.of("build.fragmentSetId", "SET-DERIVED"));

        var result = taskProvider.execute(context, Map.of(
                "mode", "query",
                "resolveNormalPay", true,
                "executedBy", "ops",
                "reason", "manual trigger",
                "input", Map.of("sourceTaskRef", "build")));

        assertEquals(List.of("null|SET-DERIVED|ops|manual trigger"), captured);
        assertTrue(result.success(), () -> "detalle: " + result.details());
        assertEquals("SET-DERIVED", result.outputs().get("fragmentSetId"));
    }

    @Test
    void resolveNormalPayFailsWhenSetCannotBeResolved() {
        var stub = capturingResolutionService(new java.util.ArrayList<>(),
                new Mt101PayUncertainResolutionService.NormalPayResolution(0, 0, 0, 0, 0));
        var taskProvider = new Mt101StatusTaskProvider(new ObjectMapper(), dataSource, null, stub);

        // Sin fragmentSetId explicito ni output upstream con fragmentSetId: error ruidoso (sin fallback silencioso).
        var error = assertThrows(IllegalArgumentException.class,
                () -> taskProvider.execute(new TaskContext(1L, 1L), Map.of(
                        "mode", "query",
                        "resolveNormalPay", true)));
        assertTrue(error.getMessage().contains("fragmentSetId"), () -> "mensaje: " + error.getMessage());
    }

    @Test
    void resolveNormalPayRequiresWiredService() {
        // El provider sin servicio inyectado (path CDI de test previo) falla claro si se pide resolveNormalPay.
        var error = assertThrows(IllegalStateException.class,
                () -> provider.execute(new TaskContext(1L, 1L), Map.of(
                        "mode", "query",
                        "resolveNormalPay", true,
                        "fragmentSetId", "SET-X")));
        assertTrue(error.getMessage().contains("resolution service"), () -> "mensaje: " + error.getMessage());
    }

    private Mt101PayUncertainResolutionService capturingResolutionService(
            List<String> sink, Mt101PayUncertainResolutionService.NormalPayResolution result) {
        // Subclase de captura: solo intercepta resolveUncertainNormalPay para verificar la delegacion (los tests de
        // la logica real viven en Mt101PayUncertainResolutionServiceTest). Los colaboradores van null: el metodo se
        // sobreescribe y no toca super.
        return new Mt101PayUncertainResolutionService(null, null, null, new ObjectMapper(), null, null, null) {
            @Override
            public NormalPayResolution resolveUncertainNormalPay(String connectionRef, String fragmentSetId,
                                                                 String executedBy, String reason) {
                sink.add(connectionRef + "|" + fragmentSetId + "|" + executedBy + "|" + reason);
                return result;
            }
        };
    }

    // --- helpers ---

    private TaskContext contextWith(String key, List<?> records) {
        var context = new TaskContext(1L, 1L);
        context.attributes().put("taskOutputs", Map.of(key, records));
        return context;
    }

    private TaskContext contextWith(String key, Map<String, Object> source) {
        var context = new TaskContext(1L, 1L);
        context.attributes().put("taskOutputs", Map.of(key, source));
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
            stmt.executeUpdate("drop table if exists mt101_archive");
            stmt.executeUpdate("drop table if exists mt101_corrective_pay_fragment");
            stmt.executeUpdate("drop table if exists mt101_build_fragment");
            stmt.executeUpdate("drop table if exists mt101_confirmation");
            stmt.executeUpdate("create table mt101_archive (" +
                    " id bigint primary key," +
                    " senders_reference varchar(16)," +
                    " process_execution_id bigint," +
                    " status varchar(20) not null default 'ARCHIVED'," +
                    " created_at timestamp not null default current_timestamp," +
                    " updated_at timestamp not null default current_timestamp)");
            stmt.executeUpdate("create table mt101_build_fragment (" +
                    " id bigserial primary key," +
                    " fragment_set_id varchar(80) not null," +
                    " senders_reference varchar(16) not null," +
                    " routed_as varchar(80)," +
                    " process_execution_id bigint)");
            stmt.executeUpdate("create table mt101_corrective_pay_fragment (" +
                    " id bigserial primary key," +
                    " rebuild_run_id varchar(80) not null," +
                    " corrective_set_id varchar(80) not null," +
                    " corrective_senders_reference varchar(16) not null," +
                    " gateway_reference varchar(120)," +
                    " idempotency_key varchar(180) not null," +
                    " pay_status varchar(30) not null," +
                    " error_message text," +
                    " resolved_at timestamp," +
                    " resolution_source varchar(40)," +
                    " pay_conflict boolean not null default false," +
                    " pay_conflict_reason text," +
                    " created_at timestamp not null default current_timestamp," +
                    " updated_at timestamp not null default current_timestamp)");
            // v35: tablas minimas para la ruta de conflicto (recordTerminalPayConflict actualiza el run y
            // registra PAY_CONFLICT append-only bajo el mismo advisory lock).
            stmt.executeUpdate("drop table if exists mt101_rebuild_run");
            stmt.executeUpdate("create table mt101_rebuild_run (" +
                    " rebuild_run_id varchar(80) primary key, pay_status varchar(30) not null default 'EXECUTING'," +
                    " pay_uncertain_reason text, pay_error_message text, pay_completed_at timestamp," +
                    " updated_at timestamp not null default current_timestamp)");
            stmt.executeUpdate("drop table if exists mt101_corrective_pay_action");
            stmt.executeUpdate("create table mt101_corrective_pay_action (" +
                    " id bigserial primary key, rebuild_run_id varchar(80) not null," +
                    " action_type varchar(30) not null, previous_status varchar(30), new_status varchar(30)," +
                    " actor varchar(120), reason text, ticket varchar(120)," +
                    " payload_hash varchar(64), config_hash varchar(64)," +
                    " previous_action_hash varchar(64), action_hash varchar(64)," +
                    " created_at timestamp not null default current_timestamp)");
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

    private void insertArchive(long id) throws SQLException {
        try (Connection c = dataSource.getConnection();
             var stmt = c.prepareStatement("insert into mt101_archive (id, status) values (?, 'SENT')")) {
            stmt.setLong(1, id);
            stmt.executeUpdate();
        }
    }

    private void insertCorrectiveStatusRecord(String runId,
                                              String correctiveSetId,
                                              String reference,
                                              String idempotencyKey,
                                              long archiveId) throws SQLException {
        insertCorrectiveStatusRecord(runId, correctiveSetId, reference, idempotencyKey, archiveId, "SENT");
    }

    private void insertCorrectiveStatusRecord(String runId,
                                              String correctiveSetId,
                                              String reference,
                                              String idempotencyKey,
                                              long archiveId,
                                              String payStatus) throws SQLException {
        insertCorrectiveStatusRecord(runId, correctiveSetId, reference, idempotencyKey, archiveId, payStatus, null);
    }

    private void insertCorrectiveStatusRecord(String runId,
                                              String correctiveSetId,
                                              String reference,
                                              String idempotencyKey,
                                              long archiveId,
                                              String payStatus,
                                              String routedAs) throws SQLException {
        try (Connection c = dataSource.getConnection()) {
            try (var fragment = c.prepareStatement(
                    "insert into mt101_build_fragment (fragment_set_id, senders_reference, routed_as, process_execution_id) values (?, ?, ?, 1)")) {
                fragment.setString(1, correctiveSetId);
                fragment.setString(2, reference);
                fragment.setString(3, routedAs);
                fragment.executeUpdate();
            }
            try (var archive = c.prepareStatement(
                    "insert into mt101_archive (id, senders_reference, process_execution_id, status) values (?, ?, 1, 'SENT')")) {
                archive.setLong(1, archiveId);
                archive.setString(2, reference);
                archive.executeUpdate();
            }
            try (var ledger = c.prepareStatement(
                    "insert into mt101_corrective_pay_fragment "
                            + "(rebuild_run_id, corrective_set_id, corrective_senders_reference, gateway_reference, idempotency_key, pay_status) "
                            + "values (?, ?, ?, ?, ?, ?)")) {
                ledger.setString(1, runId);
                ledger.setString(2, correctiveSetId);
                ledger.setString(3, reference);
                ledger.setString(4, "GW-" + reference);
                ledger.setString(5, idempotencyKey);
                ledger.setString(6, payStatus);
                ledger.executeUpdate();
            }
        }
    }

    private void insertRebuildRun(String runId, String payStatus) throws SQLException {
        try (Connection c = dataSource.getConnection();
             var stmt = c.prepareStatement("insert into mt101_rebuild_run (rebuild_run_id, pay_status) values (?, ?)")) {
            stmt.setString(1, runId);
            stmt.setString(2, payStatus);
            stmt.executeUpdate();
        }
    }

    private String queryString(String sql) throws SQLException {
        try (Connection c = dataSource.getConnection();
             var stmt = c.prepareStatement(sql);
             var rs = stmt.executeQuery()) {
            return rs.next() ? rs.getString(1) : null;
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

    private int countArchiveRowsWithStatus(String status) throws SQLException {
        try (Connection c = dataSource.getConnection();
             var stmt = c.prepareStatement("select count(*) from mt101_archive where status = ?")) {
            stmt.setString(1, status);
            try (var rs = stmt.executeQuery()) {
                rs.next();
                return rs.getInt(1);
            }
        }
    }

    private int countRowsWithType(String confirmationType) throws SQLException {
        try (Connection c = dataSource.getConnection();
             var stmt = c.prepareStatement("select count(*) from mt101_confirmation where confirmation_type = ?")) {
            stmt.setString(1, confirmationType);
            try (var rs = stmt.executeQuery()) {
                rs.next();
                return rs.getInt(1);
            }
        }
    }

    private int countRowsWithPayStatus(String payStatus) throws SQLException {
        try (Connection c = dataSource.getConnection();
             var stmt = c.prepareStatement("select count(*) from mt101_corrective_pay_fragment where pay_status = ?")) {
            stmt.setString(1, payStatus);
            try (var rs = stmt.executeQuery()) {
                rs.next();
                return rs.getInt(1);
            }
        }
    }
}
