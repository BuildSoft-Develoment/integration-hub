package com.integrationhub.platform.service.execution.async;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Lado productor del despacho async (ADR-015 Etapa 3), probado con un fake de {@link TaskOutboxStore}
 * y el {@link TaskDispatchPlanner} real. Verifica el gate, la decisión sync/async, la idempotencyKey
 * determinista y el contrato del payload (= JSON de la configuration).
 */
class AsyncTaskDispatchServiceTest {

    private final ObjectMapper mapper = new ObjectMapper();
    private final TaskDispatchPlanner planner = new TaskDispatchPlanner();
    private final CapturingOutbox outbox = new CapturingOutbox();

    private AsyncTaskDispatchService service(boolean enabled) {
        return new AsyncTaskDispatchService(planner, outbox, mapper, enabled);
    }

    @Test
    void gateOffAlwaysRunsSyncEvenIfConfigIsAsync() {
        var result = service(false).dispatch(1L, 2L, "DB_WRITE", Map.of("async", true));

        assertTrue(result.isEmpty(), "gate apagado → síncrono");
        assertTrue(outbox.enqueued.isEmpty(), "nada se encola con el gate apagado");
    }

    @Test
    void syncConfigRunsSyncWhenGateOn() {
        var result = service(true).dispatch(1L, 2L, "DB_WRITE", Map.of("async", false));

        assertTrue(result.isEmpty());
        assertTrue(outbox.enqueued.isEmpty());
    }

    @Test
    void asyncConfigEnqueuesEnvelopeAndReturnsSuspension() {
        var result = service(true).dispatch(42L, 7L, "DB_WRITE", Map.of("async", true, "limit", 10));

        assertTrue(result.isPresent());
        assertEquals("KAFKA", result.get().transport(), "default transport");
        assertEquals(1, outbox.enqueued.size());

        var envelope = outbox.enqueued.get(0);
        assertEquals("DB_WRITE", envelope.taskType());
        assertEquals(42L, envelope.processExecutionId());
        assertEquals(7L, envelope.taskDefinitionId());
        assertEquals("KAFKA", envelope.transport());
        assertEquals("exec-42", envelope.traceId());
        assertEquals(result.get().idempotencyKey(), envelope.idempotencyKey());
        // Contrato: el payload es el JSON de la configuration que espera TaskProvider.execute.
        assertTrue(envelope.payload().contains("\"limit\":10"));
    }

    @Test
    void idempotencyKeyIsDeterministicPerExecutionAndTask() {
        var a = service(true).dispatch(42L, 7L, "DB_WRITE", Map.of("async", true));
        var b = service(true).dispatch(42L, 7L, "DB_WRITE", Map.of("async", true));

        assertEquals(a.get().idempotencyKey(), b.get().idempotencyKey(), "misma ejecución/tarea → misma clave");
    }

    @Test
    void transportOverrideIsHonoredAndUppercased() {
        var result = service(true).dispatch(1L, 2L, "REST_CALL", Map.of("async", true, "transport", "rabbitmq"));

        assertEquals("RABBITMQ", result.get().transport());
        assertEquals("RABBITMQ", outbox.enqueued.get(0).transport());
    }

    @Test
    void asyncWithoutIdentifiersThrowsInsteadOfSilentSync() {
        assertThrows(IllegalStateException.class,
                () -> service(true).dispatch(null, 2L, "DB_WRITE", Map.of("async", true)));
        assertTrue(outbox.enqueued.isEmpty());
    }

    /** Fake del puerto que captura lo encolado; el resto de operaciones no aplican aquí. */
    private static final class CapturingOutbox implements TaskOutboxStore {
        final List<AsyncTaskEnvelope> enqueued = new ArrayList<>();

        @Override
        public void enqueue(AsyncTaskEnvelope envelope) {
            enqueued.add(envelope);
        }

        @Override
        public List<PendingTask> claimPending(int batchSize) {
            return List.of();
        }

        @Override
        public void markSent(long outboxId, String reference) {
        }

        @Override
        public void markRetry(long outboxId, int nextAttempt, long backoffMillis) {
        }

        @Override
        public void markDead(long outboxId, String error) {
        }
    }
}
