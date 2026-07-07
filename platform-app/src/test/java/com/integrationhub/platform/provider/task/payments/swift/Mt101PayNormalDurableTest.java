package com.integrationhub.platform.provider.task.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.service.execution.RecordAuditEmitter;
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

    @Test
    void lateTerminalResultDoesNotOverwriteStatusAndFlagsPayConflict() throws Exception {
        // P0-1: un resultado terminal TARDÍO del worker (ACCEPTED de un send colgado) NO debe sobrescribir un
        // terminal ya resuelto por STATUS/RECONCILE (REJECTED). El update pasa a estar GUARDADO (solo desde
        // DISPATCHING/UNCERTAIN) y el conflicto se marca durable (pay_conflict), sin sobrescritura silenciosa.
        var setId = "PAY-NORMAL-P0-1";
        seedArchived(setId, "L1", 1, 2);
        seedArchived(setId, "L2", 2, 2);
        var fragmentSource = fragmentStore.source(null, setId, 2);
        var from = List.of("DISPATCHING", "UNCERTAIN");

        // Happy path: DISPATCHING -> SENT (guardado) transiciona y devuelve el ref.
        fragmentStore.claimForDispatch(fragmentSource, List.of("L1"), List.of("ARCHIVED"));
        var updatedOk = fragmentStore.resolvePayStatusReturning(fragmentSource, List.of("L1"), from, "SENT", null);
        assertEquals(Set.of("L1"), updatedOk);
        assertEquals("SENT", statusFor(setId, "L1"));

        // RACE: L2 reclamado (DISPATCHING); STATUS lo resuelve REJECTED mientras el worker enviaba.
        fragmentStore.claimForDispatch(fragmentSource, List.of("L2"), List.of("ARCHIVED"));
        fragmentStore.resolvePayStatusReturning(fragmentSource, List.of("L2"), from, "REJECTED",
                "confirmed rejected by STATUS");
        assertEquals("REJECTED", statusFor(setId, "L2"));

        // El worker recibe un ACCEPTED TARDÍO e intenta marcar SENT: el guard lo BLOQUEA (L2 ya terminal).
        var updatedLate = fragmentStore.resolvePayStatusReturning(fragmentSource, List.of("L2"), from, "SENT", null);
        assertTrue(updatedLate.isEmpty(), "un resultado tardío NO transiciona un terminal ya resuelto");
        assertEquals("REJECTED", statusFor(setId, "L2"), "el fragmento conserva su estado real (no se sobrescribe)");

        // El conflicto queda durable para conciliación (no silencioso).
        fragmentStore.markPayConflict(fragmentSource, List.of("L2"), "late SENT vs prior REJECTED");
        assertTrue(payConflictFor(setId, "L2"), "el fragmento queda marcado pay_conflict");
        assertFalse(payConflictFor(setId, "L1"), "un fragmento sin conflicto NO se marca");
    }

    @Test
    void concurrentStatusResolvingToSameTerminalIsIdempotentNotConflict() throws Exception {
        // B (falso positivo corregido): si STATUS resuelve el fragmento al MISMO terminal que el worker va a
        // escribir, el resultado del worker es idempotente (SAME_TERMINAL) y NO debe marcarse pay_conflict.
        var setId = "PAY-SAME-TERMINAL";
        seedArchived(setId, "S1", 1, 1);
        var emitter = new CapturingAuditEmitter();
        // El transporte simula STATUS concurrente: al enviar S1 lo fija a SENT (mismo terminal), luego ACCEPTED.
        var transport = new StatusRacingTransport("REST", dataSource, Map.of("S1", "SENT"));
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport), fragmentStore, null, emitter);

        provider.execute(payContextFor(setId, 1), payConfig());

        assertEquals("SENT", statusFor(setId, "S1"));
        assertFalse(payConflictFor(setId, "S1"), "SAME_TERMINAL es idempotente: no es conflicto");
        assertFalse(emitter.hasStage("PAY_CONFLICT"), "no se emite trama PAY_CONFLICT para un terminal idéntico");
    }

    @Test
    void concurrentStatusResolvingToDifferentTerminalIsFlaggedAndEmitsPayConflictAudit() throws Exception {
        // A/C: STATUS resolvió REJECTED y el worker trae un ACCEPTED tardío (SENT) -> contradicción real: no se
        // sobrescribe el estado, se marca pay_conflict y se emite la trama append-only PAY_CONFLICT (no solo el
        // booleano). El caso inverso al de arriba, con el mismo mecanismo simétrico.
        var setId = "PAY-CONFLICT-TERMINAL";
        seedArchived(setId, "C1", 1, 1);
        var emitter = new CapturingAuditEmitter();
        var transport = new StatusRacingTransport("REST", dataSource, Map.of("C1", "REJECTED"));
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport), fragmentStore, null, emitter);

        provider.execute(payContextFor(setId, 1), payConfig());

        assertEquals("REJECTED", statusFor(setId, "C1"),
                "el estado real (REJECTED) no se sobrescribe con el SENT tardío");
        assertTrue(payConflictFor(setId, "C1"), "un terminal contradictorio marca pay_conflict");
        assertTrue(emitter.hasStage("PAY_CONFLICT"), "se emite la trama append-only PAY_CONFLICT para el conflicto");
    }

    // --- helpers ---

    private TaskContext payContextFor(String fragmentSetId, int total) {
        var context = new TaskContext(100L, 20L);
        var fragmentSource = fragmentStore.source(null, fragmentSetId, total);
        context.attributes().put("taskOutputs", Map.of("build.fragments", fragmentSource));
        return context;
    }

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
                    + "pay_conflict boolean not null default false,"
                    + "pay_conflict_reason text,"
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

    /**
     * Simula una resolución STATUS/RECONCILE CONCURRENTE: al enviar un ref, fija su fragmento al terminal indicado
     * (como si STATUS lo hubiera resuelto mientras el send estaba en vuelo) y luego devuelve ACCEPTED, de modo que
     * el worker intente marcar SENT sobre un terminal ya escrito. Con esto se ejercita la clasificación
     * SAME_TERMINAL vs CONFLICT de {@code finalizeNormalGuarded}.
     */
    private static final class StatusRacingTransport implements PaymentMessageTransport {
        private final String transportId;
        private final DataSource dataSource;
        private final Map<String, String> resolveTo;

        StatusRacingTransport(String transportId, DataSource dataSource, Map<String, String> resolveTo) {
            this.transportId = transportId;
            this.dataSource = dataSource;
            this.resolveTo = resolveTo;
        }

        @Override public String transport() { return transportId; }

        @Override
        public TransportResult send(Mt101Message message, Map<String, Object> configuration) {
            var ref = message.sequenceA() == null ? null : message.sequenceA().sendersReference();
            var terminal = ref == null ? null : resolveTo.get(ref);
            if (terminal != null) {
                try (Connection connection = dataSource.getConnection();
                     var statement = connection.prepareStatement(
                             "update mt101_build_fragment set status = ? where senders_reference = ?")) {
                    statement.setString(1, terminal);
                    statement.setString(2, ref);
                    statement.executeUpdate();
                } catch (SQLException error) {
                    throw new IllegalStateException("racing STATUS update failed for " + ref, error);
                }
            }
            return TransportResult.accepted("GW-" + ref, 1, 1L);
        }
    }

    /** Captura las tramas de auditoría emitidas para verificar la trama append-only PAY_CONFLICT. */
    private static final class CapturingAuditEmitter implements RecordAuditEmitter {
        private final List<AuditEnvelope> captured = new ArrayList<>();

        @Override
        public void emitRecords(java.util.Collection<AuditEnvelope> envelopes) {
            captured.addAll(envelopes);
        }

        boolean hasStage(String stage) {
            return captured.stream().anyMatch(envelope -> stage.equals(envelope.stage()));
        }
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
