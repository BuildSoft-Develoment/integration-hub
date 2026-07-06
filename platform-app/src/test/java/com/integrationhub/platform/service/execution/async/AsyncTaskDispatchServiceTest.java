package com.integrationhub.platform.service.execution.async;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.service.messaging.AsyncAvailabilityService;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;

/**
 * Lado productor del despacho async (ADR-015 Etapa 3), probado con el {@link TaskDispatchPlanner}
 * real. Verifica el gate, la decisión sync/async, la idempotencyKey determinista, el contrato del
 * payload (= JSON de la configuration) y el fail-loud §9 (backbone que no entrega). <b>No encola</b>:
 * el motor persiste el envelope en el outbox atómicamente con la suspensión.
 */
class AsyncTaskDispatchServiceTest {

    private final ObjectMapper mapper = new ObjectMapper();
    private final TaskDispatchPlanner planner = new TaskDispatchPlanner();

    /** Entorno entregable por defecto (sin gaps estructurales): aísla la decisión sync/async del gate §9. */
    private AsyncTaskDispatchService service(boolean enabled) {
        return service(enabled, List.of());
    }

    /** Permite inyectar gaps del productor (§9) para probar el fail-loud sin levantar el backbone real. */
    private AsyncTaskDispatchService service(boolean enabled, List<String> dispatchGaps) {
        var availability = mock(AsyncAvailabilityService.class);
        lenient().when(availability.producerDispatchGaps()).thenReturn(dispatchGaps);
        return new AsyncTaskDispatchService(planner, mapper, availability, enabled);
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
        var result = service(true).prepare(1L, 2L, "REST_CALL", Map.of("async", true, "asyncTransport", "rabbitmq"));

        assertEquals("RABBITMQ", result.get().transport());
    }

    @Test
    void asyncWithoutIdentifiersThrowsInsteadOfSilentSync() {
        assertThrows(IllegalStateException.class,
                () -> service(true).prepare(null, 2L, "DB_WRITE", Map.of("async", true)));
    }

    @Test
    void asyncButProducerCannotDispatchFailsLoudInsteadOfSilentSuspend() {
        // §9: async ON + relay apagado → prepare LANZA (no suspende una tarea cuyo outbox nadie drenaría,
        // ni el recovery). El mensaje nombra el gap para el operador.
        var ex = assertThrows(IllegalStateException.class,
                () -> service(true, List.of("relay outbox→broker apagado (tasks.dispatch.enabled)"))
                        .prepare(1L, 2L, "DB_WRITE", Map.of("async", true)));
        assertTrue(ex.getMessage().contains("no puede despachar"), ex.getMessage());
        assertTrue(ex.getMessage().contains("relay"), ex.getMessage());
    }

    @Test
    void asyncDispatchableEnvironmentDispatchesNormally() {
        // Sin gaps del productor (relay ON + broker) → despacha, aunque haya un blip de liveness transitoria
        // o el consumer esté aguas abajo: producerDispatchGaps NO mira consumer ni *Live → el outbox aguanta.
        var result = service(true, List.of()).prepare(1L, 2L, "DB_WRITE", Map.of("async", true));
        assertTrue(result.isPresent(), "entorno despachable no debe bloquear el despacho async");
    }

    @Test
    void producerGapNotEvaluatedWhenTaskIsSync() {
        // La verificación §9 solo aplica a tareas async: una tarea síncrona corre igual aunque el productor
        // no pueda despachar (nunca lo iba a usar). El stub lenient permite que producerDispatchGaps ni se llame.
        assertTrue(service(true, List.of("sin broker registrado"))
                .prepare(1L, 2L, "DB_WRITE", Map.of("async", false)).isEmpty());
    }
}
