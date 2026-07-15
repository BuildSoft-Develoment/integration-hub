package com.integrationhub.platform.provider.task.payments.swift;

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
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

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
        assertTrue(result.needsReconciliation(),
                "G1: un INCIERTO señala needsReconciliation -> el motor cierra la ejecución en NEEDS_RECONCILIATION");
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
    void transportFailureOnDirectListRecordsInvalidatedIntentNotRejectedAndIsRepayable() throws Exception {
        // D.2 (#8a): un transportFailure PRE-DESPACHO en el camino de lista -> intención INVALIDATED (NO REJECTED:
        // no fue rechazo de negocio del banco) y el archive NO se marca REJECTED. El re-request re-reclama
        // (INVALIDATED es re-reclamable como REJECTED) y, corregida la causa, se envía. A1/A3 SENT no se reenvían.
        var transport = new RetriableRefTransport("REST", Set.of("A2"));
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport),
                null, null, null, null, null, intentStore);

        var result = provider.execute(directListContext(), payConfig());

        assertFalse(result.success(), "un transportFailure es no-éxito (invalidatedCount>0)");
        assertEquals(3, transport.calls(), "los 3 mensajes de la lista se despachan una vez");
        assertEquals("SENT", intentStatus("REST||A1"));
        assertEquals("SENT", intentStatus("REST||A3"));
        assertEquals("INVALIDATED", intentStatus("REST||A2"),
                "el transportFailure deja la intención INVALIDATED (no REJECTED): fallo técnico, no rechazo del banco");

        // SEGUNDO PAY (tras corregir la causa técnica): A2 (INVALIDATED) SÍ se re-reclama y esta vez se acepta.
        var transport2 = new RetriableRefTransport("REST", Set.of());
        var provider2 = new Mt101PayTaskProvider(new InstanceOfOne<>(transport2),
                null, null, null, null, null, intentStore);
        var second = provider2.execute(directListContext(), payConfig());

        assertEquals(1, transport2.calls(),
                "solo A2 (INVALIDATED) se re-reclama y re-despacha una vez; A1/A3 SENT no se reenvían (sin doble pago)");
        assertTrue(second.success(), () -> "tras corregir la causa técnica el re-pago funciona: " + second.details());
        assertEquals("SENT", intentStatus("REST||A2"), "tras el re-pago A2 queda SENT");
    }

    @Test
    void aConcurrentTerminalWhileSendingEmitsPayConflictAnomaly() throws Exception {
        // #9-equivalente (camino por lista): mientras este envio esta en vuelo, otro flujo (p.ej. conciliacion) mueve
        // la intencion DISPATCHING a un terminal. recordResult (guardado por status='DISPATCHING') actualiza 0 filas
        // -> NO se pisa el terminal, y se emite la trama append-only PAY_CONFLICT para conciliar (cero anomalias
        // silenciosas). Espejo del #9 del camino persistido.
        var emitter = new CapturingAuditEmitter();
        var transport = new IntentRacingTransport("REST", dataSource, Map.of("A1", "REJECTED"));
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport),
                null, null, emitter, null, null, intentStore);

        provider.execute(singleMessageContext("A1", "{\"amount\":\"1\"}"), payConfig());

        assertEquals("REJECTED", intentStatus("REST||A1"),
                "la conciliacion concurrente gano: el terminal NO se pisa (recordResult guardado)");
        assertTrue(emitter.hasStage("PAY_CONFLICT"),
                "recordResult 0 filas -> se emite PAY_CONFLICT (anomalia auditada, no silenciosa)");
    }

    @Test
    void aDifferentPayloadUnderTheSameKeyIsNotSilencedAsAlreadySent() throws Exception {
        // R1: pago 1 con ref REF y payload P1 -> SENT. Pago 2 con la MISMA ref (misma dispatch_key "REST||REF") pero
        // payload DISTINTO (otro monto) es OTRO pago colisionando con la idempotency key: sin identidad de payload se
        // reportaría ALREADY_SENT y se silenciaría; con R1 NO se envía y es no-éxito (conflicto -> conciliar).
        var transport1 = new RefKeyedTransport("REST", Set.of());
        var provider1 = new Mt101PayTaskProvider(new InstanceOfOne<>(transport1),
                null, null, null, null, null, intentStore);
        var first = provider1.execute(singleMessageContext("REF", "{\"amount\":\"100.00\"}"), payConfig());
        assertTrue(first.success(), "el primer pago se envía y acepta");
        assertEquals(1, transport1.calls());
        assertEquals("SENT", intentStatus("REST||REF"));

        var transport2 = new RefKeyedTransport("REST", Set.of());
        var provider2 = new Mt101PayTaskProvider(new InstanceOfOne<>(transport2),
                null, null, null, null, null, intentStore);
        var second = provider2.execute(singleMessageContext("REF", "{\"amount\":\"500.00\"}"), payConfig());
        assertEquals(0, transport2.calls(),
                "un payload DISTINTO bajo la misma clave NUNCA se envía silenciosamente (colisión)");
        assertFalse(second.success(), "la colisión de clave con payload distinto es no-éxito (conciliar)");
        assertEquals("SENT", intentStatus("REST||REF"), "el pago original permanece SENT; no se sobrescribe");
    }

    @Test
    void sameBusinessPaymentWithARegeneratedUetrStaysIdempotentNotAFalseConflict() throws Exception {
        // R1 (doble-check): uetrStrategy=perMessage regenera el UETR en cada build. Un re-request del MISMO pago (mismo
        // :20:, mismo cuerpo de negocio) NO debe verse como colisión sólo por el UETR nuevo: la identidad neutraliza
        // el UETR -> sigue ALREADY_SENT (idempotente), no un falso conflicto que bloquearía un reintento legítimo.
        var transport1 = new RefKeyedTransport("REST", Set.of());
        var provider1 = new Mt101PayTaskProvider(new InstanceOfOne<>(transport1),
                null, null, null, null, null, intentStore);
        assertTrue(provider1.execute(uetrContext("REF", "CUERPO-NEGOCIO", "uetr-AAA"), payConfig()).success());
        assertEquals(1, transport1.calls());

        var transport2 = new RefKeyedTransport("REST", Set.of());
        var provider2 = new Mt101PayTaskProvider(new InstanceOfOne<>(transport2),
                null, null, null, null, null, intentStore);
        var second = provider2.execute(uetrContext("REF", "CUERPO-NEGOCIO", "uetr-BBB"), payConfig());
        assertEquals(0, transport2.calls(), "mismo pago con UETR nuevo: NO se reenvía (idempotente)");
        assertTrue(second.success(), "idempotente = éxito, no un incierto por falsa colisión de UETR");
        assertEquals("SENT", intentStatus("REST||REF"));
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

    /** Contexto con UN solo mensaje de la lista, con un {@code rawPayload} explícito (para R1: identidad del pago). */
    private TaskContext singleMessageContext(String reference, String rawPayload) {
        var context = new TaskContext(100L, 20L);
        context.attributes().put("taskOutputs", Map.of("build.records",
                List.of(sampleMessage(reference, 1, 1).withRawPayload(rawPayload, "JSON"))));
        return context;
    }

    /**
     * Contexto de UN mensaje cuyo {@code rawPayload} EMBEBE el UETR (como el bloque FIN {@code {3:{121:uetr}}}) sobre
     * un cuerpo de negocio fijo: dos UETR distintos con el mismo cuerpo prueban la neutralización del UETR (R1).
     */
    private TaskContext uetrContext(String reference, String businessBody, String uetr) {
        var base = sampleMessage(reference, 1, 1);
        var withUetr = new Mt101Message(
                new Mt101Message.Envelope(base.envelope().senderLt(), base.envelope().receiverLt(), uetr,
                        base.envelope().priority()),
                base.sequenceA(), base.transactions(), base.controlTotals(),
                "{3:{121:" + uetr + "}}" + businessBody, "FIN");
        var context = new TaskContext(100L, 20L);
        context.attributes().put("taskOutputs", Map.of("build.records", List.of(withUetr)));
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
                    + "payload_hash varchar(64),"
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

    /** Transporte que devuelve transportFailure (retriable, pre-despacho) para un conjunto de refs; acepta el resto. */
    private static final class RetriableRefTransport implements PaymentMessageTransport {
        private final String transportId;
        private final Set<String> failRefs;
        private int calls;

        RetriableRefTransport(String transportId, Set<String> failRefs) {
            this.transportId = transportId;
            this.failRefs = failRefs;
        }

        @Override public String transport() { return transportId; }

        @Override
        public TransportResult send(Mt101Message message, Map<String, Object> configuration) {
            calls++;
            var ref = message.sequenceA() == null ? null : message.sequenceA().sendersReference();
            if (ref != null && failRefs.contains(ref)) {
                return TransportResult.transportFailure(1, 1L, "auth fail before dispatch (no bank call)");
            }
            return TransportResult.accepted("GW-" + ref, 1, 1L);
        }

        int calls() { return calls; }
    }

    /** Simula una conciliacion CONCURRENTE: al enviar un ref, mueve su intencion DISPATCHING a un terminal (como si
     *  otro flujo la resolviera mientras el send esta en vuelo), luego devuelve ACCEPTED. Ejercita el #9-equivalente. */
    private static final class IntentRacingTransport implements PaymentMessageTransport {
        private final String transportId;
        private final DataSource dataSource;
        private final Map<String, String> resolveTo;

        IntentRacingTransport(String transportId, DataSource dataSource, Map<String, String> resolveTo) {
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
                     var statement = connection.prepareStatement("update mt101_pay_dispatch_intent set status = ? "
                             + "where senders_reference = ? and status = 'DISPATCHING'")) {
                    statement.setString(1, terminal);
                    statement.setString(2, ref);
                    statement.executeUpdate();
                } catch (SQLException error) {
                    throw new IllegalStateException("racing intent update failed for " + ref, error);
                }
            }
            return TransportResult.accepted("GW-" + ref, 1, 1L);
        }
    }

    /** Captura las tramas de auditoria emitidas para verificar la trama append-only PAY_CONFLICT. */
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
