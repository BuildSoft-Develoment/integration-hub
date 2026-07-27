package com.integrationhub.vertical.swift.mt101.provider.task;

import com.integrationhub.vertical.swift.mt101.spi.PreDispatchTransportException;

import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.audit.AuditLevel;
import com.integrationhub.platform.spi.engine.RecordAuditEmitter;
import com.integrationhub.vertical.swift.mt101.spi.PaymentMessageTransport;
import com.integrationhub.vertical.swift.mt101.spi.TransportResult;
import com.integrationhub.vertical.swift.mt101.spi.Mt101Message;
import com.integrationhub.platform.spi.task.TaskContext;
import jakarta.enterprise.inject.Instance;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 008-mensajeria-pagos RF-004, T-009
 */
class Mt101PayTaskProviderTest {

    @Test
    void dispatchesAllMessagesAndPublishesSummary() {
        var transport = new StubTransport("REST", List.of(
                TransportResult.accepted("GW-1", 1, 100L),
                TransportResult.accepted("GW-2", 2, 200L)
        ));
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport));
        var context = contextWith(List.of(sampleMessage("PROC-1"), sampleMessage("PROC-2")));

        var result = provider.execute(context, Map.of(
                "transport", "REST",
                "input", Map.of("sourceTaskRef", "archive-mt101", "sourceOutput", "records"),
                "rest", Map.of("url", "https://test.example/mt101")
        ));

        assertTrue(result.success());
        assertEquals(2, result.outputs().get("dispatchCount"));
        assertEquals(2, result.outputs().get("sentCount"));
        assertEquals(2, result.outputs().get("acceptedCount"));
        assertEquals(0, result.outputs().get("rejectedCount"));
        assertEquals(1, result.outputs().get("retriedCount"));
        assertEquals(300L, result.outputs().get("totalDurationMs"));
        assertEquals(2, transport.callsReceived());

        @SuppressWarnings("unchecked")
        var records = (List<Map<String, Object>>) result.outputs().get("records");
        assertEquals("ACCEPTED", records.get(0).get("status"));
        assertEquals("GW-1", records.get(0).get("gatewayReference"));
        assertEquals("PROC-1", records.get(0).get("sendersReference"));
        assertEquals("GW-2", records.get(1).get("gatewayReference"));
    }

    @Test
    void rejectsNonOnceExecutionModeFailLoud() {
        // G1 (money-path): en batch/per-record el motor arma el TaskRunResult de 5 args y DESCARTA
        // needsReconciliation -> un pago UNCERTAIN cerraria como FAILED opaco en vez de NEEDS_RECONCILIATION.
        // Ademas el provider se reinvocaria por slice re-leyendo el fragment store completo. Se rechaza
        // fail-loud (la config puede venir de la API o de un seed, no solo del form).
        var transport = new StubTransport("REST", List.of(TransportResult.accepted("GW-1", 1, 100L)));
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport));
        var context = contextWith(List.of(sampleMessage("PROC-1")));

        for (var mode : List.of("per-record", "batch", "PER-RECORD")) {
            var config = Map.<String, Object>of(
                    "transport", "REST",
                    "executionMode", mode,
                    "input", Map.of("sourceTaskRef", "archive-mt101", "sourceOutput", "records"),
                    "rest", Map.of("url", "https://test.example/mt101"));
            var error = assertThrows(IllegalStateException.class, () -> provider.execute(context, config));
            assertTrue(error.getMessage().contains("executionMode 'once'"),
                    () -> "mensaje inesperado: " + error.getMessage());
        }
        assertEquals(0, transport.callsReceived(), "no debe salir NADA al banco si el modo es invalido");
    }

    @Test
    void acceptsOnceExecutionModeExplicitOrAbsent() {
        // 'once' explicito y ausente (default) son equivalentes y si despachan.
        for (var config : List.of(
                Map.<String, Object>of("transport", "REST", "executionMode", "once",
                        "input", Map.of("sourceTaskRef", "archive-mt101", "sourceOutput", "records"),
                        "rest", Map.of("url", "https://test.example/mt101")),
                Map.<String, Object>of("transport", "REST",
                        "input", Map.of("sourceTaskRef", "archive-mt101", "sourceOutput", "records"),
                        "rest", Map.of("url", "https://test.example/mt101")))) {
            var transport = new StubTransport("REST", List.of(TransportResult.accepted("GW-1", 1, 100L)));
            var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport));
            var result = provider.execute(contextWith(List.of(sampleMessage("PROC-1"))), config);
            assertTrue(result.success(), result.details());
            assertEquals(1, transport.callsReceived());
        }
    }

    @Test
    void emitsRecordLevelAuditPerDispatch() {
        // Fase 3: trazabilidad E2E por registro -> una trama RECORD por fragmento
        // despachado (recordId = :20:), emitida en lote fuera de la TX de negocio.
        var transport = new StubTransport("REST", List.of(
                TransportResult.accepted("GW-1", 1, 100L),
                TransportResult.accepted("GW-2", 1, 100L)
        ));
        var captured = new ArrayList<AuditEnvelope>();
        RecordAuditEmitter emitter = captured::addAll;
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport), null, null, emitter);
        var context = contextWith(List.of(sampleMessage("PROC-1"), sampleMessage("PROC-2")));

        provider.execute(context, Map.of(
                "transport", "REST",
                "input", Map.of("sourceTaskRef", "archive-mt101", "sourceOutput", "records"),
                "rest", Map.of("url", "https://test.example/mt101")
        ));

        assertEquals(2, captured.size());
        assertEquals(AuditLevel.RECORD, captured.get(0).level());
        assertEquals("RECORD_SENT", captured.get(0).stage());
        assertEquals("PROC-1", captured.get(0).recordId());
        assertEquals("PROC-2", captured.get(1).recordId());
    }

    @Test
    void capsRecordsSampleButKeepsExactCounts() {
        // H6: con maxRecordsInOutput=2 y 5 mensajes, el sample queda en 2 pero
        // los conteos (sentCount/acceptedCount) son exactos y recordsSampled=true.
        var transport = new StubTransport("REST", List.of(
                TransportResult.accepted("GW-1", 1, 10L),
                TransportResult.accepted("GW-2", 1, 10L),
                TransportResult.accepted("GW-3", 1, 10L),
                TransportResult.accepted("GW-4", 1, 10L),
                TransportResult.accepted("GW-5", 1, 10L)
        ));
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport));
        var context = contextWith(List.of(
                sampleMessage("P1"), sampleMessage("P2"), sampleMessage("P3"),
                sampleMessage("P4"), sampleMessage("P5")));

        var result = provider.execute(context, Map.of(
                "transport", "REST",
                "maxRecordsInOutput", 2,
                "input", Map.of("sourceTaskRef", "archive-mt101", "sourceOutput", "records"),
                "rest", Map.of("url", "https://test.example/mt101")));

        assertEquals(5, result.outputs().get("dispatchCount"), "conteo exacto");
        assertEquals(5, result.outputs().get("sentCount"), "enviados aceptados");
        assertEquals(5, result.outputs().get("acceptedCount"));
        assertEquals(Boolean.TRUE, result.outputs().get("recordsSampled"));
        @SuppressWarnings("unchecked")
        var records = (List<Map<String, Object>>) result.outputs().get("records");
        assertEquals(2, records.size(), "el sample respeta maxRecordsInOutput");
    }

    @Test
    void dispatchesMessagesEmbeddedInArchiveRecords() {
        var transport = new StubTransport("REST", List.of(
                TransportResult.accepted("GW-ARCHIVE", 1, 25L)
        ));
        var archiveStatusUpdater = new RecordingArchiveStatusUpdater();
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport), null, archiveStatusUpdater);
        var message = sampleMessage("PROC-ARCH");
        var context = contextWith(List.of(Map.of(
                "archiveId", 10L,
                "envelopeId", 20L,
                "connectionRef", "payments-db",
                "message", message
        )));

        var result = provider.execute(context, Map.of(
                "transport", "REST",
                "input", Map.of("sourceTaskRef", "archive-mt101", "sourceOutput", "records"),
                "rest", Map.of("url", "https://test.example/mt101")
        ));

        assertTrue(result.success());
        assertEquals(1, result.outputs().get("sentCount"));
        assertEquals(1, transport.callsReceived());
        @SuppressWarnings("unchecked")
        var records = (List<Map<String, Object>>) result.outputs().get("records");
        assertEquals(10L, records.get(0).get("archiveId"));
        assertEquals(20L, records.get(0).get("envelopeId"));
        assertEquals(1, archiveStatusUpdater.calls.size());
        assertEquals("payments-db", archiveStatusUpdater.calls.get(0).connectionRef());
        assertEquals("mt101_archive", archiveStatusUpdater.calls.get(0).table());
        assertEquals("SENT", archiveStatusUpdater.calls.get(0).status());
        assertEquals(List.of(10L), archiveStatusUpdater.calls.get(0).archiveIds());
    }

    @Test
    void reportsFailureWhenAnyMessageRejected() {
        var transport = new StubTransport("REST", List.of(
                TransportResult.accepted("GW-OK", 1, 50L),
                TransportResult.rejected(3, 500L, "HTTP 400: invalid amount")
        ));
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport));
        var context = contextWith(List.of(sampleMessage("PROC-OK"), sampleMessage("PROC-BAD")));

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "archive-mt101", "sourceOutput", "records")
        ));

        assertFalse(result.success());
        assertEquals(2, result.outputs().get("dispatchCount"));
        assertEquals(1, result.outputs().get("sentCount"));
        assertEquals(1, result.outputs().get("acceptedCount"));
        assertEquals(1, result.outputs().get("rejectedCount"));

        @SuppressWarnings("unchecked")
        var errors = (List<Map<String, Object>>) result.outputs().get("errors");
        assertEquals(1, errors.size());
        assertEquals("PROC-BAD", errors.get(0).get("sendersReference"));
        assertTrue(((String) errors.get(0).get("lastError")).contains("HTTP 400"));
    }

    @Test
    void treatsNotAcceptedWithoutErrorAsRejected() {
        var transport = new StubTransport("REST", List.of(
                // accepted=false, uncertain=false, retriable=false -> rechazo de negocio
                new TransportResult(false, false, false, null, 1, 25L, null)
        ));
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport));
        var context = contextWith(List.of(sampleMessage("PROC-NACK")));

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "archive-mt101", "sourceOutput", "records")
        ));

        assertFalse(result.success());
        assertEquals(1, result.outputs().get("dispatchCount"));
        assertEquals(0, result.outputs().get("sentCount"));
        assertEquals(0, result.outputs().get("acceptedCount"));
        assertEquals(1, result.outputs().get("rejectedCount"));
        @SuppressWarnings("unchecked")
        var records = (List<Map<String, Object>>) result.outputs().get("records");
        assertEquals("REJECTED", records.get(0).get("status"));
    }

    @Test
    void transportFailureIsInvalidatedNotRejected() {
        // D.2: un fallo de TRANSPORTE/AUTH (retriable) NO es un rechazo de negocio: se cuenta como INVALIDATED
        // (re-solicitable), no como REJECTED, para no llevar el correctivo a FAILED terminal. La tarea falla
        // (no salio nada), pero el conteo lo distingue.
        var transport = new StubTransport("REST", List.of(
                TransportResult.transportFailure(1, 10L, "connection refused")
        ));
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport));
        var context = contextWith(List.of(sampleMessage("PROC-TRANSPORT")));

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "archive-mt101", "sourceOutput", "records")
        ));

        assertFalse(result.success(), "un fallo de transporte no es exito (no salio nada)");
        assertEquals(0, result.outputs().get("rejectedCount"), "NO se cuenta como rechazo de negocio");
        assertEquals(1, result.outputs().get("invalidatedCount"), "se cuenta como INVALIDATED (re-solicitable)");
        @SuppressWarnings("unchecked")
        var records = (List<Map<String, Object>>) result.outputs().get("records");
        assertEquals("INVALIDATED", records.get(0).get("status"), "el fragmento queda INVALIDATED (re-solicitable)");
    }

    @Test
    void capturesUnexpectedTransportExceptionAsUncertain() {
        // P0 v26: una excepcion INESPERADA del transporte (no IllegalArgumentException de config) se
        // clasifica INCIERTO, nunca REJECTED reusable: no se puede demostrar que no salio al banco.
        var transport = new StubTransport("REST", null) {
            @Override
            public TransportResult send(Mt101Message message, Map<String, Object> configuration) {
                throw new IllegalStateException("connection dropped mid-send");
            }
        };
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport));
        var context = contextWith(List.of(sampleMessage("PROC-DNS")));

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "archive-mt101", "sourceOutput", "records")
        ));

        assertFalse(result.success());
        @SuppressWarnings("unchecked")
        var records = (List<Map<String, Object>>) result.outputs().get("uncertain");
        assertEquals("UNCERTAIN", records.get(0).get("status"));
        assertTrue(((String) records.get(0).get("lastError")).contains("unexpected transport error"));
    }

    @Test
    void capturesTypedPreDispatchConfigErrorAsInvalidated() {
        // v27 P1 + D.2: un error de pre-dispatch TIPADO (PreDispatchTransportException, antes de cualquier I/O)
        // es re-solicitable: el mensaje no salio al banco. Ya no se clasifica como REJECTED (rechazo de negocio,
        // que llevaria un correctivo a FAILED terminal) sino como INVALIDATED, re-solicitable tras corregir la config.
        var transport = new StubTransport("REST", null) {
            @Override
            public TransportResult send(Mt101Message message, Map<String, Object> configuration) {
                throw new com.integrationhub.vertical.swift.mt101.spi.PreDispatchTransportException(
                        "missing rest.url");
            }
        };
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport));
        var context = contextWith(List.of(sampleMessage("PROC-CFG")));

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "archive-mt101", "sourceOutput", "records")
        ));

        assertFalse(result.success());
        assertEquals(0, result.outputs().get("rejectedCount"), "un error de config no es rechazo de negocio");
        assertEquals(1, result.outputs().get("invalidatedCount"), "es INVALIDATED (re-solicitable)");
        @SuppressWarnings("unchecked")
        var records = (List<Map<String, Object>>) result.outputs().get("records");
        assertEquals("INVALIDATED", records.get(0).get("status"));
        assertTrue(((String) records.get(0).get("lastError")).contains("config error"));
    }

    @Test
    void capturesRawIllegalArgumentExceptionAsUncertainNotRejection() {
        // v27 P1: una IllegalArgumentException CRUDA (no tipada como pre-dispatch) NO se asume pre-I/O:
        // un transporte de terceros o un bug podria lanzarla tras iniciar la llamada. Regla bancaria: si
        // no se puede demostrar que no salio, es INCIERTA, nunca REJECTED reusable.
        var transport = new StubTransport("REST", null) {
            @Override
            public TransportResult send(Mt101Message message, Map<String, Object> configuration) {
                throw new IllegalArgumentException("ambiguous failure after remote call started");
            }
        };
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport));
        var context = contextWith(List.of(sampleMessage("PROC-AMB")));

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "archive-mt101", "sourceOutput", "records")
        ));

        assertFalse(result.success());
        @SuppressWarnings("unchecked")
        var uncertain = (List<Map<String, Object>>) result.outputs().get("uncertain");
        assertEquals("UNCERTAIN", uncertain.get(0).get("status"));
    }

    @Test
    void classifiesUncertainTransportResultSeparatelyFromRejected() {
        // Timeout/conexion tras enviar: el transporte devuelve UNCERTAIN (no rechazo).
        var transport = new StubTransport("REST", List.of(
                TransportResult.uncertain(2, 50L, "timeout: read timed out")));
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport));
        var context = contextWith(List.of(sampleMessage("PROC-UNC")));

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "archive-mt101", "sourceOutput", "records")
        ));

        assertFalse(result.success());
        assertEquals(1, result.outputs().get("uncertainCount"));
        assertEquals(0, result.outputs().get("rejectedCount"));
        assertEquals(0, result.outputs().get("acceptedCount"));
        @SuppressWarnings("unchecked")
        var errors = (List<Map<String, Object>>) result.outputs().get("errors");
        assertTrue(errors.isEmpty(), "el incierto NO se reporta como rechazo");
        @SuppressWarnings("unchecked")
        var uncertain = (List<Map<String, Object>>) result.outputs().get("uncertain");
        assertEquals(1, uncertain.size());
        assertEquals("UNCERTAIN", uncertain.get(0).get("status"));
    }

    @Test
    void skipsWhenNoMessages() {
        var transport = new StubTransport("REST", List.of());
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport));
        var context = new TaskContext(1L, 1L);
        context.attributes().put("taskOutputs", Map.of());

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "archive-mt101", "sourceOutput", "records")
        ));

        assertTrue(result.success());
        assertTrue(result.details().toLowerCase().contains("skipped"));
        assertEquals(0, transport.callsReceived());
    }

    @Test
    void rejectsUnsupportedTransport() {
        var transport = new StubTransport("SFTP", List.of());
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport));
        var context = contextWith(List.of(sampleMessage("PROC-1")));

        var error = assertThrows(IllegalArgumentException.class, () -> provider.execute(context, Map.of(
                "transport", "REST",
                "input", Map.of("sourceTaskRef", "archive-mt101", "sourceOutput", "records")
        )));
        assertTrue(error.getMessage().contains("REST"));
        assertTrue(error.getMessage().contains("Available: SFTP"));
    }

    @Test
    void defaultTransportIsRest() {
        var transport = new StubTransport("REST", List.of(
                TransportResult.accepted("X", 1, 1L)
        ));
        var provider = new Mt101PayTaskProvider(new InstanceOfOne<>(transport));
        var context = contextWith(List.of(sampleMessage("PROC-DEFAULT")));

        // No transport explicito en config: debe usar REST por defecto.
        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "archive-mt101", "sourceOutput", "records")
        ));

        assertTrue(result.success());
        assertEquals("REST", result.outputs().get("transport"));
    }

    // --- helpers ---

    private TaskContext contextWith(List<?> messages) {
        var context = new TaskContext(1L, 1L);
        context.attributes().put("taskOutputs", Map.of("archive-mt101.records", messages));
        return context;
    }

    private Mt101Message sampleMessage(String sendersReference) {
        return new Mt101Message(
                new Mt101Message.Envelope("SGOBFRPPAXXX", "BCPLPEPLXXXX", "uetr-" + sendersReference, "N"),
                new Mt101Message.SequenceA(sendersReference, null, 1, 1, LocalDate.of(2026, 6, 9),
                        null, null, null, null),
                List.of(new Mt101Message.Transaction(
                        1, "TX-1", null, null,
                        new Mt101Message.Amount("PEN", new BigDecimal("100")),
                        null, null, null, null,
                        new Mt101Message.Party("", "ACC", null, List.of()),
                        null, null, null, "OUR", null, null)),
                new Mt101Message.ControlTotals(1, Map.of("PEN", new BigDecimal("100"))),
                "{\"sendersReference\":\"" + sendersReference + "\"}",
                "JSON");
    }

    /** Transporte stub que devuelve resultados pre-cargados en orden. */
    private static class StubTransport implements PaymentMessageTransport {
        private final String transportId;
        private final List<TransportResult> results;
        private final List<Mt101Message> received = new ArrayList<>();

        StubTransport(String transportId, List<TransportResult> results) {
            this.transportId = transportId;
            this.results = results;
        }

        @Override public String transport() { return transportId; }

        @Override
        public TransportResult send(Mt101Message message, Map<String, Object> configuration) {
            received.add(message);
            if (results == null || received.size() > results.size()) {
                return TransportResult.accepted("OK", 1, 1L);
            }
            return results.get(received.size() - 1);
        }

        int callsReceived() {
            return received.size();
        }
    }

    private static final class RecordingArchiveStatusUpdater extends Mt101ArchiveStatusUpdater {
        private final List<Call> calls = new ArrayList<>();

        private RecordingArchiveStatusUpdater() {
            super((javax.sql.DataSource) null);
        }

        @Override
        public void updateStatusByArchiveIds(String connectionRef,
                                             String table,
                                             Collection<Long> archiveIds,
                                             String status) {
            calls.add(new Call(connectionRef, table, List.copyOf(archiveIds), status));
        }
    }

    private record Call(String connectionRef, String table, List<Long> archiveIds, String status) {
    }

    private static final class InstanceOfOne<T> implements Instance<T> {
        private final T instance;
        InstanceOfOne(T instance) { this.instance = instance; }
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
