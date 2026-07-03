package com.integrationhub.platform.service.execution.async;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.service.TaskProviderRegistry;
import com.integrationhub.platform.service.execution.ProcessExecutionResumeService;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Núcleo puro del consumer async (ADR-015), probado con un fake de {@link TaskInboxStore} (para
 * afirmar qué se registró) y un {@link TaskProviderRegistry} mockeado. Sin broker ni DB.
 */
class AsyncTaskConsumerTest {

    private final ObjectMapper mapper = new ObjectMapper();
    private RecordingInbox inbox;
    private TaskProviderRegistry registry;
    private RecordingCompletion completion;
    private AsyncTaskConsumer consumer;

    @BeforeEach
    void setUp() {
        inbox = new RecordingInbox();
        registry = mock(TaskProviderRegistry.class);
        completion = new RecordingCompletion();
        consumer = new AsyncTaskConsumer(inbox, registry, completion, mapper);
    }

    /** payload de wire = envelope entero (patrón audit/sidecar); config = envelope.payload(). */
    private String wire(String taskType, String idem, String configJson) {
        var envelope = new AsyncTaskEnvelope("exec-1", 1L, 2L, taskType, "KAFKA", idem, 1,
                configJson, Map.of("traceId", "exec-1"));
        return AsyncTaskMessageCodec.toMessage(envelope, mapper).payload();
    }

    @Test
    void successExecutesProviderAndRecordsProcessedWithOutputs() {
        var captured = new CapturingProvider(TaskResult.success("ok", Map.of("rows", 3)));
        when(registry.resolve("DB_WRITE")).thenReturn(captured);

        var result = consumer.consume(wire("DB_WRITE", "idem-ok", "{\"limit\":10}"), "KAFKA", "tasks.db_write");

        assertEquals(AsyncTaskConsumer.ConsumeResult.PROCESSED, result);
        // El provider recibió la configuration decodificada desde envelope.payload() y el contexto.
        assertEquals(10, captured.configuration.get("limit"));
        assertEquals(1L, captured.context.processExecutionId());
        assertEquals(2L, captured.context.taskDefinitionId());
        var row = inbox.single();
        assertEquals("PROCESSED", row.status);
        assertEquals("idem-ok", row.idempotencyKey);
        assertTrue(row.outputsJson.contains("\"rows\":3"));
        // Continuación: se aplicó el resultado a la tarea suspendida (exec 1, task 2 del wire()).
        assertEquals(1, completion.calls.size());
        assertEquals(1L, completion.calls.get(0).processExecutionId());
        assertEquals(2L, completion.calls.get(0).taskDefinitionId());
        assertTrue(completion.calls.get(0).result().success());
    }

    @Test
    void duplicateSkipsProviderExecution() {
        inbox.processedKeys.add("idem-dup");

        var result = consumer.consume(wire("DB_WRITE", "idem-dup", "{}"), "KAFKA", "tasks.db_write");

        assertEquals(AsyncTaskConsumer.ConsumeResult.DUPLICATE, result);
        verify(registry, never()).resolve("DB_WRITE");
        assertTrue(inbox.records.isEmpty(), "un duplicado no registra nada nuevo");
        assertTrue(completion.calls.isEmpty(), "un duplicado no re-completa el proceso");
    }

    @Test
    void unknownTaskTypeIsDeadLettered() {
        when(registry.resolve("NOPE")).thenThrow(new IllegalArgumentException("Unsupported task provider: NOPE"));

        var result = consumer.consume(wire("NOPE", "idem-dead", "{}"), "KAFKA", "tasks.nope");

        assertEquals(AsyncTaskConsumer.ConsumeResult.DEAD, result);
        assertEquals("DEAD", inbox.single().status);
    }

    @Test
    void businessFailureIsRecordedAndAcked() {
        when(registry.resolve("DB_WRITE")).thenReturn(new CapturingProvider(TaskResult.failure("saldo insuficiente")));

        var result = consumer.consume(wire("DB_WRITE", "idem-fail", "{}"), "KAFKA", "tasks.db_write");

        assertEquals(AsyncTaskConsumer.ConsumeResult.FAILED, result);
        var row = inbox.single();
        assertEquals("FAILED", row.status);
        assertEquals("saldo insuficiente", row.details);
        // Un fallo de negocio también se propaga a la continuación (falla el proceso suspendido).
        assertEquals(1, completion.calls.size());
        assertFalse(completion.calls.get(0).result().success());
    }

