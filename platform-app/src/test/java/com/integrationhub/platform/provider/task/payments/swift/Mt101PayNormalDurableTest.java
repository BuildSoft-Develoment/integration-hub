package com.integrationhub.platform.provider.task.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.payments.Mt101Message;
import com.integrationhub.platform.spi.task.payments.PaymentMessageTransport;
import com.integrationhub.platform.spi.task.payments.TransportResult;
import jakarta.enterprise.inject.Instance;
import jakarta.enterprise.util.TypeLiteral;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.postgresql.ds.PGSimpleDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;
import java.lang.annotation.Annotation;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * v51-fix (#7 app_htoh 55): estado DURABLE del PAY normal (no correctivo). Ante un resultado AMBIGUO el
 * fragmento pasa a {@code UNCERTAIN} durable y queda EXCLUIDO de una nueva seleccion de PAY (que solo lee
 * {@code ARCHIVED}); nunca se reenvia automaticamente. Ademas el despacho reclama de forma ATOMICA
 * {@code ARCHIVED -> DISPATCHING} antes de enviar, de modo que un fragmento reclamado no lo toma otro worker.
 *
 * @covers spec 008-mensajeria-pagos RF-004, T-009
 */
@Testcontainers
class Mt101PayNormalDurableTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("mt101_pay_normal_durable")
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
    void ambiguousResultMarksFragmentUncertainAndASecondPayDoesNotResend() throws Exception {
        var fragmentSetId = "PAY-NORMAL-1";
        seedArchived(fragmentSetId, "A1", 1, 3);
        seedArchived(fragmentSetId, "A2", 2, 3);
        seedArchived(fragmentSetId, "A3", 3, 3);

        // A2 devuelve INCIERTO (timeout/reset/respuesta perdida); A1 y A3 aceptados.
        var transport = new RefKeyedTransport("REST", Set.of("A2"));
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport), fragmentStore);

        var result = provider.execute(payContext(fragmentSetId), payConfig());

        assertFalse(result.success(), "un INCIERTO es no-exito (el orquestador debe conciliar)");
        assertEquals(3, transport.calls(), "los 3 ARCHIVED se reclaman y despachan una vez");
        assertEquals("SENT", statusFor(fragmentSetId, "A1"));
        assertEquals("SENT", statusFor(fragmentSetId, "A3"));
        assertEquals("UNCERTAIN", statusFor(fragmentSetId, "A2"),
                "el resultado ambiguo deja el fragmento UNCERTAIN durable, no ARCHIVED");

        // SEGUNDO PAY: nada esta ARCHIVED (A1/A3 SENT, A2 UNCERTAIN) -> no se re-selecciona ni se reenvia.
        var transport2 = new RefKeyedTransport("REST", Set.of("A2"));
        var provider2 = new Mt101PayTaskProvider(new InstanceOfOne<>(transport2), fragmentStore);
        var second = provider2.execute(payContext(fragmentSetId), payConfig());

        assertEquals(0, transport2.calls(), "un UNCERTAIN nunca se reenvia automaticamente en un PAY posterior");
        assertTrue(second.success(), () -> "sin ARCHIVED no hay nada que despachar: " + second.details());
        assertEquals("UNCERTAIN", statusFor(fragmentSetId, "A2"), "el fragmento sigue UNCERTAIN (exige STATUS/RECONCILE)");
    }

    @Test
    void claimArchivedForDispatchIsAtomicAndClaimsEachFragmentOnlyOnce() throws Exception {
        var fragmentSetId = "PAY-NORMAL-CLAIM";
        seedArchived(fragmentSetId, "C1", 1, 3);
        seedArchived(fragmentSetId, "C2", 2, 3);
        // C3 ya SENT: no es reclamable (no esta ARCHIVED).
        seedArchived(fragmentSetId, "C3", 3, 3);
        var fragmentSource = fragmentStore.source(null, fragmentSetId, 3);
        fragmentStore.markStatusBatch(fragmentSource, List.of("C3"), "SENT");

        var first = fragmentStore.claimForDispatch(fragmentSource, List.of("C1", "C2", "C3"), List.of("ARCHIVED"));
        assertEquals(Set.of("C1", "C2"), first, "solo se reclaman los ARCHIVED (C3 ya SENT no)");
        assertEquals("DISPATCHING", statusFor(fragmentSetId, "C1"));
        assertEquals("DISPATCHING", statusFor(fragmentSetId, "C2"));

        // Un segundo claim (otro worker) NO vuelve a reclamar los ya DISPATCHING -> sin doble envio.
        var second = fragmentStore.claimForDispatch(fragmentSource, List.of("C1", "C2", "C3"), List.of("ARCHIVED"));
        assertTrue(second.isEmpty(), "un fragmento ya DISPATCHING no lo reclama otro worker");
    }

    // --- helpers ---

    private TaskContext payContext(String fragmentSetId) {
        var context = new TaskContext(100L, 20L);
        var fragmentSource = fragmentStore.source(null, fragmentSetId, 3);
        context.attributes().put("taskOutputs", Map.of("build.fragments", fragmentSource));
        return context;
    }

    private Map<String, Object> payConfig() {
        return Map.of(
                "transport", "REST",
                "pageSize", 2,
                "archiveStatusSync", false,
                "input", Map.of("sourceTaskRef", "build", "sourceOutput", "fragments"));
    }

    private void seedArchived(String fragmentSetId, String reference, int index, int total) throws SQLException {
        fragmentStore.insertFragment(null, fragmentSetId, 100L, 20L, "staging_record",
                index, index, index, total, sampleMessage(reference, index, total));
        var fragmentSource = fragmentStore.source(null, fragmentSetId, total);
        fragmentStore.markStatusBatch(fragmentSource, List.of(reference), "ARCHIVED");
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
            statement.executeUpdate("create unique index ux_pay_normal_fragment_ref on mt101_build_fragment"
                    + "(fragment_set_id, senders_reference)");
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

    private DataSource dataSource() {
        var pg = new PGSimpleDataSource();
        pg.setURL(POSTGRES.getJdbcUrl());
        pg.setUser(POSTGRES.getUsername());
        pg.setPassword(POSTGRES.getPassword());
        return pg;
    }

    /** Transporte que devuelve INCIERTO para un conjunto de referencias y aceptado para el resto. */
    private static final class RefKeyedTransport implements PaymentMessageTransport {
        private final String transportId;
        private final Set<String> uncertainRefs;
        private int calls;

        RefKeyedTransport(String transportId, Set<String> uncertainRefs) {
            this.transportId = transportId;
            this.uncertainRefs = uncertainRefs;
        }

        @Override public String transport() { return transportId; }

        @Override
        public TransportResult send(Mt101Message message, Map<String, Object> configuration) {
            calls++;
            var ref = message.sequenceA() == null ? null : message.sequenceA().sendersReference();
            if (ref != null && uncertainRefs.contains(ref)) {
                return TransportResult.uncertain(1, 1L, "respuesta ambigua del banco");
            }
            return TransportResult.accepted("GW-" + ref, 1, 1L);
        }

        int calls() { return calls; }
    }

    private static final class InstanceOfOne<T> implements Instance<T> {
        private final T instance;
        InstanceOfOne(T instance) { this.instance = instance; }
        @Override public Instance<T> select(Annotation... q) { return this; }
        @Override public <U extends T> Instance<U> select(Class<U> s, Annotation... q) { throw new UnsupportedOperationException(); }
        @Override public <U extends T> Instance<U> select(TypeLiteral<U> s, Annotation... q) { throw new UnsupportedOperationException(); }
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
