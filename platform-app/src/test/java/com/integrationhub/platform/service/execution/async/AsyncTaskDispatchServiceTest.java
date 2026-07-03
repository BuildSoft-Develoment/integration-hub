package com.integrationhub.platform.service.execution.async;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Lado productor del despacho async (ADR-015 Etapa 3), probado con el {@link TaskDispatchPlanner}
 * real. Verifica el gate, la decisión sync/async, la idempotencyKey determinista y el contrato del
 * payload (= JSON de la configuration). <b>No encola</b>: el motor persiste el envelope en el outbox
 * atómicamente con la suspensión, así que aquí solo se valida la construcción.
 */
class AsyncTaskDispatchServiceTest {

    private final ObjectMapper mapper = new ObjectMapper();
    private final TaskDispatchPlanner planner = new TaskDispatchPlanner();

    private AsyncTaskDispatchService service(boolean enabled) {
        return new AsyncTaskDispatchService(planner, mapper, enabled);
    }

    @Test
    void gateOffAlwaysRunsSyncEvenIfConfigIsAsync() {
        assertTrue(service(false).prepare(1L, 2L, "DB_WRITE", Map.of("async", true)).isEmpty(),
                "gate apagado → síncrono");
    }

    @Test
    void syncConfigRunsSyncWhenGateOn() {
        assertTrue(service(true).prepare(1L, 2L, "DB_WRITE", Map.of("async", false)).isEmpty());
    }

    @Test
    void asyncConfigBuildsEnvelope() {
        var result = service(true).prepare(42L, 7L, "DB_WRITE", Map.of("async", true, "limit", 10));

        assertTrue(result.isPresent());
        var envelope = result.get();
        assertEquals("DB_WRITE", envelope.taskType());
        assertEquals(42L, envelope.processExecutionId());
        assertEquals(7L, envelope.taskDefinitionId());
        assertEquals("KAFKA", envelope.transport(), "default transport");
        assertEquals("exec-42", envelope.traceId());
        // Contrato: el payload es el JSON de la configuration que espera TaskProvider.execute.
        assertTrue(envelope.payload().contains("\"limit\":10"));
    }

    @Test
    void idempotencyKeyIsDeterministicPerExecutionAndTask() {
        var a = service(true).prepare(42L, 7L, "DB_WRITE", Map.of("async", true));
        var b = service(true).prepare(42L, 7L, "DB_WRITE", Map.of("async", true));

        assertEquals(a.get().idempotencyKey(), b.get().idempotencyKey(), "misma ejecución/tarea → misma clave");
    }

    @Test
    void transportOverrideIsHonoredAndUppercased() {
        var result = service(true).prepare(1L, 2L, "REST_CALL", Map.of("async", true, "transport", "rabbitmq"));

        assertEquals("RABBITMQ", result.get().transport());
    }

    @Test
    void asyncWithoutIdentifiersThrowsInsteadOfSilentSync() {
        assertThrows(IllegalStateException.class,
                () -> service(true).prepare(null, 2L, "DB_WRITE", Map.of("async", true)));
    }
}
