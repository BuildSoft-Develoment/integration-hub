package com.integrationhub.platform.provider.task.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
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
                    + "created_at timestamp not null default current_timestamp,"
                    + "updated_at timestamp not null default current_timestamp)");
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

    private DataSource dataSource() {
        var pgDataSource = new PGSimpleDataSource();
        pgDataSource.setURL(POSTGRES.getJdbcUrl());
        pgDataSource.setUser(POSTGRES.getUsername());
        pgDataSource.setPassword(POSTGRES.getPassword());
        return pgDataSource;
    }

    private static final class StubTransport implements PaymentMessageTransport {
        private final List<TransportResult> results;
        private final List<Mt101Message> received = new ArrayList<>();

        StubTransport(List<TransportResult> results) {
            this.results = results;
        }

        @Override
        public String transport() {
            return "REST";
        }

        @Override
        public TransportResult send(Mt101Message message, Map<String, Object> configuration) {
            received.add(message);
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
