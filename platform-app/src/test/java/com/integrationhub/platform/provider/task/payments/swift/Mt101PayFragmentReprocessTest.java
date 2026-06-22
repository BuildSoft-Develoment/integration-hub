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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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
        assertEquals(1, new Mt101RebuildRepository().markPayFragmentDispatching(dataSource, "RUN-ALREADY", "T1"));

        var transport = new StubTransport(List.of(TransportResult.accepted("GW-T1", 1, 1L)));
        var payStore = new Mt101CorrectivePayStore(dataSource, null, new Mt101RebuildRepository());
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport), fragmentStore,
                null, null, payStore);

        provider.execute(contextWith(fragmentSource), payConfig(50));

        assertEquals(0, transport.callsReceived(),
                "un fragmento ya DISPATCHING no se reenvia a ciegas (se resuelve por STATUS)");
        assertEquals("DISPATCHING", payLedgerStatus("RUN-ALREADY", "T1"), "permanece DISPATCHING para conciliar");
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
                    + "pay_status varchar(30) not null default 'PREPARED',"
                    + "attempts integer not null default 0,"
                    + "gateway_reference varchar(120), error_message text,"
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
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "insert into mt101_corrective_pay_fragment "
                             + "(rebuild_run_id, corrective_set_id, corrective_senders_reference, payload_hash, idempotency_key, pay_status, prepared_at) "
                             + "values (?, ?, ?, repeat('1', 64), ?, 'PREPARED', current_timestamp)")) {
            statement.setString(1, runId);
            statement.setString(2, correctiveSetId);
            statement.setString(3, reference);
            statement.setString(4, "KEY-" + reference);
            statement.executeUpdate();
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
