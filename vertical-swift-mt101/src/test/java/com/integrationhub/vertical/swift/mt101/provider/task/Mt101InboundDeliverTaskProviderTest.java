package com.integrationhub.vertical.swift.mt101.provider.task;

import com.integrationhub.vertical.swift.mt101.provider.task.Mt101InboundDeliverTaskProvider;

import com.integrationhub.vertical.swift.mt101.provider.InboundDeliveryTransport;

import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.inject.Instance;
import org.junit.jupiter.api.Test;

import java.lang.annotation.Annotation;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Cubre el despacho del provider MT101_INBOUND_DELIVER: resuelve el {@link InboundDeliveryTransport} que matchea
 * el {@code transport} de la config via {@code Instance<>} (default DB) y delega; skip cuando no hay fuente
 * inbound; y fail-loud ante un transporte desconocido. La logica de entrega de cada transporte se prueba en su
 * propio test (p.ej. {@link RestInboundDeliveryTransportTest}); aca solo el ruteo.
 */
class Mt101InboundDeliverTaskProviderTest {

    private TaskContext contextWithInbound() {
        var context = new TaskContext(100L, 30L);
        context.attributes().put("taskOutputs", Map.of(
                "src.records", Map.of("inboundSetId", "INB-1", "connectionRef", "conn")));
        return context;
    }

    private Map<String, Object> config(String transport) {
        return Map.of(
                "transport", transport,
                "input", Map.of("sourceTaskRef", "src", "sourceOutput", "records"));
    }

    @Test
    void dispatchesToTransportMatchingConfig() {
        var db = new RecordingTransport("DB");
        var rest = new RecordingTransport("REST");
        var provider = new Mt101InboundDeliverTaskProvider(new ListInstance<>(List.of(db, rest)));

        var result = provider.execute(contextWithInbound(), config("REST"));

        assertTrue(result.success());
        assertEquals(1, rest.calls, "el transporte REST debio recibir la entrega");
        assertEquals(0, db.calls, "el transporte DB no debio ser invocado");
    }

    @Test
    void defaultsToDbTransportWhenUnset() {
        var db = new RecordingTransport("DB");
        var rest = new RecordingTransport("REST");
        var provider = new Mt101InboundDeliverTaskProvider(new ListInstance<>(List.of(db, rest)));

        var configWithoutTransport = Map.<String, Object>of(
                "input", Map.of("sourceTaskRef", "src", "sourceOutput", "records"));
        provider.execute(contextWithInbound(), configWithoutTransport);

        assertEquals(1, db.calls, "sin transport explicito debe usar DB por default");
        assertEquals(0, rest.calls);
    }

    @Test
    void skipsWhenNoInboundSource() {
        var db = new RecordingTransport("DB");
        var provider = new Mt101InboundDeliverTaskProvider(new ListInstance<>(List.of(db)));
        // Sin taskOutputs -> inboundSource vacio -> skip (no despacha).
        var result = provider.execute(new TaskContext(1L, 1L), config("DB"));
        assertTrue(result.success());
        assertTrue(result.details().contains("skipped"));
        assertEquals(0, db.calls, "el skip no debe invocar ningun transporte");
    }

    @Test
    void failsLoudOnUnknownTransport() {
        var db = new RecordingTransport("DB");
        var provider = new Mt101InboundDeliverTaskProvider(new ListInstance<>(List.of(db)));
        var error = assertThrows(IllegalArgumentException.class,
                () -> provider.execute(contextWithInbound(), config("KAFKA")));
        assertTrue(error.getMessage().contains("Unsupported"), () -> "mensaje inesperado: " + error.getMessage());
        assertTrue(error.getMessage().contains("KAFKA"));
    }

    /** Transporte de prueba: registra que fue invocado y devuelve un exito trivial. */
    private static final class RecordingTransport implements InboundDeliveryTransport {
        private final String id;
        private int calls;

        RecordingTransport(String id) {
            this.id = id;
        }

        @Override
        public String transport() {
            return id;
        }

        @Override
        public TaskResult deliver(TaskContext context, Map<String, Object> configuration,
                                  Map<String, Object> inboundSource, int pageSize) {
            calls++;
            return TaskResult.success("delivered via " + id);
        }
    }

    /** Instance CDI minima sobre una lista, para no arrancar el contenedor en el unit test. */
    private static final class ListInstance<T> implements Instance<T> {
        private final List<T> items;

        ListInstance(List<T> items) {
            this.items = new ArrayList<>(items);
        }

        @Override public Instance<T> select(Annotation... q) { return this; }
        @Override public <U extends T> Instance<U> select(Class<U> s, Annotation... q) { throw new UnsupportedOperationException(); }
        @Override public <U extends T> Instance<U> select(jakarta.enterprise.util.TypeLiteral<U> s, Annotation... q) { throw new UnsupportedOperationException(); }
        @Override public boolean isUnsatisfied() { return items.isEmpty(); }
        @Override public boolean isAmbiguous() { return items.size() > 1; }
        @Override public void destroy(T inst) {}
        @Override public Handle<T> getHandle() { throw new UnsupportedOperationException(); }
        @Override public Iterable<? extends Handle<T>> handles() { throw new UnsupportedOperationException(); }
        @Override public Iterator<T> iterator() { return items.iterator(); }
        @Override public T get() {
            if (items.isEmpty()) {
                throw new IllegalStateException("No items");
            }
            return items.get(0);
        }
        @Override public Stream<T> stream() { return StreamSupport.stream(spliterator(), false); }
    }
}
