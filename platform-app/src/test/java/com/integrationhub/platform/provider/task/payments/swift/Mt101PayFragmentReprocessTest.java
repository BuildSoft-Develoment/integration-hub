package com.integrationhub.platform.provider.task.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.integrationhub.platform.repository.payments.swift.Mt101RebuildRepository;
import com.integrationhub.platform.spi.task.payments.PaymentMessageTransport;
import com.integrationhub.platform.spi.task.payments.TransportResult;
import com.integrationhub.platform.spi.task.payments.Mt101Message;
import com.integrationhub.platform.spi.task.TaskContext;
import jakarta.enterprise.inject.Instance;
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
import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 008-mensajeria-pagos RF-004, RF-022, T-037, T-041
 */
@Testcontainers
class Mt101PayFragmentReprocessTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("mt101_pay_reprocess")
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
    void paySendsOnlyArchivedFragmentsAndMarksAcceptedRejected() throws Exception {
        var fragmentSetId = "PAY-REPROCESS-1";
        insertFragmentSet(fragmentSetId, "F1", "F2", "F3");
        var fragmentSource = fragmentStore.source(null, fragmentSetId, 3);
        fragmentStore.markStatus(fragmentSource, "F1", "ARCHIVED", null);
        fragmentStore.markStatus(fragmentSource, "F2", "REJECTED", "previous validation failure");
        fragmentStore.markStatus(fragmentSource, "F3", "ARCHIVED", null);

        var transport = new StubTransport(List.of(
                TransportResult.accepted("GW-F1", 1, 10L),
                TransportResult.rejected(2, 20L, "HTTP 500: bank unavailable")
        ));
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport), fragmentStore);

        var result = provider.execute(contextWith(fragmentSource), payConfig(1));

        assertFalse(result.success(), "un rechazo de banco debe hacer fallar la tarea PAY");
        assertEquals(2, result.outputs().get("dispatchCount"));
        assertEquals(1, result.outputs().get("sentCount"));
        assertEquals(1, result.outputs().get("acceptedCount"));
        assertEquals(1, result.outputs().get("rejectedCount"));
        assertEquals(List.of("F1", "F3"), transport.receivedReferences(),
                "PAY por defecto solo consume fragmentos ARCHIVED, no REJECTED");
        assertEquals("SENT", fragmentStatus(fragmentSetId, "F1"));
        assertEquals("REJECTED", fragmentStatus(fragmentSetId, "F2"));
        assertEquals("REJECTED", fragmentStatus(fragmentSetId, "F3"));
        assertTrue(fragmentError(fragmentSetId, "F2").contains("previous validation"));
        assertTrue(fragmentError(fragmentSetId, "F3").contains("HTTP 500"));
    }

    @Test
    void explicitRejectedStatusReprocessesOnlyFailedFragments() throws Exception {
        var fragmentSetId = "PAY-REPROCESS-2";
        insertFragmentSet(fragmentSetId, "F1", "F2", "F3");
        var fragmentSource = fragmentStore.source(null, fragmentSetId, 3);
        fragmentStore.markStatus(fragmentSource, "F1", "SENT", null);
        fragmentStore.markStatus(fragmentSource, "F2", "REJECTED", "temporary transport failure");
        fragmentStore.markStatus(fragmentSource, "F3", "ARCHIVED", null);

        var retrySource = new LinkedHashMap<>(fragmentSource);
        retrySource.put("statuses", List.of("REJECTED"));
        var transport = new StubTransport(List.of(TransportResult.accepted("GW-F2", 1, 10L)));
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport), fragmentStore);

        var result = provider.execute(contextWith(retrySource), payConfig(50));

        assertTrue(result.success(), () -> "expected retry to pass: " + result.details());
        assertEquals(1, result.outputs().get("dispatchCount"));
        assertEquals(1, result.outputs().get("sentCount"));
        assertEquals(List.of("F2"), transport.receivedReferences(),
                "reproceso explicito debe tomar solo fragmentos REJECTED");
        assertEquals("SENT", fragmentStatus(fragmentSetId, "F1"));
        assertEquals("SENT", fragmentStatus(fragmentSetId, "F2"));
        assertEquals("ARCHIVED", fragmentStatus(fragmentSetId, "F3"));
    }

    @Test
    void correctiveDispatchWithoutPersistedSpecInvalidatesAndNeverCallsBank() throws Exception {
        // v37: un run correctivo SIN especificacion ejecutable persistida NO tiene fallback al resolver
        // vigente: el fragmento PREPARED se INVALIDA y NUNCA se llama al banco.
        var runId = "RUN-NOSPEC";
        var fragmentSetId = "PAY-NOSPEC";
        insertFragmentSet(fragmentSetId, "Z1");
        var fragmentSource = fragmentStore.source(null, fragmentSetId, 1);
        fragmentSource.put("correctivePayRunId", runId);
        fragmentStore.markStatus(fragmentSource, "Z1", "ARCHIVED", null);
        ensureRun(runId);
        // Ledger PREPARED pero SIN dispatch_spec_json (spec nula).
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "insert into mt101_corrective_pay_fragment (rebuild_run_id, corrective_set_id, "
                             + "corrective_senders_reference, payload_hash, idempotency_key, pay_status, prepared_at) "
                             + "values (?, ?, ?, ?, ?, 'PREPARED', current_timestamp)")) {
            statement.setString(1, runId);
            statement.setString(2, fragmentSetId);
            statement.setString(3, "Z1");
            statement.setString(4, sha256Hex("{\"sendersReference\":\"Z1\"}"));
            statement.setString(5, "KEY-Z1");
            statement.executeUpdate();
        }
        var transport = new StubTransport(List.of(TransportResult.accepted("GW-Z1", 1, 10L)));
        var payStore = new Mt101CorrectivePayStore(dataSource, null, new Mt101RebuildRepository());
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport), fragmentStore, null, null, payStore);

        provider.execute(contextWith(fragmentSource), payConfig(50));

        assertEquals(0, transport.callsReceived(), "sin spec persistido NO se llama al banco");
        assertEquals("INVALIDATED", payLedgerStatus(runId, "Z1"), "sin spec el fragmento se INVALIDA (sin fallback)");
    }

    @Test
    void correctiveDispatchExecutesPersistedSpecNotTheLiveConfig() throws Exception {
        // v37: el dispatch correctivo ejecuta el PLAN PERSISTIDO; Mt101PayRouteResolver ya no corre aqui. Se
        // pasa una config vigente con routeTransports que, de re-resolverse con routed_as nulo, LANZARIA; como
        // el plan se lee del ledger (REST), el envio procede sin tocar el resolver.
        var runId = "RUN-SPEC-SRC";
        var fragmentSetId = "PAY-SPEC-SRC";
        insertFragmentSet(fragmentSetId, "W1");
        var fragmentSource = fragmentStore.source(null, fragmentSetId, 1);
        fragmentSource.put("correctivePayRunId", runId);
        fragmentStore.markStatus(fragmentSource, "W1", "ARCHIVED", null);
        insertPayLedger(runId, fragmentSetId, "W1"); // persiste la spec REST aprobada

        var transport = new StubTransport(List.of(TransportResult.accepted("GW-W1", 1, 10L)));
        var payStore = new Mt101CorrectivePayStore(dataSource, null, new Mt101RebuildRepository());
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport), fragmentStore, null, null, payStore);
        // Config vigente que el resolver rechazaria (routeTransports + routed_as nulo): si se ejecutara el
        // resolver en el dispatch, lanzaria; al leer del ledger, no se toca.
        var liveConfigWithRouteThatWouldThrow = Map.<String, Object>of(
                "transport", "REST", "pageSize", 50,
                "routeTransports", Map.of("BANK_A", Map.of("transport", "REST",
                        "rest", Map.of("url", "https://bank-a/${sendersReference}"))),
                "input", Map.of("sourceTaskRef", "build", "sourceOutput", "fragments"));

        var result = provider.execute(contextWith(fragmentSource), liveConfigWithRouteThatWouldThrow);

        assertTrue(result.success(), () -> "el plan persistido se ejecuta sin resolver: " + result.details());
        assertEquals(1, transport.callsReceived(), "un solo envio, desde el plan persistido");
        assertEquals("SENT", payLedgerStatus(runId, "W1"));
    }

    @Test
    void correctiveDispatchUsesPersistedSftpTransportNotLiveRestConfig() throws Exception {
        // v37 (P0.1): el transporte sale SIEMPRE del plan persistido. La config viva es REST SIN routeTransports
        // (el caso que dejaba defaultTransport=REST); el plan persistido es SFTP -> debe usarse SFTP, no REST.
        var runId = "RUN-SFTP-SPEC";
        var fragmentSetId = "PAY-SFTP-SPEC";
        insertFragmentSet(fragmentSetId, "Q1");
        var fragmentSource = fragmentStore.source(null, fragmentSetId, 1);
        fragmentSource.put("correctivePayRunId", runId);
        fragmentStore.markStatus(fragmentSource, "Q1", "ARCHIVED", null);
        insertPayLedgerSftp(runId, fragmentSetId, "Q1");

        var rest = new StubTransport("REST", List.of(TransportResult.accepted("GW-R", 1, 1L)));
        var sftp = new StubTransport("SFTP", List.of(TransportResult.accepted("GW-S", 1, 1L)));
        var payStore = new Mt101CorrectivePayStore(dataSource, null, new Mt101RebuildRepository());
        var provider = new Mt101PayTaskProvider(new InstanceOfList<>(List.of(rest, sftp)), fragmentStore,
                null, null, payStore);

        provider.execute(contextWith(fragmentSource), payConfig(50)); // config viva: transport REST, sin routes

        assertEquals(0, rest.callsReceived(), "NO se usa el transporte REST de la config viva");
        assertEquals(1, sftp.callsReceived(), "se usa el transporte SFTP del plan persistido");
        assertEquals("SENT", payLedgerStatus(runId, "Q1"));
    }

    @Test
    void correctiveDispatchInvalidatesWhenPersistedSpecTamperedWithoutHash() throws Exception {
        // v37 (P0.2): integridad. Si dispatch_spec_json se altera sin recalcular dispatch_spec_hash, el
        // dispatcher lo detecta (specHash(json) != hash persistido) -> INVALIDATED, sin llamar al banco.
        var runId = "RUN-TAMPER";
        var fragmentSetId = "PAY-TAMPER";
        insertFragmentSet(fragmentSetId, "T9");
        var fragmentSource = fragmentStore.source(null, fragmentSetId, 1);
        fragmentSource.put("correctivePayRunId", runId);
        fragmentStore.markStatus(fragmentSource, "T9", "ARCHIVED", null);
        insertPayLedger(runId, fragmentSetId, "T9");
        try (Connection connection = dataSource.getConnection(); var statement = connection.createStatement()) {
            statement.executeUpdate("update mt101_corrective_pay_fragment set dispatch_spec_json = "
                    + "dispatch_spec_json || ' ' where rebuild_run_id = '" + runId + "'"); // altera el json, no el hash
        }
        var transport = new StubTransport(List.of(TransportResult.accepted("GW", 1, 1L)));
        var payStore = new Mt101CorrectivePayStore(dataSource, null, new Mt101RebuildRepository());
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport), fragmentStore, null, null, payStore);

        provider.execute(contextWith(fragmentSource), payConfig(50));

        assertEquals(0, transport.callsReceived(), "una spec manipulada NO se envia al banco");
        assertEquals("INVALIDATED", payLedgerStatus(runId, "T9"), "spec manipulada -> INVALIDATED");
    }

    @Test
    void dispatchPlanCompilerRejectsNonStandardSecretKeysAndUrlCredentials() {
        // v37 (P1): deteccion estricta de secretos: claves no estandar (X-API-Key, ...) y credenciales en URL.
        var compiler = new Mt101DispatchPlanCompiler(new com.fasterxml.jackson.databind.ObjectMapper());
        var message = sampleMessage("SEC3");
        var apiKeyLiteral = Map.<String, Object>of("transport", "REST", "rest", Map.of("url", "https://b/",
                "extraHeaders", Map.of("X-API-Key", "clave-real-del-banco")));
        assertTrue(assertThrows(IllegalStateException.class,
                () -> compiler.compile(apiKeyLiteral, null, null, message)).getMessage().contains("X-API-Key"));

        var urlCredential = Map.<String, Object>of("transport", "REST",
                "rest", Map.of("url", "https://user:pass@bank/"));
        assertThrows(IllegalStateException.class, () -> compiler.compile(urlCredential, null, null, message));

        var apiKeyRef = Map.<String, Object>of("transport", "REST", "rest", Map.of("url", "https://b/",
                "extraHeaders", Map.of("X-API-Key", "${secret:bank-api-key}")));
        var spec = compiler.compile(apiKeyRef, null, null, message);
        assertTrue(spec.specJson().contains("${secret:bank-api-key}"), "una referencia se conserva");
    }

    private void insertPayLedgerSftp(String runId, String correctiveSetId, String reference) throws SQLException {
        ensureRun(runId);
        var message = sampleMessage(reference);
        var sftpConfig = Map.<String, Object>of("transport", "SFTP",
                "sftp", Map.of("host", "sftp.bank.local", "dropPathTemplate", "/inbox/${sendersReference}.fin"));
        var plan = Mt101PayRouteResolver.resolve(sftpConfig, null, null, message);
        var payloadHash = sha256Hex("{\"sendersReference\":\"" + reference + "\"}");
        var planHash = Mt101PayRouteResolver.dispatchPlanHash(plan, payloadHash, null, message);
        var destination = Mt101PayRouteResolver.dispatchDestination(plan, message);
        var spec = new Mt101DispatchPlanCompiler(new com.fasterxml.jackson.databind.ObjectMapper())
                .compile(sftpConfig, null, null, message);
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "insert into mt101_corrective_pay_fragment "
                             + "(rebuild_run_id, corrective_set_id, corrective_senders_reference, payload_hash, idempotency_key, approved_routed_as, dispatch_destination, dispatch_plan_hash, dispatch_spec_version, dispatch_spec_json, dispatch_spec_hash, pay_status, prepared_at) "
                             + "values (?, ?, ?, ?, ?, null, ?, ?, ?, ?, ?, 'PREPARED', current_timestamp)")) {
            statement.setString(1, runId);
            statement.setString(2, correctiveSetId);
            statement.setString(3, reference);
            statement.setString(4, payloadHash);
            statement.setString(5, "KEY-" + reference);
            statement.setString(6, destination);
            statement.setString(7, planHash);
            statement.setString(8, spec.version());
            statement.setString(9, spec.specJson());
            statement.setString(10, spec.specHash());
            statement.executeUpdate();
        }
    }

    @Test
    void correctivePayMarksFragmentDispatchingBeforeTransportCall() throws Exception {
        var fragmentSetId = "PAY-LEDGER-1";
        insertFragmentSet(fragmentSetId, "F1");
        var fragmentSource = fragmentStore.source(null, fragmentSetId, 1);
        fragmentSource.put("correctivePayRunId", "RUN-PAY-1");
        fragmentStore.markStatus(fragmentSource, "F1", "ARCHIVED", null);
        insertPayLedger("RUN-PAY-1", fragmentSetId, "F1");

        var transport = new StubTransport(List.of(TransportResult.accepted("GW-F1", 1, 10L)));
        var payStore = new Mt101CorrectivePayStore(dataSource, null, new Mt101RebuildRepository());
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport), fragmentStore,
                null, null, payStore);

        var result = provider.execute(contextWith(fragmentSource), payConfig(50));

        assertTrue(result.success(), () -> "expected PAY success: " + result.details());
        assertEquals(1, transport.callsReceived());
        // P0.1 v21: el provider marca DISPATCHING antes del envio y persiste el resultado real
        // por fragmento (SENT) al cerrar la pagina; ya no depende de que el lifecycle lo complete.
        assertEquals("SENT", payLedgerStatus("RUN-PAY-1", "F1"),
                "el provider persiste el resultado durable por fragmento, no solo DISPATCHING");
        assertEquals(1, payLedgerAttempts("RUN-PAY-1", "F1"));
        assertEquals(1L, countRowsWhere("mt101_corrective_pay_fragment",
                "rebuild_run_id = 'RUN-PAY-1' and corrective_senders_reference = 'F1' and dispatched_at is not null"));
    }

    @Test
    void dispatchedPlanIsBitForBitTheApprovedLedgerPlan() throws Exception {
        // v29 #2 (validacion positiva, "plan usado = plan aprobado"): el mensaje y la config que REALMENTE
        // recibe el transporte re-derivan EXACTAMENTE el mismo destino + dispatch_plan_hash + payload_hash que
        // el ledger aprobo. Asi se evidencia que se ejecuta el plan aprobado, sin reconstruccion divergente,
        // sin necesidad de un segundo camino que "lea del ledger" (que persistiria secretos / seria fallback).
        var fragmentSetId = "PAY-DET-1";
        insertFragmentSet(fragmentSetId, "DET1");
        var fragmentSource = fragmentStore.source(null, fragmentSetId, 1);
        fragmentSource.put("correctivePayRunId", "RUN-DET");
        fragmentStore.markStatus(fragmentSource, "DET1", "ARCHIVED", null);
        insertPayLedger("RUN-DET", fragmentSetId, "DET1"); // congela payload_hash + destino + plan_hash aprobados

        var approvedDestination = payLedgerColumn("RUN-DET", "DET1", "dispatch_destination");
        var approvedPlanHash = payLedgerColumn("RUN-DET", "DET1", "dispatch_plan_hash");
        var approvedPayloadHash = payLedgerColumn("RUN-DET", "DET1", "payload_hash");

        var transport = new StubTransport(List.of(TransportResult.accepted("GW-DET1", 1, 10L)));
        var payStore = new Mt101CorrectivePayStore(dataSource, null, new Mt101RebuildRepository());
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport), fragmentStore,
                null, null, payStore);

        var result = provider.execute(contextWith(fragmentSource), payConfig(50));
        assertTrue(result.success(), () -> "expected PAY success: " + result.details());

        // Exactamente un envio del fragmento aprobado (no reenvio).
        assertEquals(1, transport.callsReceived(), "un solo envio del fragmento aprobado");
        var dispatchedMessage = transport.received.get(0);
        assertEquals("DET1", dispatchedMessage.sequenceA().sendersReference());

        // Lo enviado al banco re-deriva al MISMO plan que el ledger aprobo (payload + destino + plan_hash).
        var dispatchedPlan = Mt101PayRouteResolver.resolve(Map.of("transport", "REST"), null, null, dispatchedMessage);
        var dispatchedPayloadHash = sha256Hex(dispatchedMessage.rawPayload());
        assertEquals(approvedPayloadHash, dispatchedPayloadHash, "payload enviado = payload aprobado");
        assertEquals(approvedDestination,
                Mt101PayRouteResolver.dispatchDestination(dispatchedPlan, dispatchedMessage),
                "destino enviado = destino aprobado (credenciales redactadas en el ledger)");
        assertEquals(approvedPlanHash,
                Mt101PayRouteResolver.dispatchPlanHash(dispatchedPlan, dispatchedPayloadHash, null, dispatchedMessage),
                "dispatch_plan_hash enviado = dispatch_plan_hash aprobado (transport|ruta|destino|correlacion|payload)");
        assertEquals("SENT", payLedgerStatus("RUN-DET", "DET1"));
    }

    @Test
    void correctivePayPersistsEveryFragmentResultNotJustTheOutputSample() throws Exception {
        // P0.1 v21: 5 fragmentos, todos INCIERTOS, con la muestra del output acotada a 2.
        // El ledger debe quedar con los 5 como UNCERTAIN (no se pierde ninguno fuera de la muestra).
        var fragmentSetId = "PAY-LEDGER-UNC";
        var refs = List.of("U1", "U2", "U3", "U4", "U5");
        insertFragmentSet(fragmentSetId, refs.toArray(new String[0]));
        var fragmentSource = fragmentStore.source(null, fragmentSetId, refs.size());
        fragmentSource.put("correctivePayRunId", "RUN-UNC");
        for (var ref : refs) {
            fragmentStore.markStatus(fragmentSource, ref, "ARCHIVED", null);
            insertPayLedger("RUN-UNC", fragmentSetId, ref);
        }

        var transport = new StubTransport(List.of(
                TransportResult.uncertain(1, 5L, "timeout: read timed out"),
                TransportResult.uncertain(1, 5L, "timeout: read timed out"),
                TransportResult.uncertain(1, 5L, "timeout: read timed out"),
                TransportResult.uncertain(1, 5L, "timeout: read timed out"),
                TransportResult.uncertain(1, 5L, "timeout: read timed out")));
        var payStore = new Mt101CorrectivePayStore(dataSource, null, new Mt101RebuildRepository());
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport), fragmentStore,
                null, null, payStore);

        var config = new java.util.LinkedHashMap<String, Object>(payConfig(50));
        config.put("maxRecordsInOutput", 2);
        var result = provider.execute(contextWith(fragmentSource), config);

        assertFalse(result.success(), "PAY con inciertos no es exito");
        assertEquals(5, result.outputs().get("uncertainCount"), "el conteo es exacto (5)");
        assertEquals(2, ((List<?>) result.outputs().get("uncertain")).size(),
                "la muestra del output sigue acotada (maxRecordsInOutput=2)");
        assertEquals(5L, countRowsWhere("mt101_corrective_pay_fragment",
                "rebuild_run_id = 'RUN-UNC' and pay_status = 'UNCERTAIN'"),
                "el ledger persiste los 5 resultados, no la muestra: ningun fragmento se pierde (P0.1)");
    }

    @Test
    void routedPayUsesPersistedRouteToChooseTransportAndEndpoint() throws Exception {
        var fragmentSetId = "PAY-ROUTED-1";
        insertFragmentSet(fragmentSetId, "R1", "R2");
        var fragmentSource = fragmentStore.source(null, fragmentSetId, 2);
        fragmentStore.markStatus(fragmentSource, "R1", "ARCHIVED", null);
        fragmentStore.markStatus(fragmentSource, "R2", "ARCHIVED", null);
        fragmentStore.markRouteBatch(fragmentSource,
                Map.of("R1", "REST_MAIN", "R2", "SFTP_SECONDARY"),
                Map.of());

        var rest = new StubTransport("REST", List.of(TransportResult.accepted("GW-R1", 1, 10L)));
        var sftp = new StubTransport("SFTP", List.of(TransportResult.accepted("GW-R2", 1, 10L)));
        var provider = new Mt101PayTaskProvider(new InstanceOfList<>(List.of(rest, sftp)), fragmentStore);

        var config = new LinkedHashMap<String, Object>(payConfig(50));
        config.remove("transport");
        config.put("routeTransports", Map.of(
                "REST_MAIN", Map.of(
                        "transport", "REST",
                        "idempotencyKeyTemplate", "rest-${sendersReference}"),
                "SFTP_SECONDARY", Map.of(
                        "transport", "SFTP",
                        "sftp", Map.of("dropPathTemplate", "/swift/${sendersReference}.fin"))));

        var result = provider.execute(contextWith(fragmentSource), config);

        assertTrue(result.success(), () -> "expected routed PAY success: " + result.details());
        assertEquals("ROUTED", result.outputs().get("transport"));
        assertEquals(List.of("R1"), rest.receivedReferences());
        assertEquals(List.of("R2"), sftp.receivedReferences());
        assertEquals("rest-R1", rest.receivedConfigurations().get(0).get("idempotencyKeyTemplate"));
        @SuppressWarnings("unchecked")
        var sftpConfig = (Map<String, Object>) sftp.receivedConfigurations().get(0).get("sftp");
        assertEquals("/swift/R2.fin", sftpConfig.get("dropPathTemplate"));
    }

    @Test
    void correctivePayNeverCallsTransportWithoutPreparedIntent() throws Exception {
        // P0.2 v22: un fragmento sin intencion PREPARED en el ledger NO debe enviarse.
        var fragmentSetId = "PAY-NO-INTENT";
        insertFragmentSet(fragmentSetId, "N1");
        var fragmentSource = fragmentStore.source(null, fragmentSetId, 1);
        fragmentSource.put("correctivePayRunId", "RUN-NO-INTENT");
        fragmentStore.markStatus(fragmentSource, "N1", "ARCHIVED", null);
        // (a proposito) NO se inserta el ledger: no hay intencion PREPARED para N1.

        var transport = new StubTransport(List.of(TransportResult.accepted("GW-N1", 1, 1L)));
        var payStore = new Mt101CorrectivePayStore(dataSource, null, new Mt101RebuildRepository());
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport), fragmentStore,
                null, null, payStore);

        provider.execute(contextWith(fragmentSource), payConfig(50));

        assertEquals(0, transport.callsReceived(),
                "sin intencion PREPARED no se llama al transporte (ninguna llamada externa sin intencion)");
    }

    @Test
    void correctivePayDoesNotResendAlreadyDispatchedFragment() throws Exception {
        // P0.2 v22: un fragmento ya DISPATCHING (envio previo / crash) NO se reenvia; se resuelve por STATUS.
        var fragmentSetId = "PAY-ALREADY";
        insertFragmentSet(fragmentSetId, "T1");
        var fragmentSource = fragmentStore.source(null, fragmentSetId, 1);
        fragmentSource.put("correctivePayRunId", "RUN-ALREADY");
        fragmentStore.markStatus(fragmentSource, "T1", "ARCHIVED", null);
        insertPayLedger("RUN-ALREADY", fragmentSetId, "T1");
        // un dispatch previo dejo la intencion en DISPATCHING (ya no es PREPARED).
        var t1Message = sampleMessage("T1");
        var t1Plan = Mt101PayRouteResolver.resolve(Map.of("transport", "REST"), null, null, t1Message);
        var t1PlanHash = Mt101PayRouteResolver.dispatchPlanHash(t1Plan,
                sha256Hex("{\"sendersReference\":\"T1\"}"), null, t1Message);
        assertEquals(1, new Mt101RebuildRepository().markPayFragmentDispatching(dataSource, "RUN-ALREADY", "T1",
                sha256Hex("{\"sendersReference\":\"T1\"}"), null, t1PlanHash));

        var transport = new StubTransport(List.of(TransportResult.accepted("GW-T1", 1, 1L)));
        var payStore = new Mt101CorrectivePayStore(dataSource, null, new Mt101RebuildRepository());
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport), fragmentStore,
                null, null, payStore);

        provider.execute(contextWith(fragmentSource), payConfig(50));

        assertEquals(0, transport.callsReceived(),
                "un fragmento ya DISPATCHING no se reenvia a ciegas (se resuelve por STATUS)");
        assertEquals("DISPATCHING", payLedgerStatus("RUN-ALREADY", "T1"), "permanece DISPATCHING para conciliar");
    }

    @Test
    void schedulerAndDispatcherNeverLeaveRunNotExecutingWithDispatchingFragment() throws Exception {
        // P0.1 v28: prueba de CONCURRENCIA real (2 hilos, Postgres real). El scheduler (lease vencido) y el
        // dispatcher (claim) corren SIMULTANEAMENTE sobre el mismo run, N veces. El advisory lock + el check
        // de run/lease en el claim garantizan el INVARIANTE: nunca queda un fragmento DISPATCHING con el run
        // fuera de EXECUTING (no hay carrera que deje run invalidado con un pago despachado).
        var repository = new Mt101RebuildRepository();
        for (int iteration = 0; iteration < 25; iteration++) {
            var runId = "RUN-RACE-" + iteration;
            var fragmentSetId = "PAY-RACE-" + iteration;
            insertFragmentSet(fragmentSetId, "T1");
            var fragmentSource = fragmentStore.source(null, fragmentSetId, 1);
            fragmentSource.put("correctivePayRunId", runId);
            fragmentStore.markStatus(fragmentSource, "T1", "ARCHIVED", null);
            insertPayLedger(runId, fragmentSetId, "T1"); // run EXECUTING + lease futuro + ledger PREPARED
            // El lease del run ya vencio (el escenario de carrera del v27/v28).
            try (Connection connection = dataSource.getConnection();
                 var statement = connection.createStatement()) {
                statement.executeUpdate("update mt101_rebuild_run set pay_lease_until = current_timestamp - "
                        + "interval '1 minute' where rebuild_run_id = '" + runId + "'");
            }
            var message = sampleMessage("T1");
            var plan = Mt101PayRouteResolver.resolve(Map.of("transport", "REST"), null, null, message);
            var planHash = Mt101PayRouteResolver.dispatchPlanHash(plan,
                    sha256Hex("{\"sendersReference\":\"T1\"}"), null, message);

            var start = new CountDownLatch(1);
            var claimResult = new AtomicReference<Integer>();
            var error = new AtomicReference<Throwable>();
            var scheduler = new Thread(() -> {
                try {
                    start.await();
                    repository.markExpiredPayExecutionsUncertain(dataSource, java.time.LocalDateTime.now());
                } catch (Throwable t) {
                    error.set(t);
                }
            });
            var dispatcher = new Thread(() -> {
                try {
                    start.await();
                    claimResult.set(repository.markPayFragmentDispatching(dataSource, runId, "T1",
                            sha256Hex("{\"sendersReference\":\"T1\"}"), null, planHash));
                } catch (Throwable t) {
                    error.set(t);
                }
            });
            scheduler.start();
            dispatcher.start();
            start.countDown();
            scheduler.join();
            dispatcher.join();

            assertEquals(null, error.get(), () -> "sin excepciones en la carrera: " + error.get());
            // INVARIANTE: con el lease vencido el dispatcher NUNCA reclama (claim devuelve 0); el fragmento
            // jamas queda DISPATCHING; el run queda INVALIDATED (el scheduler), nunca EXECUTING+DISPATCHING.
            assertEquals(0, claimResult.get(), "lease vencido: el dispatcher no puede reclamar");
            assertNotEquals("DISPATCHING", payLedgerStatus(runId, "T1"),
                    "nunca un fragmento DISPATCHING tras vencer el lease");
            assertEquals("INVALIDATED", runPayStatus(runId), "el scheduler resolvio el run (sin despacho)");
        }
    }

    @Test
    void physicalLateAcceptanceWithBlockedSendAndConcurrentSchedulerResolvesRunToSent() throws Exception {
        // v30 #2: prueba FISICA del escenario (no simulada en un fake). El provider REAL reclama el fragmento
        // y entra a transport.send() que se BLOQUEA en un hilo; en otra conexion vence el lease y corre el
        // scheduler (run+fragmento UNCERTAIN); luego send() devuelve ACCEPTED -> fragmento SENT; la resolucion
        // tardia deja el run SENT. Verifica: un solo envio fisico, fragmento SENT, run SENT (nunca INVALIDATED),
        // auditoria append-only PAY_UNCERTAIN (scheduler) + PAY_RESOLVED (resolucion tardia).
        var runId = "RUN-PHYS-LATE";
        var fragmentSetId = "PAY-PHYS-LATE";
        insertFragmentSet(fragmentSetId, "P1");
        var fragmentSource = fragmentStore.source(null, fragmentSetId, 1);
        fragmentSource.put("correctivePayRunId", runId);
        fragmentStore.markStatus(fragmentSource, "P1", "ARCHIVED", null);
        insertPayLedger(runId, fragmentSetId, "P1"); // run EXECUTING + lease futuro + ledger PREPARED

        var dispatchReached = new CountDownLatch(1);
        var releaseSend = new CountDownLatch(1);
        var transport = new BlockingTransport(dispatchReached, releaseSend,
                TransportResult.accepted("GW-P1", 1, 10L));
        var payStore = new Mt101CorrectivePayStore(dataSource, null, new Mt101RebuildRepository());
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport), fragmentStore, null, null, payStore);
        var repository = new Mt101RebuildRepository();

        var workerError = new AtomicReference<Throwable>();
        var worker = new Thread(() -> {
            try {
                provider.execute(contextWith(fragmentSource), payConfig(50));
            } catch (Throwable t) {
                workerError.set(t);
            }
        });
        worker.start();

        // El worker reclamo el fragmento (PREPARED->DISPATCHING, commiteado) y esta BLOQUEADO dentro de send().
        assertTrue(dispatchReached.await(10, java.util.concurrent.TimeUnit.SECONDS),
                "el worker debe alcanzar transport.send()");
        assertEquals("DISPATCHING", payLedgerStatus(runId, "P1"), "el fragmento se reclamo antes del envio");

        // Vence el lease y corre el scheduler (otra conexion) MIENTRAS send() sigue bloqueado.
        try (Connection connection = dataSource.getConnection(); var statement = connection.createStatement()) {
            statement.executeUpdate("update mt101_rebuild_run set pay_lease_until = current_timestamp - "
                    + "interval '1 minute' where rebuild_run_id = '" + runId + "'");
        }
        repository.markExpiredPayExecutionsUncertain(dataSource, java.time.LocalDateTime.now());
        assertEquals("UNCERTAIN", runPayStatus(runId), "el scheduler marca el run UNCERTAIN (hubo dispatch)");
        assertEquals("UNCERTAIN", payLedgerStatus(runId, "P1"), "el fragmento DISPATCHING pasa a UNCERTAIN");

        // El banco responde ACCEPTED tardiamente -> el worker completa el fragmento a SENT.
        releaseSend.countDown();
        worker.join(10_000);
        assertFalse(worker.isAlive(), "el worker termina tras liberar send()");
        assertEquals(null, workerError.get(), () -> "worker sin errores: " + workerError.get());
        assertEquals(1, transport.callsReceived(), "un solo envio fisico al banco (sin reenvio)");
        assertEquals("SENT", payLedgerStatus(runId, "P1"), "aceptacion tardia: el fragmento queda SENT");

        // Resolucion tardia (como la invoca el servicio): run UNCERTAIN + todos SENT -> SENT, append-only.
        assertEquals(1, repository.resolveLateAcceptedPayRun(dataSource, runId, "operator"),
                "se resuelve el run tardiamente");
        assertEquals("SENT", runPayStatus(runId), "el run se resuelve a SENT, nunca INVALIDATED");
        assertEquals(1L, countRowsWhere("mt101_corrective_pay_action",
                "rebuild_run_id = '" + runId + "' and action_type = 'PAY_UNCERTAIN'"),
                "queda la accion del scheduler");
        assertEquals(1L, countRowsWhere("mt101_corrective_pay_action",
                "rebuild_run_id = '" + runId + "' and action_type = 'PAY_RESOLVED'"),
                "queda la accion de resolucion tardia");
        assertEquals(0L, countRowsWhere("mt101_rebuild_run",
                "rebuild_run_id = '" + runId + "' and pay_status = 'INVALIDATED'"),
                "el run nunca queda INVALIDATED tras un dispatch aceptado");
    }

    @Test
    void lateAcceptedSentDoesNotOverwriteStatusRejectedFragmentAndRecordsConflict() throws Exception {
        // v33: carrera aceptacion-tardia <-> resolucion STATUS terminal. STATUS ya resolvio el fragmento a
        // REJECTED (run FAILED); luego llega un ACCEPTED tardio (SENT). NO debe sobrescribirse en silencio:
        // el fragmento conserva REJECTED, el run pasa a UNCERTAIN y se registra PAY_CONFLICT append-only.
        var runId = "RUN-CONFLICT";
        var fragmentSetId = "PAY-CONFLICT";
        insertFragmentSet(fragmentSetId, "C1");
        var fragmentSource = fragmentStore.source(null, fragmentSetId, 1);
        fragmentSource.put("correctivePayRunId", runId);
        fragmentStore.markStatus(fragmentSource, "C1", "ARCHIVED", null);
        insertPayLedger(runId, fragmentSetId, "C1");
        // Estado post-STATUS: fragmento REJECTED, run FAILED (resolucion terminal contradictoria).
        try (Connection connection = dataSource.getConnection(); var statement = connection.createStatement()) {
            statement.executeUpdate("update mt101_corrective_pay_fragment set pay_status = 'REJECTED' "
                    + "where rebuild_run_id = '" + runId + "'");
            statement.executeUpdate("update mt101_rebuild_run set pay_status = 'FAILED', pay_lease_until = null "
                    + "where rebuild_run_id = '" + runId + "'");
        }

        var repository = new Mt101RebuildRepository();
        var lateSent = List.of(new Mt101RebuildRepository.PayFragmentResult("C1", "SENT", "GW-LATE", 1, null));
        var updated = repository.updatePayFragmentResults(dataSource, runId, lateSent).updated();

        assertEquals(0, updated, "el ACCEPTED tardio NO sobrescribe un terminal");
        assertEquals("REJECTED", payLedgerStatus(runId, "C1"), "el fragmento conserva la resolucion STATUS");
        assertEquals("UNCERTAIN", runPayStatus(runId), "el run pasa a UNCERTAIN (conflicto, no FAILED silencioso)");
        assertEquals(1L, countRowsWhere("mt101_corrective_pay_action",
                "rebuild_run_id = '" + runId + "' and action_type = 'PAY_CONFLICT'"),
                "se registra PAY_CONFLICT append-only");
    }

    @Test
    void physicalStatusRejectionDuringBlockedSendMakesLateAcceptedRaiseConflictNotOverwrite() throws Exception {
        // v33 (variante CONCURRENTE del conflicto, la que pedia el analisis): el worker reclama el fragmento y
        // se BLOQUEA dentro de transport.send(); en otra conexion vence el lease + scheduler (UNCERTAIN) y luego
        // una resolucion STATUS terminal deja el fragmento REJECTED + run FAILED. Al liberar send(), el ACCEPTED
        // tardio NO sobrescribe en silencio: PAY_CONFLICT append-only + run UNCERTAIN. Un solo envio fisico.
        var runId = "RUN-PHYS-CONFLICT";
        var fragmentSetId = "PAY-PHYS-CONFLICT";
        insertFragmentSet(fragmentSetId, "X1");
        var fragmentSource = fragmentStore.source(null, fragmentSetId, 1);
        fragmentSource.put("correctivePayRunId", runId);
        fragmentStore.markStatus(fragmentSource, "X1", "ARCHIVED", null);
        insertPayLedger(runId, fragmentSetId, "X1");

        var dispatchReached = new CountDownLatch(1);
        var releaseSend = new CountDownLatch(1);
        var transport = new BlockingTransport(dispatchReached, releaseSend,
                TransportResult.accepted("GW-X1", 1, 10L));
        var payStore = new Mt101CorrectivePayStore(dataSource, null, new Mt101RebuildRepository());
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport), fragmentStore, null, null, payStore);
        var repository = new Mt101RebuildRepository();

        var workerError = new AtomicReference<Throwable>();
        var worker = new Thread(() -> {
            try {
                provider.execute(contextWith(fragmentSource), payConfig(50));
            } catch (Throwable t) {
                workerError.set(t);
            }
        });
        worker.start();

        // El worker reclamo el fragmento (DISPATCHING) y esta bloqueado dentro de send().
        assertTrue(dispatchReached.await(10, java.util.concurrent.TimeUnit.SECONDS),
                "el worker debe alcanzar transport.send()");
        assertEquals("DISPATCHING", payLedgerStatus(runId, "X1"));

        // Vence el lease + scheduler (UNCERTAIN) y luego una resolucion STATUS terminal: REJECTED + run FAILED.
        try (Connection connection = dataSource.getConnection(); var statement = connection.createStatement()) {
            statement.executeUpdate("update mt101_rebuild_run set pay_lease_until = current_timestamp - "
                    + "interval '1 minute' where rebuild_run_id = '" + runId + "'");
        }
        repository.markExpiredPayExecutionsUncertain(dataSource, java.time.LocalDateTime.now());
        assertEquals("UNCERTAIN", runPayStatus(runId), "el scheduler marca el run UNCERTAIN");
        try (Connection connection = dataSource.getConnection(); var statement = connection.createStatement()) {
            statement.executeUpdate("update mt101_corrective_pay_fragment set pay_status = 'REJECTED' "
                    + "where rebuild_run_id = '" + runId + "'");
            statement.executeUpdate("update mt101_rebuild_run set pay_status = 'FAILED', pay_lease_until = null "
                    + "where rebuild_run_id = '" + runId + "'");
        }

        // El banco responde ACCEPTED tardiamente -> el worker intenta persistir SENT.
        releaseSend.countDown();
        worker.join(10_000);
        assertFalse(worker.isAlive(), "el worker termina tras liberar send()");
        assertEquals(null, workerError.get(), () -> "worker sin errores: " + workerError.get());

        // El ACCEPTED tardio NO sobrescribe la resolucion terminal contradictoria.
        assertEquals(1, transport.callsReceived(), "un solo envio fisico al banco");
        assertEquals("REJECTED", payLedgerStatus(runId, "X1"), "el fragmento conserva la resolucion STATUS");
        assertEquals("UNCERTAIN", runPayStatus(runId), "run UNCERTAIN (conflicto), nunca FAILED ni SENT silencioso");
        assertEquals(1L, countRowsWhere("mt101_corrective_pay_action",
                "rebuild_run_id = '" + runId + "' and action_type = 'PAY_CONFLICT'"),
                "se registra PAY_CONFLICT append-only");
        // v34 (hallazgo 2): coherencia entre fuentes de verdad: si el ledger no acepto SENT, el provider
        // tampoco propaga SENT a mt101_build_fragment (no queda ledger=REJECTED y build=SENT).
        assertNotEquals("SENT", fragmentColumn(fragmentSetId, "X1", "status"),
                "build_fragment no se marca SENT cuando el ledger quedo en conflicto");
    }

    @Test
    void statusRejectedAfterFragmentAlreadySentRaisesConflictNotSilentIgnore() throws Exception {
        // v34 (hallazgo 1, SIMETRIA): orden inverso. Una aceptacion tardia dejo el fragmento SENT; luego
        // MT101_STATUS responde REJECTED. No debe ignorarse en silencio (0 filas y seguir): PAY_CONFLICT +
        // run UNCERTAIN, sin sobrescribir el SENT existente.
        var runId = "RUN-STATUS-CONFLICT";
        var fragmentSetId = "PAY-STATUS-CONFLICT";
        insertFragmentSet(fragmentSetId, "S1");
        var fragmentSource = fragmentStore.source(null, fragmentSetId, 1);
        fragmentSource.put("correctivePayRunId", runId);
        fragmentStore.markStatus(fragmentSource, "S1", "ARCHIVED", null);
        insertPayLedger(runId, fragmentSetId, "S1");
        try (Connection connection = dataSource.getConnection(); var statement = connection.createStatement()) {
            statement.executeUpdate("update mt101_corrective_pay_fragment set pay_status = 'SENT' "
                    + "where rebuild_run_id = '" + runId + "'");
            statement.executeUpdate("update mt101_rebuild_run set pay_status = 'SENT', pay_lease_until = null "
                    + "where rebuild_run_id = '" + runId + "'");
        }

        var repository = new Mt101RebuildRepository();
        var statusRejected = List.of(
                new Mt101RebuildRepository.PayFragmentResult("S1", "REJECTED", null, 0, "bank rejected after sent"));
        var resolveResult = repository.resolvePayFragmentResults(dataSource, runId, statusRejected, "STATUS_API");

        assertEquals(0, resolveResult.updated(), "STATUS no sobrescribe un terminal SENT");
        assertTrue(resolveResult.conflictReferences().contains("S1"),
                "el conflicto STATUS se reporta para excluir el archive contradictorio");
        assertEquals("SENT", payLedgerStatus(runId, "S1"), "el fragmento conserva SENT (ni ignorado ni sobrescrito)");
        assertEquals("UNCERTAIN", runPayStatus(runId), "el run pasa a UNCERTAIN por conflicto STATUS<->ledger");
        assertEquals(1L, countRowsWhere("mt101_corrective_pay_action",
                "rebuild_run_id = '" + runId + "' and action_type = 'PAY_CONFLICT'"),
                "STATUS contradictorio registra PAY_CONFLICT (no silencioso)");
        // v35 (hallazgo 1): marca durable por fragmento, para que API/UI no malinterpreten SENT vs REJECTED.
        assertEquals("t", payLedgerColumn(runId, "S1", "pay_conflict"), "el fragmento queda pay_conflict=true");
    }

    @Test
    void resolveLateAcceptedPayRunDoesNotAutoCloseWhenAnyFragmentInConflict() throws Exception {
        // v36: un PAY_CONFLICT NO debe auto-cerrarse. Aunque todos los fragmentos esten SENT, si alguno tiene
        // pay_conflict=true (p.ej. STATUS REJECTED contra un SENT), resolveLateAcceptedPayRun NO resuelve el
        // run a SENT: exige conciliacion manual.
        var runId = "RUN-CONF-NOAUTOCLOSE";
        var fragmentSetId = "PAY-CONF-NOAUTOCLOSE";
        insertFragmentSet(fragmentSetId, "K1");
        var fragmentSource = fragmentStore.source(null, fragmentSetId, 1);
        fragmentSource.put("correctivePayRunId", runId);
        fragmentStore.markStatus(fragmentSource, "K1", "ARCHIVED", null);
        insertPayLedger(runId, fragmentSetId, "K1");
        // Estado tras un conflicto: run UNCERTAIN, fragmento SENT pero pay_conflict=true.
        try (Connection connection = dataSource.getConnection(); var statement = connection.createStatement()) {
            statement.executeUpdate("update mt101_corrective_pay_fragment set pay_status = 'SENT', "
                    + "pay_conflict = true, pay_conflict_reason = 'STATUS rejected after sent' "
                    + "where rebuild_run_id = '" + runId + "'");
            statement.executeUpdate("update mt101_rebuild_run set pay_status = 'UNCERTAIN', pay_lease_until = null "
                    + "where rebuild_run_id = '" + runId + "'");
        }

        var repository = new Mt101RebuildRepository();
        assertEquals(0, repository.resolveLateAcceptedPayRun(dataSource, runId, "scheduler"),
                "no se auto-resuelve un run con un fragmento en conflicto");
        assertEquals("UNCERTAIN", runPayStatus(runId), "el run se mantiene UNCERTAIN para conciliacion manual");
        assertEquals(0L, countRowsWhere("mt101_corrective_pay_action",
                "rebuild_run_id = '" + runId + "' and action_type = 'PAY_RESOLVED'"),
                "no se registra PAY_RESOLVED mientras haya conflicto");
    }

    @Test
    void rejectedResultIsDroppedWhenFragmentWasNeverClaimedNoTerminalWithoutDispatch() throws Exception {
        // v35 (hallazgo 2): tambien REJECTED es terminal de transporte y exige claim previo. Un fragmento
        // PREPARED (jamas reclamado) que reciba un REJECTED NO se marca REJECTED (0 filas) y no es conflicto.
        var runId = "RUN-REJ-NOCLAIM";
        var fragmentSetId = "PAY-REJ-NOCLAIM";
        insertFragmentSet(fragmentSetId, "R1");
        var fragmentSource = fragmentStore.source(null, fragmentSetId, 1);
        fragmentSource.put("correctivePayRunId", runId);
        fragmentStore.markStatus(fragmentSource, "R1", "ARCHIVED", null);
        insertPayLedger(runId, fragmentSetId, "R1"); // PREPARED, nunca DISPATCHING

        var repository = new Mt101RebuildRepository();
        var rejected = List.of(new Mt101RebuildRepository.PayFragmentResult("R1", "REJECTED", null, 0, "bank rejected"));
        var result = repository.updatePayFragmentResults(dataSource, runId, rejected);
        assertEquals(0, result.updated(), "un REJECTED sin claim previo no se registra");
        assertTrue(result.conflictReferences().isEmpty(), "PREPARED no es conflicto terminal");
        assertEquals("PREPARED", payLedgerStatus(runId, "R1"), "el fragmento sigue PREPARED");
    }

    @Test
    void lateRejectedAgainstSentFragmentIsReportedAsConflictForBuildArchiveExclusion() throws Exception {
        // v35 (hallazgos 1 y 2, simetria inversa): el ledger ya quedo SENT y llega un REJECTED tardio del
        // gateway. No se sobrescribe (sigue SENT), se reporta como conflicto (para que el provider lo excluya
        // de build/archive) y queda pay_conflict=true + PAY_CONFLICT.
        var runId = "RUN-LATE-REJ";
        var fragmentSetId = "PAY-LATE-REJ";
        insertFragmentSet(fragmentSetId, "L1");
        var fragmentSource = fragmentStore.source(null, fragmentSetId, 1);
        fragmentSource.put("correctivePayRunId", runId);
        fragmentStore.markStatus(fragmentSource, "L1", "ARCHIVED", null);
        insertPayLedger(runId, fragmentSetId, "L1");
        try (Connection connection = dataSource.getConnection(); var statement = connection.createStatement()) {
            statement.executeUpdate("update mt101_corrective_pay_fragment set pay_status = 'SENT' "
                    + "where rebuild_run_id = '" + runId + "'");
        }
        var repository = new Mt101RebuildRepository();
        var lateRejected = List.of(new Mt101RebuildRepository.PayFragmentResult("L1", "REJECTED", null, 1, "late reject"));
        var result = repository.updatePayFragmentResults(dataSource, runId, lateRejected);

        assertEquals(0, result.updated(), "el REJECTED tardio no sobrescribe el SENT");
        assertTrue(result.conflictReferences().contains("L1"), "se reporta el conflicto para excluir build/archive");
        assertEquals("SENT", payLedgerStatus(runId, "L1"), "el fragmento conserva SENT");
        assertEquals("UNCERTAIN", runPayStatus(runId), "run UNCERTAIN por conflicto");
        assertEquals("t", payLedgerColumn(runId, "L1", "pay_conflict"), "fragmento pay_conflict=true");
    }

    @Test
    void sentResultIsDroppedWhenFragmentWasNeverClaimedNoSentWithoutDispatch() throws Exception {
        // v34 (hallazgo 3): un SENT no puede registrarse sin claim previo. Un fragmento PREPARED (jamas
        // reclamado) que reciba un SENT por un bug interno NO se marca SENT (0 filas) y no es conflicto.
        var runId = "RUN-NOCLAIM";
        var fragmentSetId = "PAY-NOCLAIM";
        insertFragmentSet(fragmentSetId, "N1");
        var fragmentSource = fragmentStore.source(null, fragmentSetId, 1);
        fragmentSource.put("correctivePayRunId", runId);
        fragmentStore.markStatus(fragmentSource, "N1", "ARCHIVED", null);
        insertPayLedger(runId, fragmentSetId, "N1"); // fragmento PREPARED, nunca DISPATCHING

        var repository = new Mt101RebuildRepository();
        var sent = List.of(new Mt101RebuildRepository.PayFragmentResult("N1", "SENT", "GW-X", 1, null));
        assertEquals(0, repository.updatePayFragmentResults(dataSource, runId, sent).updated(),
                "un SENT sin claim previo no se registra");
        assertEquals("PREPARED", payLedgerStatus(runId, "N1"), "el fragmento sigue PREPARED");
        assertEquals(0L, countRowsWhere("mt101_corrective_pay_action",
                "rebuild_run_id = '" + runId + "' and action_type = 'PAY_CONFLICT'"),
                "un PREPARED no reclamado no es conflicto terminal");
    }

    @Test
    void lateResultNeverOverwritesAlreadySentFragmentWithoutFalseConflict() throws Exception {
        // v33: un resultado SENT repetido sobre un fragmento ya SENT es no-op idempotente, sin PAY_CONFLICT
        // (no es una contradiccion: el banco acepto y el fragmento ya estaba SENT).
        var runId = "RUN-IDEMP";
        var fragmentSetId = "PAY-IDEMP";
        insertFragmentSet(fragmentSetId, "I1");
        var fragmentSource = fragmentStore.source(null, fragmentSetId, 1);
        fragmentSource.put("correctivePayRunId", runId);
        fragmentStore.markStatus(fragmentSource, "I1", "ARCHIVED", null);
        insertPayLedger(runId, fragmentSetId, "I1");
        try (Connection connection = dataSource.getConnection(); var statement = connection.createStatement()) {
            statement.executeUpdate("update mt101_corrective_pay_fragment set pay_status = 'SENT' "
                    + "where rebuild_run_id = '" + runId + "'");
        }
        var repository = new Mt101RebuildRepository();
        var lateSent = List.of(new Mt101RebuildRepository.PayFragmentResult("I1", "SENT", "GW-1", 1, null));
        assertEquals(0, repository.updatePayFragmentResults(dataSource, runId, lateSent).updated(),
                "no se re-escribe un fragmento ya SENT");
        assertEquals("SENT", payLedgerStatus(runId, "I1"));
        assertEquals(0L, countRowsWhere("mt101_corrective_pay_action",
                "rebuild_run_id = '" + runId + "' and action_type = 'PAY_CONFLICT'"),
                "SENT sobre SENT no es conflicto");
    }

    private String runPayStatus(String runId) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "select pay_status from mt101_rebuild_run where rebuild_run_id = ?")) {
            statement.setString(1, runId);
            try (var rs = statement.executeQuery()) {
                rs.next();
                return rs.getString(1);
            }
        }
    }

    @Test
    void correctivePayDoesNotDispatchWhenRunLeaseExpiredOrRunNotExecuting() throws Exception {
        // P0.1 v27: el claim une el run padre. Si el lease vencio (el scheduler lo resolvera) o el run ya
        // no esta EXECUTING (el scheduler lo invalido), el fragmento NO se despacha: no hay carrera
        // scheduler<->dispatcher que deje run invalidado con fragmento SENT.
        var fragmentSetId = "PAY-LEASE";
        insertFragmentSet(fragmentSetId, "T1");
        var fragmentSource = fragmentStore.source(null, fragmentSetId, 1);
        fragmentSource.put("correctivePayRunId", "RUN-LEASE");
        fragmentStore.markStatus(fragmentSource, "T1", "ARCHIVED", null);
        insertPayLedger("RUN-LEASE", fragmentSetId, "T1");
        // El lease del run ya vencio.
        try (Connection connection = dataSource.getConnection();
             var statement = connection.createStatement()) {
            statement.executeUpdate("update mt101_rebuild_run set pay_lease_until = current_timestamp - interval "
                    + "'1 minute' where rebuild_run_id = 'RUN-LEASE'");
        }

        var transport = new StubTransport(List.of(TransportResult.accepted("GW-T1", 1, 1L)));
        var payStore = new Mt101CorrectivePayStore(dataSource, null, new Mt101RebuildRepository());
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport), fragmentStore,
                null, null, payStore);

        provider.execute(contextWith(fragmentSource), payConfig(50));

        assertEquals(0, transport.callsReceived(), "lease vencido -> el fragmento NO se despacha");
        assertEquals("PREPARED", payLedgerStatus("RUN-LEASE", "T1"),
                "el fragmento queda PREPARED (lo clasifica el scheduler), nunca DISPATCHING tras vencer el lease");
    }

    @Test
    void correctivePayInvalidatesFragmentWhenDispatchPlanChangedEvenIfPayloadAndRouteMatch() throws Exception {
        // P0 #1 v26: el claim valida el PLAN COMPLETO (dispatch_plan_hash = transport|ruta|destino|
        // correlacion|payload). Aunque payload_hash y routed_as coincidan, si el plan aprobado difiere
        // (otro transport/destino/correlacion), el fragmento se INVALIDA y NO se envia.
        var fragmentSetId = "PAY-PLAN-DRIFT";
        insertFragmentSet(fragmentSetId, "T1");
        var fragmentSource = fragmentStore.source(null, fragmentSetId, 1);
        fragmentSource.put("correctivePayRunId", "RUN-PLAN-DRIFT");
        fragmentStore.markStatus(fragmentSource, "T1", "ARCHIVED", null);
        // payload_hash correcto, pero dispatch_plan_hash NO coincide con el que el provider recomputa.
        insertPayLedgerWithPlanHash("RUN-PLAN-DRIFT", fragmentSetId, "T1",
                sha256Hex("{\"sendersReference\":\"T1\"}"), "deadbeef".repeat(8));

        var transport = new StubTransport(List.of(TransportResult.accepted("GW-T1", 1, 1L)));
        var payStore = new Mt101CorrectivePayStore(dataSource, null, new Mt101RebuildRepository());
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport), fragmentStore,
                null, null, payStore);

        provider.execute(contextWith(fragmentSource), payConfig(50));

        assertEquals(0, transport.callsReceived(), "un plan distinto al aprobado NO se envia");
        assertEquals("INVALIDATED", payLedgerStatus("RUN-PLAN-DRIFT", "T1"),
                "plan distinto (mismo payload/ruta) = INVALIDATED, no enviado");
    }

    @Test
    void unexpectedTransportExceptionIsUncertainNotRejected() throws Exception {
        // P0 v26: una excepcion INESPERADA del transporte (no de config) durante el envio se clasifica
        // INCIERTO, nunca REJECTED reusable: no se puede demostrar que el mensaje no salio al banco.
        var fragmentSetId = "PAY-THROW";
        insertFragmentSet(fragmentSetId, "T1");
        var fragmentSource = fragmentStore.source(null, fragmentSetId, 1);
        fragmentSource.put("correctivePayRunId", "RUN-THROW");
        fragmentStore.markStatus(fragmentSource, "T1", "ARCHIVED", null);
        insertPayLedger("RUN-THROW", fragmentSetId, "T1");

        var throwing = new PaymentMessageTransport() {
            @Override
            public String transport() {
                return "REST";
            }

            @Override
            public TransportResult send(Mt101Message message, Map<String, Object> configuration) {
                throw new RuntimeException("boom after the remote call started");
            }
        };
        var payStore = new Mt101CorrectivePayStore(dataSource, null, new Mt101RebuildRepository());
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(throwing), fragmentStore,
                null, null, payStore);

        provider.execute(contextWith(fragmentSource), payConfig(50));

        assertEquals("UNCERTAIN", payLedgerStatus("RUN-THROW", "T1"),
                "excepcion inesperada del transporte = UNCERTAIN, no REJECTED reusable");
    }

    @Test
    void correctivePayInvalidatesFragmentWhenPayloadChangedAfterApproval() throws Exception {
        // P0.2 v24: si el payload del fragmento cambia tras preparar la intencion (el payload_hash actual
        // ya no coincide con el aprobado en el ledger), el fragmento se INVALIDA y NO se envia.
        var fragmentSetId = "PAY-DRIFT";
        insertFragmentSet(fragmentSetId, "T1");
        var fragmentSource = fragmentStore.source(null, fragmentSetId, 1);
        fragmentSource.put("correctivePayRunId", "RUN-DRIFT");
        fragmentStore.markStatus(fragmentSource, "T1", "ARCHIVED", null);
        // El plan aprobado tenia OTRO payload_hash; el fragmento actual difiere (drift de payload).
        insertPayLedger("RUN-DRIFT", fragmentSetId, "T1", sha256Hex("{\"sendersReference\":\"TAMPERED\"}"));

        var transport = new StubTransport(List.of(TransportResult.accepted("GW-T1", 1, 1L)));
        var payStore = new Mt101CorrectivePayStore(dataSource, null, new Mt101RebuildRepository());
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport), fragmentStore,
                null, null, payStore);

        provider.execute(contextWith(fragmentSource), payConfig(50));

        assertEquals(0, transport.callsReceived(),
                "un fragmento cuyo plan cambio tras la aprobacion NO se envia");
        assertEquals("INVALIDATED", payLedgerStatus("RUN-DRIFT", "T1"),
                "el fragmento con drift de payload queda INVALIDATED, no enviado");
    }

    private TaskContext contextWith(Map<String, Object> fragmentSource) {
        var context = new TaskContext(500L, 600L);
        context.attributes().put("taskOutputs", Map.of("build.fragments", fragmentSource));
        return context;
    }

    private Map<String, Object> payConfig(int pageSize) {
        return Map.of(
                "transport", "REST",
                "pageSize", pageSize,
                "input", Map.of("sourceTaskRef", "build", "sourceOutput", "fragments"));
    }

    private void insertFragmentSet(String fragmentSetId, String... references) {
        var total = references.length;
        for (var i = 0; i < references.length; i++) {
            fragmentStore.insertFragment(null, fragmentSetId, 500L, 600L, "staging_record",
                    i + 1, i + 1, i + 1, total, sampleMessage(references[i]));
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
            statement.executeUpdate("drop table if exists mt101_build_fragment");
            statement.executeUpdate("drop table if exists mt101_corrective_pay_fragment");
            statement.executeUpdate("drop table if exists mt101_rebuild_run");
            // v27 P0.1: el claim une el run padre (EXECUTING + lease vigente). Tabla minima para el join.
            statement.executeUpdate("create table mt101_rebuild_run ("
                    + "rebuild_run_id varchar(80) primary key,"
                    + "pay_status varchar(30) not null default 'EXECUTING',"
                    + "pay_uncertain_reason text, pay_error_message text, pay_completed_at timestamp,"
                    + "pay_resolved_by varchar(120), pay_resolved_at timestamp, pay_resolution_reason text,"
                    + "updated_at timestamp not null default current_timestamp,"
                    + "pay_lease_until timestamp)");
            // v28: tabla de acciones (cadena hash) para que el scheduler de lease registre su accion.
            statement.executeUpdate("drop table if exists mt101_corrective_pay_action");
            statement.executeUpdate("create table mt101_corrective_pay_action ("
                    + "id bigserial primary key, rebuild_run_id varchar(80) not null,"
                    + "action_type varchar(30) not null, previous_status varchar(30), new_status varchar(30),"
                    + "actor varchar(120), reason text, ticket varchar(120),"
                    + "payload_hash varchar(64), config_hash varchar(64),"
                    + "previous_action_hash varchar(64), action_hash varchar(64),"
                    + "created_at timestamp not null default current_timestamp)");
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
                    + "routed_as varchar(80), routed_at timestamp, route_error text,"
                    + "created_at timestamp not null default current_timestamp,"
                    + "updated_at timestamp not null default current_timestamp)");
            statement.executeUpdate("create table mt101_corrective_pay_fragment ("
                    + "id bigserial primary key,"
                    + "rebuild_run_id varchar(80) not null,"
                    + "corrective_set_id varchar(80) not null,"
                    + "corrective_senders_reference varchar(16) not null,"
                    + "payload_hash varchar(64) not null,"
                    + "idempotency_key varchar(180) not null,"
                    + "approved_routed_as varchar(80),"
                    + "dispatch_destination text, dispatch_plan_hash varchar(64),"
                    + "pay_status varchar(30) not null default 'PREPARED',"
                    + "attempts integer not null default 0,"
                    + "gateway_reference varchar(120), error_message text,"
                    + "resolution_source varchar(40), resolved_at timestamp,"
                    + "pay_conflict boolean not null default false, pay_conflict_reason text,"
                    + "dispatch_spec_version varchar(40), dispatch_spec_json text, dispatch_spec_hash varchar(64),"
                    + "prepared_at timestamp,"
                    + "dispatched_at timestamp,"
                    + "updated_at timestamp not null default current_timestamp,"
                    + "unique (rebuild_run_id, corrective_senders_reference))");
            statement.executeUpdate("create unique index ux_test_fragment_ref on mt101_build_fragment"
                    + "(fragment_set_id, senders_reference)");
            statement.executeUpdate("create index ix_test_fragment_status on mt101_build_fragment"
                    + "(fragment_set_id, status, fragment_index)");
        }
    }

    private String fragmentStatus(String setId, String reference) throws SQLException {
        return fragmentColumn(setId, reference, "status");
    }

    private String fragmentError(String setId, String reference) throws SQLException {
        var value = fragmentColumn(setId, reference, "error_message");
        return value == null ? "" : value;
    }

    private String fragmentColumn(String setId, String reference, String column) throws SQLException {
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

    private void insertPayLedger(String runId, String correctiveSetId, String reference) throws SQLException {
        insertPayLedger(runId, correctiveSetId, reference,
                sha256Hex("{\"sendersReference\":\"" + reference + "\"}"));
    }

    /** v27 P0.1: el run padre debe existir EXECUTING con lease vigente para que el claim proceda. */
    private void ensureRun(String runId) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "insert into mt101_rebuild_run (rebuild_run_id, pay_status, pay_lease_until) "
                             + "values (?, 'EXECUTING', current_timestamp + interval '15 minutes') "
                             + "on conflict (rebuild_run_id) do update set pay_status = 'EXECUTING', "
                             + "pay_lease_until = current_timestamp + interval '15 minutes'")) {
            statement.setString(1, runId);
            statement.executeUpdate();
        }
    }

    private void insertPayLedgerWithPlanHash(String runId, String correctiveSetId, String reference,
                                             String approvedPayloadHash, String approvedPlanHash) throws SQLException {
        ensureRun(runId);
        var spec = dispatchSpec(sampleMessage(reference));
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "insert into mt101_corrective_pay_fragment "
                             + "(rebuild_run_id, corrective_set_id, corrective_senders_reference, payload_hash, idempotency_key, approved_routed_as, dispatch_destination, dispatch_plan_hash, dispatch_spec_version, dispatch_spec_json, dispatch_spec_hash, pay_status, prepared_at) "
                             + "values (?, ?, ?, ?, ?, null, 'rest://?', ?, ?, ?, ?, 'PREPARED', current_timestamp)")) {
            statement.setString(1, runId);
            statement.setString(2, correctiveSetId);
            statement.setString(3, reference);
            statement.setString(4, approvedPayloadHash);
            statement.setString(5, "KEY-" + reference);
            statement.setString(6, approvedPlanHash);
            statement.setString(7, spec.version());
            statement.setString(8, spec.specJson());
            statement.setString(9, spec.specHash());
            statement.executeUpdate();
        }
    }

    private void insertPayLedger(String runId, String correctiveSetId, String reference, String approvedPayloadHash)
            throws SQLException {
        // P0.2 v24+v26: el ledger guarda el payload_hash aprobado = sha256(rawPayload), Y el dispatch_plan_hash
        // (transport|ruta|destino|correlacion|payload) computado IGUAL que el provider al despachar, para que
        // el claim (plan aprobado = plan usado) coincida. approved_routed_as null (no routeTransports).
        ensureRun(runId);
        var message = sampleMessage(reference);
        var plan = Mt101PayRouteResolver.resolve(Map.of("transport", "REST"), null, null, message);
        var planHash = Mt101PayRouteResolver.dispatchPlanHash(plan, approvedPayloadHash, null, message);
        var destination = Mt101PayRouteResolver.dispatchDestination(plan, message);
        // v37: el ledger es el contrato ejecutable -> persistir tambien la spec compilada (el dispatch la lee).
        var spec = dispatchSpec(message);
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "insert into mt101_corrective_pay_fragment "
                             + "(rebuild_run_id, corrective_set_id, corrective_senders_reference, payload_hash, idempotency_key, approved_routed_as, dispatch_destination, dispatch_plan_hash, dispatch_spec_version, dispatch_spec_json, dispatch_spec_hash, pay_status, prepared_at) "
                             + "values (?, ?, ?, ?, ?, null, ?, ?, ?, ?, ?, 'PREPARED', current_timestamp)")) {
            statement.setString(1, runId);
            statement.setString(2, correctiveSetId);
            statement.setString(3, reference);
            statement.setString(4, approvedPayloadHash);
            statement.setString(5, "KEY-" + reference);
            statement.setString(6, destination);
            statement.setString(7, planHash);
            statement.setString(8, spec.version());
            statement.setString(9, spec.specJson());
            statement.setString(10, spec.specHash());
            statement.executeUpdate();
        }
    }

    /** v37: spec ejecutable compilada (igual que el servicio) para que el dispatch correctivo la materialice. */
    private Mt101DispatchPlanCompiler.CompiledDispatchSpec dispatchSpec(Mt101Message message) {
        return new Mt101DispatchPlanCompiler(new com.fasterxml.jackson.databind.ObjectMapper())
                .compile(Map.of("transport", "REST"), null, null, message);
    }

    @Test
    void dispatchPlanCompilerRejectsLiteralSecretButKeepsSecretReference() {
        // v37: el plan ejecutable se persiste -> NUNCA puede contener un secreto resuelto. Un secreto LITERAL
        // se rechaza al compilar; una referencia ${secret:...} se conserva (se re-resuelve al materializar).
        var compiler = new Mt101DispatchPlanCompiler(new com.fasterxml.jackson.databind.ObjectMapper());
        var message = sampleMessage("SEC1");
        var literal = Map.<String, Object>of("transport", "REST",
                "rest", Map.of("url", "https://bank/", "token", "plain-literal-secret"));
        var error = assertThrows(IllegalStateException.class,
                () -> compiler.compile(literal, null, null, message));
        assertTrue(error.getMessage().contains("token"), error.getMessage());

        var withRef = Map.<String, Object>of("transport", "REST",
                "rest", Map.of("url", "https://bank/", "token", "${secret:bank-token}"));
        var spec = compiler.compile(withRef, null, null, message);
        assertTrue(spec.specJson().contains("${secret:bank-token}"),
                "la spec persiste la referencia, nunca el valor resuelto");
    }

    private String sha256Hex(String value) {
        try {
            var digest = java.security.MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (java.security.NoSuchAlgorithmException error) {
            throw new IllegalStateException(error);
        }
    }

    private String payLedgerStatus(String runId, String reference) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "select pay_status from mt101_corrective_pay_fragment "
                             + "where rebuild_run_id = ? and corrective_senders_reference = ?")) {
            statement.setString(1, runId);
            statement.setString(2, reference);
            try (var rs = statement.executeQuery()) {
                rs.next();
                return rs.getString(1);
            }
        }
    }

    private int payLedgerAttempts(String runId, String reference) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "select attempts from mt101_corrective_pay_fragment "
                             + "where rebuild_run_id = ? and corrective_senders_reference = ?")) {
            statement.setString(1, runId);
            statement.setString(2, reference);
            try (var rs = statement.executeQuery()) {
                rs.next();
                return rs.getInt(1);
            }
        }
    }

    private String payLedgerColumn(String runId, String reference, String column) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "select " + column + " from mt101_corrective_pay_fragment "
                             + "where rebuild_run_id = ? and corrective_senders_reference = ?")) {
            statement.setString(1, runId);
            statement.setString(2, reference);
            try (var rs = statement.executeQuery()) {
                rs.next();
                return rs.getString(1);
            }
        }
    }

    private long countRowsWhere(String table, String where) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             var rs = statement.executeQuery("select count(*) from " + table + " where " + where)) {
            rs.next();
            return rs.getLong(1);
        }
    }

    private DataSource dataSource() {
        var pgDataSource = new PGSimpleDataSource();
        pgDataSource.setURL(POSTGRES.getJdbcUrl());
        pgDataSource.setUser(POSTGRES.getUsername());
        pgDataSource.setPassword(POSTGRES.getPassword());
        return pgDataSource;
    }

    private static final class StubTransport implements PaymentMessageTransport {
        private final String transportId;
        private final List<TransportResult> results;
        private final List<Mt101Message> received = new ArrayList<>();
        private final List<Map<String, Object>> receivedConfigurations = new ArrayList<>();

        StubTransport(List<TransportResult> results) {
            this("REST", results);
        }

        StubTransport(String transportId, List<TransportResult> results) {
            this.transportId = transportId;
            this.results = results;
        }

        @Override
        public String transport() {
            return transportId;
        }

        @Override
        public TransportResult send(Mt101Message message, Map<String, Object> configuration) {
            received.add(message);
            receivedConfigurations.add(new LinkedHashMap<>(configuration));
            if (received.size() > results.size()) {
                return TransportResult.accepted("GW-" + received.size(), 1, 1L);
            }
            return results.get(received.size() - 1);
        }

        List<String> receivedReferences() {
            return received.stream()
                    .map(message -> message.sequenceA().sendersReference())
                    .toList();
        }

        int callsReceived() {
            return received.size();
        }

        List<Map<String, Object>> receivedConfigurations() {
            return receivedConfigurations;
        }
    }

    /** v30: transporte cuyo send() se BLOQUEA hasta liberarlo, para probar el solape fisico con el scheduler. */
    private static final class BlockingTransport implements PaymentMessageTransport {
        private final CountDownLatch dispatchReached;
        private final CountDownLatch releaseSend;
        private final TransportResult result;
        private final List<Mt101Message> received = new ArrayList<>();

        BlockingTransport(CountDownLatch dispatchReached, CountDownLatch releaseSend, TransportResult result) {
            this.dispatchReached = dispatchReached;
            this.releaseSend = releaseSend;
            this.result = result;
        }

        @Override
        public String transport() {
            return "REST";
        }

        @Override
        public TransportResult send(Mt101Message message, Map<String, Object> configuration) {
            received.add(message);
            dispatchReached.countDown(); // el fragmento ya esta DISPATCHING (claim commiteado antes del send)
            try {
                if (!releaseSend.await(15, java.util.concurrent.TimeUnit.SECONDS)) {
                    throw new IllegalStateException("send() no fue liberado a tiempo");
                }
            } catch (InterruptedException error) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException(error);
            }
            return result;
        }

        int callsReceived() {
            return received.size();
        }
    }

    private static final class InstanceOfList<T> implements Instance<T> {
        private final List<T> instances;

        InstanceOfList(List<T> instances) {
            this.instances = instances;
        }

        @Override public Instance<T> select(java.lang.annotation.Annotation... q) { return this; }
        @Override public <U extends T> Instance<U> select(Class<U> s, java.lang.annotation.Annotation... q) { throw new UnsupportedOperationException(); }
        @Override public <U extends T> Instance<U> select(jakarta.enterprise.util.TypeLiteral<U> s, java.lang.annotation.Annotation... q) { throw new UnsupportedOperationException(); }
        @Override public boolean isUnsatisfied() { return instances.isEmpty(); }
        @Override public boolean isAmbiguous() { return instances.size() > 1; }
        @Override public void destroy(T inst) {}
        @Override public Handle<T> getHandle() { throw new UnsupportedOperationException(); }
        @Override public Iterable<? extends Handle<T>> handles() { throw new UnsupportedOperationException(); }
        @Override public Iterator<T> iterator() { return instances.iterator(); }
        @Override public T get() { return instances.get(0); }
        @Override public Stream<T> stream() { return StreamSupport.stream(spliterator(), false); }
    }

    private static final class InstanceOfOne<T> implements Instance<T> {
        private final T instance;

        InstanceOfOne(T instance) {
            this.instance = instance;
        }

        @Override public Instance<T> select(java.lang.annotation.Annotation... q) { return this; }
        @Override public <U extends T> Instance<U> select(Class<U> s, java.lang.annotation.Annotation... q) { throw new UnsupportedOperationException(); }
        @Override public <U extends T> Instance<U> select(jakarta.enterprise.util.TypeLiteral<U> s, java.lang.annotation.Annotation... q) { throw new UnsupportedOperationException(); }
        @Override public boolean isUnsatisfied() { return false; }
        @Override public boolean isAmbiguous() { return false; }
        @Override public void destroy(T inst) {}
        @Override public Handle<T> getHandle() { throw new UnsupportedOperationException(); }
        @Override public Iterable<? extends Handle<T>> handles() { throw new UnsupportedOperationException(); }
        @Override public Iterator<T> iterator() { return List.of(instance).iterator(); }
        @Override public T get() { return instance; }
        @Override public Stream<T> stream() { return StreamSupport.stream(spliterator(), false); }
    }
}