    @Test
    void transientExecuteFailurePropagatesForRedeliveryAndRecordsNothing() {
        when(registry.resolve("DB_WRITE")).thenReturn(new ThrowingProvider());

        assertThrows(RuntimeException.class,
                () -> consumer.consume(wire("DB_WRITE", "idem-transient", "{}"), "KAFKA", "tasks.db_write"));

        assertTrue(inbox.records.isEmpty(), "un fallo transitorio no se marca como terminal (permite reentrega)");
        assertTrue(completion.calls.isEmpty(), "un fallo transitorio no completa el proceso");
    }

    @Test
    void suspendedInsideConsumerIsDeadUntilContinuationLands() {
        when(registry.resolve("DB_WRITE"))
                .thenReturn(new CapturingProvider(TaskResult.suspended("espera callback", Map.of("k", "v"))));

        var result = consumer.consume(wire("DB_WRITE", "idem-susp", "{}"), "KAFKA", "tasks.db_write");

        assertEquals(AsyncTaskConsumer.ConsumeResult.DEAD, result);
        assertEquals("DEAD", inbox.single().status);
        assertTrue(completion.calls.isEmpty(), "un resultado suspended no completa el proceso");
    }

    @Test
    void poisonPayloadIsRecordedInDlqAndAcked() {
        var result = consumer.consume("no-soy-json-de-envelope", "KAFKA", "tasks.db_write");

        assertEquals(AsyncTaskConsumer.ConsumeResult.POISON, result);
        var row = inbox.single();
        assertEquals("POISON", row.status);
        assertEquals("no-soy-json-de-envelope", row.rawPayload);
    }

    @Test
    void malformedConfigurationIsDeadLettered() {
        when(registry.resolve("DB_WRITE")).thenReturn(new CapturingProvider(TaskResult.success("ok")));
        // envelope válido, pero envelope.payload() no es un objeto JSON → config ilegible.
        var result = consumer.consume(wire("DB_WRITE", "idem-badcfg", "no-es-json"), "KAFKA", "tasks.db_write");

        assertEquals(AsyncTaskConsumer.ConsumeResult.DEAD, result);
        assertEquals("DEAD", inbox.single().status);
    }

    // --- fakes -----------------------------------------------------------------

    private static final class CapturingProvider implements TaskProvider {
        private final TaskResult result;
        TaskContext context;
        Map<String, Object> configuration;

        CapturingProvider(TaskResult result) {
            this.result = result;
        }

        @Override
        public String type() {
            return "DB_WRITE";
        }

        @Override
        public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
            this.context = context;
            this.configuration = configuration;
            return result;
        }
    }

    private static final class ThrowingProvider implements TaskProvider {
        @Override
        public String type() {
            return "DB_WRITE";
        }

        @Override
        public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
            throw new IllegalStateException("conexión a BD caída");
        }
    }

    /** Fake del puerto que captura lo registrado (sin DB). */
    private static final class RecordingInbox implements TaskInboxStore {
        final List<Recorded> records = new ArrayList<>();
        final List<String> processedKeys = new ArrayList<>();

        @Override
        public boolean isProcessed(String idempotencyKey) {
            return processedKeys.contains(idempotencyKey);
        }

        @Override
        public void recordProcessed(AsyncTaskEnvelope e, String outputsJson, String details) {
            records.add(new Recorded("PROCESSED", e.idempotencyKey(), outputsJson, details, null, null));
        }

        @Override
        public void recordFailed(AsyncTaskEnvelope e, String details) {
            records.add(new Recorded("FAILED", e.idempotencyKey(), null, details, null, null));
        }

        @Override
        public void recordDead(AsyncTaskEnvelope e, String error) {
            records.add(new Recorded("DEAD", e.idempotencyKey(), null, null, error, null));
        }

        @Override
        public void recordPoison(String rawPayload, String brokerType, String topic, String error) {
            records.add(new Recorded("POISON", null, null, null, error, rawPayload));
        }

        Recorded single() {
            assertEquals(1, records.size(), "se esperaba exactamente un registro");
            return records.get(0);
        }
    }

    private record Recorded(String status, String idempotencyKey, String outputsJson,
                            String details, String error, String rawPayload) {
    }

    /** Fake del puerto de completación que captura las invocaciones (sin motor). */
    private static final class RecordingCompletion implements AsyncTaskCompletion {
        final List<Call> calls = new ArrayList<>();

        @Override
        public ProcessExecutionResumeService.ResumeOutcome completeFromExternalResult(
                Long processExecutionId, Long taskDefinitionId, TaskResult result) {
            calls.add(new Call(processExecutionId, taskDefinitionId, result));
            return new ProcessExecutionResumeService.ResumeOutcome(
                    ProcessExecutionResumeService.Outcome.COMPLETED, null, true, "ok");
        }

        record Call(Long processExecutionId, Long taskDefinitionId, TaskResult result) {
        }
    }
}
