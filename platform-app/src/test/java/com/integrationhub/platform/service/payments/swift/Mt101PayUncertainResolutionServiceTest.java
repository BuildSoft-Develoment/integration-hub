package com.integrationhub.platform.service.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.junit5.WireMockRuntimeInfo;
import com.github.tomakehurst.wiremock.junit5.WireMockTest;
import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.provider.task.payments.swift.Mt101StatusQueryExecutor;
import com.integrationhub.platform.repository.payments.swift.Mt101ConfirmationRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
import com.integrationhub.platform.service.execution.RecordAuditEmitter;
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
import java.util.Map;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.stubFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathMatching;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

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
    private CapturingAuditEmitter auditEmitter;
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
        auditEmitter = new CapturingAuditEmitter();
        service = new Mt101PayUncertainResolutionService(dataSource, null, repository, executor,
                new Mt101ConfirmationRepository(), auditEmitter, configSource);
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
    void resolvesLargeUncertainSetInBoundedMemoryLeavingResidualForReconciliation() throws Exception {
        // #1 (evidencia de escala del PAY normal): el resolutor pagina (PAGE_SIZE=500) -> memoria acotada. Con N
        // fragmentos UNCERTAIN (mitad ACCEPTED, mitad PENDING en el gateway), transiciona los aceptados a SENT a
        // traves de MULTIPLES paginas y deja los pendientes sin tocar; el residual (stillPending>0) es lo que hace que
        // el proceso quede NEEDS_RECONCILIATION (G1 needsReconciliation). N por defecto 3 paginas; stress via
        // -Dresolve.rows=N (un 1M literal por HTTP no es practico: es 1 llamada al gateway por fragmento).
        int rows = Integer.getInteger("resolve.rows", 1500);
        var setId = "PAY-UNC-SCALE";
        var refs = new ArrayList<String>(rows);
        var statuses = new ArrayList<String>(rows);
        int accepted = 0;
        int pending = 0;
        for (int i = 0; i < rows; i++) {
            if (i % 2 == 0) {
                refs.add("A" + i);
                accepted++;
            } else {
                refs.add("P" + i);
                pending++;
            }
            statuses.add("UNCERTAIN");
        }
        seedBatch(setId, refs, statuses);
        stubFor(get(urlPathMatching("/status/A.*")).willReturn(aResponse().withHeader("Content-Type", "application/json")
                .withBody("{\"status\":\"ACCEPTED\"}")));
        stubFor(get(urlPathMatching("/status/P.*")).willReturn(aResponse().withHeader("Content-Type", "application/json")
                .withBody("{\"status\":\"PENDING\"}")));

        var result = service.resolveUncertainNormalPay(null, setId, "ops", "conciliacion masiva");

        assertEquals(accepted, result.resolvedSent(), "todos los ACCEPTED -> SENT, a traves de multiples paginas");
        assertEquals(pending, result.stillPending(), "los PENDING quedan sin resolver (residual)");
        assertEquals(0, result.resolvedRejected());
        assertEquals(0, result.gatewayErrors());
        assertEquals(0, result.conflicts());
        assertTrue(result.stillPending() > 0,
                "residual > 0 -> el proceso queda NEEDS_RECONCILIATION (G1 needsReconciliation)");
    }

    private void seedBatch(String setId, List<String> refs, List<String> statuses) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement("insert into mt101_build_fragment (fragment_set_id, "
                     + "process_execution_id, task_definition_id, source_table, fragment_index, fragment_total, "
                     + "senders_reference, payload_hash, raw_payload, message_json, status) "
                     + "values (?, 100, 20, 'staging_record', ?, 3, ?, repeat('a',64), 'raw', ?, ?)")) {
            for (int i = 0; i < refs.size(); i++) {
                var ref = refs.get(i);
                statement.setString(1, setId);
                statement.setInt(2, i + 1);
                statement.setString(3, ref);
                statement.setString(4, "{\"sequenceA\":{\"sendersReference\":\"" + ref + "\"}}");
                statement.setString(5, statuses.get(i));
                statement.addBatch();
            }
            statement.executeBatch();
        }
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
                new Mt101StatusQueryExecutor(new ObjectMapper()), new Mt101ConfirmationRepository(), null, configSource);

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

    @Test
    void sentFragmentRejectedByBankIsFlaggedAsConflictNotOverwritten() throws Exception {
        // A (Modelo B): un fragmento ya SENT que el banco luego RECHAZA vía STATUS es una contradicción terminal
        // (SENT vs REJECTED incompatibles): se marca pay_conflict + confirmación append-only y NO se sobrescribe
        // (conciliación manual). Un SENT que el banco CONFIRMA no se toca. Cierra la asimetría SENT→banco-REJECTED.
        var setId = "PAY-SENT-CONFLICT";
        seed(setId, "K1", 1, "SENT");   // banco lo RECHAZA -> conflicto
        seed(setId, "K2", 2, "SENT");   // banco lo CONFIRMA -> sin conflicto
        seedArchive("K1", 100L, 6001L);
        stubFor(get(urlEqualTo("/status/K1")).willReturn(aResponse().withHeader("Content-Type", "application/json")
                .withBody("{\"status\":\"REJECTED\",\"gatewayReference\":\"GW-K1\"}")));
        stubFor(get(urlEqualTo("/status/K2")).willReturn(aResponse().withHeader("Content-Type", "application/json")
                .withBody("{\"status\":\"ACCEPTED\"}")));

        var result = service.resolveUncertainNormalPay(null, setId, "ana", "reconciliacion SENT");

        assertEquals(1, result.conflicts(), "K1: SENT contradicho por banco REJECTED -> 1 conflicto");
        assertEquals("SENT", statusFor(setId, "K1"), "el estado real (SENT) NO se sobrescribe (Modelo B)");
        assertTrue(payConflictFor(setId, "K1"), "K1 queda marcado pay_conflict para conciliación manual");
        assertFalse(payConflictFor(setId, "K2"), "K2 confirmado por el banco: sin conflicto");
        assertEquals(1L, countConfirmations(6001L), "confirmación append-only del rechazo tardío de K1");
        // item 2: además del booleano + confirmación, se emite la trama append-only PAY_CONFLICT con source=STATUS.
        var trama = auditEmitter.firstOfStage("PAY_CONFLICT");
        assertTrue(trama.isPresent(), "STATUS/RECONCILE emite la trama append-only PAY_CONFLICT");
        assertEquals("K1", trama.get().recordId(), "la trama identifica el :20: en conflicto");
        assertEquals("STATUS", trama.get().attributes().get("source"), "la trama marca source=STATUS");
        assertEquals("SENT", trama.get().attributes().get("previousStatus"));
        assertEquals("REJECTED", trama.get().attributes().get("incomingTerminal"));
        assertEquals("ana", trama.get().attributes().get("actor"), "queda el actor que ejecutó la reconciliación");
    }

    @Test
    void reconcilingSentIsIdempotentAndDoesNotReflagAnExistingConflict() throws Exception {
        // Idempotencia: una segunda reconciliación de un SENT ya marcado pay_conflict NO lo re-procesa ni duplica la
        // confirmación (el filtro pay_conflict=false lo excluye).
        var setId = "PAY-SENT-IDEMP";
        seed(setId, "I1", 1, "SENT");
        seedArchive("I1", 100L, 6002L);
        stubFor(get(urlEqualTo("/status/I1")).willReturn(aResponse().withHeader("Content-Type", "application/json")
                .withBody("{\"status\":\"REJECTED\"}")));

        assertEquals(1, service.resolveUncertainNormalPay(null, setId, "ana", "1a").conflicts());
        assertEquals(0, service.resolveUncertainNormalPay(null, setId, "ana", "2a").conflicts(),
                "un SENT ya en conflicto no se re-marca en una segunda pasada");
        assertEquals(1L, countConfirmations(6002L), "no se duplica la confirmación del conflicto");
    }

    @Test
    void fragmentTransitionAndConfirmationAreAtomic() throws Exception {
        // P1 (atomicidad): si la inserción de la confirmación falla, la transición del fragmento se REVIERTE — nunca
        // queda un fragmento resuelto sin evidencia (y sigue seleccionable para un reintento). Se fuerza el fallo
        // dropeando mt101_confirmation: el update del fragmento y el insert de confirmación van en la MISMA tx.
        var setId = "PAY-UNC-ATOMIC";
        seed(setId, "T1", 1, "UNCERTAIN");
        seedArchive("T1", 100L, 7001L);
        stubFor(get(urlEqualTo("/status/T1")).willReturn(aResponse().withHeader("Content-Type", "application/json")
                .withBody("{\"status\":\"ACCEPTED\",\"gatewayReference\":\"GW-T1\"}")));
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("drop table mt101_confirmation");
        }

        assertThrows(IllegalStateException.class,
                () -> service.resolveUncertainNormalPay(null, setId, "ana", "atomic"),
                "el fallo de la confirmación aborta la resolución");
        assertEquals("UNCERTAIN", statusFor(setId, "T1"),
                "la transición se revierte con la confirmación: sin fragmento resuelto sin evidencia");
    }

    // --- helpers ---

    private boolean payConflictFor(String setId, String reference) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "select pay_conflict from mt101_build_fragment where fragment_set_id = ? and senders_reference = ?")) {
            statement.setString(1, setId);
            statement.setString(2, reference);
            try (var rs = statement.executeQuery()) {
                rs.next();
                return rs.getBoolean(1);
            }
        }
    }

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
                    + "pay_conflict boolean not null default false,"
                    + "pay_conflict_reason text,"
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

    /** Captura las tramas de auditoría para verificar la trama append-only PAY_CONFLICT (item 2). */
    private static final class CapturingAuditEmitter implements RecordAuditEmitter {
        private final java.util.List<AuditEnvelope> captured = new java.util.ArrayList<>();

        @Override
        public void emitRecords(java.util.Collection<AuditEnvelope> envelopes) {
            captured.addAll(envelopes);
        }

        java.util.Optional<AuditEnvelope> firstOfStage(String stage) {
            return captured.stream().filter(envelope -> stage.equals(envelope.stage())).findFirst();
        }
    }
}
