package com.integrationhub.platform.provider.task.payments.swift;

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
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * P3 — durabilidad del PAY por LISTA en memoria ({@code MT101_BUILD}/{@code SPLIT} → PAY). El PROVIDER real reclama la
 * intención de dispatch antes de enviar: ante un resultado ambiguo, un segundo PAY (re-request) del mismo pago NO
 * reenvía (ni el enviado ni el incierto). Contraparte del test del camino persistido {@code Mt101PayNormalDurableTest},
 * pero para la rama de lista — el escenario exacto del gap P3.
 */
@Testcontainers
class Mt101PayDirectListDurableTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("mt101_pay_direct_list")
            .withUsername("postgres")
            .withPassword("postgres");

    private DataSource dataSource;
    private Mt101PayDispatchIntentStore intentStore;

    @BeforeEach
    void setUp() throws Exception {
        dataSource = dataSource();
        intentStore = new Mt101PayDispatchIntentStore(dataSource);
        prepareSchema();
    }

    @Test
    void ambiguousResultOnDirectListMakesASecondPayNotResendAnything() throws Exception {
        // A2 devuelve INCIERTO; A1 y A3 aceptados. Camino de lista en memoria (no fragmentSetId).
        var transport = new RefKeyedTransport("REST", Set.of("A2"));
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport),
                null, null, null, null, null, intentStore);

        var result = provider.execute(directListContext(), payConfig());

        assertFalse(result.success(), "un INCIERTO es no-éxito (el orquestador debe conciliar)");
        assertEquals(3, transport.calls(), "los 3 mensajes de la lista se reclaman y despachan una vez");
        assertEquals("SENT", intentStatus("REST||A1"));
        assertEquals("SENT", intentStatus("REST||A3"));
        assertEquals("UNCERTAIN", intentStatus("REST||A2"),
                "el resultado ambiguo deja la intención UNCERTAIN durable");

        // SEGUNDO PAY (re-request): la lista se reconstruye en memoria, pero NINGÚN pago se reenvía.
        var transport2 = new RefKeyedTransport("REST", Set.of("A2"));
        var provider2 = new Mt101PayTaskProvider(new InstanceOfOne<>(transport2),
                null, null, null, null, null, intentStore);
        var second = provider2.execute(directListContext(), payConfig());

        assertEquals(0, transport2.calls(),
                "el re-request NO reenvía: SENT/UNCERTAIN bloquean el claim (no doble envío)");
        assertFalse(second.success(), "sigue habiendo un incierto pendiente -> no-éxito (conciliar)");
        assertEquals("UNCERTAIN", intentStatus("REST||A2"), "A2 sigue UNCERTAIN (exige STATUS/RECONCILE)");
    }

    @Test
    void emptyCorrelationKeyIsRejectedAndNeverSilencesAPayment() throws Exception {
        // P0-2: con idempotencyKeyTemplate vacío la correlationKey queda "" → la clave sería "REST||" para TODOS
        // los pagos → colisión: sin fix, el 2º se reportaría ALREADY_SENT sin enviarse (silenciaría un pago). El
        // fix rechaza (fail-loud) ANTES del claim: nunca crea intención ambigua ni llama al banco.
        var transport = new RefKeyedTransport("REST", Set.of());
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport),
                null, null, null, null, null, intentStore);

        var result = provider.execute(directListContext(), payConfigEmptyCorrelation());

        assertFalse(result.success(), "sin clave de idempotencia no se puede despachar de forma segura → no-éxito");
        assertEquals(0, transport.calls(), "NUNCA se envía sin correlación (fail-loud, sin banco ni intención)");
        assertNull(intentStatus("REST||"), "no se crea intención ambigua bajo la clave colisionante 'REST||'");
    }

    // --- helpers ---

    private Map<String, Object> payConfigEmptyCorrelation() {
        return Map.of(
                "transport", "REST",
                "idempotencyKeyTemplate", "",
                "archiveStatusSync", false,
                "input", Map.of("sourceTaskRef", "build", "sourceOutput", "records"));
    }

    private TaskContext directListContext() {
        var context = new TaskContext(100L, 20L);
        context.attributes().put("taskOutputs", Map.of("build.records",
                List.of(sampleMessage("A1", 1, 3), sampleMessage("A2", 2, 3), sampleMessage("A3", 3, 3))));
        return context;
    }

    private Map<String, Object> payConfig() {
        return Map.of(
                "transport", "REST",
                "archiveStatusSync", false,
                "input", Map.of("sourceTaskRef", "build", "sourceOutput", "records"));
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
            statement.executeUpdate("drop table if exists mt101_pay_dispatch_intent");
            statement.executeUpdate("create table mt101_pay_dispatch_intent ("
                    + "id bigserial primary key,"
                    + "dispatch_key varchar(512) not null,"
                    + "process_execution_id bigint,"
                    + "senders_reference varchar(35),"
                    + "status varchar(20) not null,"
                    + "gateway_reference varchar(140),"
                    + "attempts integer not null default 0,"
                    + "error_message text,"
                    + "created_at timestamp not null default current_timestamp,"
                    + "updated_at timestamp not null default current_timestamp,"
                    + "constraint ux_mt101_pay_dispatch_intent_key unique (dispatch_key))");
        }
    }

    private String intentStatus(String dispatchKey) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "select status from mt101_pay_dispatch_intent where dispatch_key = ?")) {
            statement.setString(1, dispatchKey);
            try (var rs = statement.executeQuery()) {
                return rs.next() ? rs.getString(1) : null;
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

    /** Transporte que devuelve INCIERTO para un conjunto de referencias y aceptado para el resto; cuenta envíos. */
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
