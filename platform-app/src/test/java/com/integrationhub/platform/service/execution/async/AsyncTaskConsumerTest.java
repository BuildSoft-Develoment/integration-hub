package com.integrationhub.platform.service.execution.async;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.repository.TaskAsyncDispatchRepository.SliceProgress;
import com.integrationhub.platform.service.TaskProviderRegistry;
import com.integrationhub.platform.service.execution.ProcessExecutionResumeService;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.task.BatchTaskProvider;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import com.integrationhub.platform.task.AsyncTaskEnvelope;

import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
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
    private SliceGatherService gather;
    private AsyncPageChainService pageChain;
    private AsyncTaskConsumer consumer;

    @BeforeEach
    void setUp() {
        inbox = new RecordingInbox();
        registry = mock(TaskProviderRegistry.class);
        completion = new RecordingCompletion();
        gather = mock(SliceGatherService.class);
        pageChain = mock(AsyncPageChainService.class);
        // maxAttempts=3, backoff=0 (sin sleep en tests).
        consumer = new AsyncTaskConsumer(inbox, registry, completion, gather, mapper, pageChain, 3, 0);
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

    // (Nivel 3) El caso "suspended en el consumer" ya NO va a DEAD: se re-suspende. Ver
    // suspendedResultReSuspendsInsteadOfDeadLettering más abajo.

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

    // --- retry in-app del transitorio -----------------------------------------

    @Test
    void retriesTransientFailureThenSucceeds() {
        // Falla 2 veces (transitorio) y a la 3ra completa: consumeWithRetries lo absorbe (maxAttempts=3).
        var provider = new FlakyProvider(2, TaskResult.success("ok"));
        when(registry.resolve("DB_WRITE")).thenReturn(provider);

        var result = consumer.consumeWithRetries(wire("DB_WRITE", "idem-flaky", "{}"), "KAFKA", "tasks.db_write");

        assertEquals(AsyncTaskConsumer.ConsumeResult.PROCESSED, result);
        assertEquals(3, provider.calls, "reintentó hasta que la BD 'volvió'");
        assertEquals("PROCESSED", inbox.single().status);
    }

    @Test
    void propagatesAfterExhaustingInAppRetries() {
        // Transitorio persistente: tras agotar los intentos in-app propaga (el adaptador hará nack).
        when(registry.resolve("DB_WRITE")).thenReturn(new ThrowingProvider());

        assertThrows(RuntimeException.class,
                () -> consumer.consumeWithRetries(wire("DB_WRITE", "idem-persist", "{}"), "KAFKA", "tasks.db_write"));
        assertTrue(inbox.records.isEmpty(), "un transitorio persistente no se marca terminal (permite redelivery)");
    }

    // --- Nivel 3: re-suspensión de suspendibles en once -----------------------

    @Test
    void suspendedResultReSuspendsInsteadOfDeadLettering() {
        var provider = new SuspendingProvider(TaskResult.suspended("esperando callback", Map.of("attempt", 1)));
        when(registry.resolve("MT101_STATUS")).thenReturn(provider);

        var result = consumer.consume(wire("MT101_STATUS", "idem-susp", "{}"), "KAFKA", "tasks.mt101_status");

        // El provider suspendió → el motor re-suspende (RE_SUSPENDED) y el consumer marca PROCESSED
        // (el offload cumplió), NO DEAD.
        assertEquals(AsyncTaskConsumer.ConsumeResult.PROCESSED, result);
        assertEquals("PROCESSED", inbox.single().status);
        assertEquals(1, completion.calls.size());
        assertTrue(completion.calls.get(0).result().suspended(), "se pasó el resultado suspended a la completación");
    }

    @Test
    void onceRehydratesSuspendedContextForTheProvider() {
        var provider = new CapturingProvider(TaskResult.success("ok"));
        when(registry.resolve("MT101_STATUS")).thenReturn(provider);
        completion.suspendedContext = new AsyncTaskCompletion.SuspendedContext(
                Map.of("task-1.paymentRef", "PMT-9"), Map.of("env", "prod"));

        consumer.consume(wire("MT101_STATUS", "idem-ctx", "{}"), "KAFKA", "tasks.mt101_status");

        assertEquals("PMT-9",
                ((Map<?, ?>) provider.context.attributes().get("taskOutputs")).get("task-1.paymentRef"),
                "el contexto capturado al suspender se rehidrató para el provider");
        assertEquals("prod", ((Map<?, ?>) provider.context.attributes().get("executionVariables")).get("env"));
    }

    // --- scatter por table-streaming (page-chain) ------------------------------

    private String pageWire(String taskType, int pageIndex) throws Exception {
        var item = AsyncPageWorkItem.seed("t", null, "id", Map.of(), 2,
                Map.of(), Map.of(), Map.of(), Map.of());
        var envelope = new AsyncTaskEnvelope("exec-1", 1L, 2L, taskType, "KAFKA",
                TaskIdempotency.key(1L, 2L, "page-" + pageIndex), 1, mapper.writeValueAsString(item),
                Map.of("kind", "PAGE", "pageIndex", String.valueOf(pageIndex)));
        return AsyncTaskMessageCodec.toMessage(envelope, mapper).payload();
    }

    @Test
    void pageChainLastPageSealsAndResumes() throws Exception {
        when(registry.resolve("REST_CALL")).thenReturn(new CapturingBatchProvider(TaskResult.success("ok")));
        when(pageChain.readAndChain(any(), any())).thenReturn(new AsyncPageChainService.Page(
                java.util.List.of(new ReadRecord(Map.of("id", "1"))), true, 1, true));
        // La slice cuenta pero no cierra (unsealed); el seal de la última página cierra (terminal).
        when(gather.commitCompletedSlice(any(), any(), any())).thenReturn(Optional.of(new SliceProgress(1, 0, -1, false)));
        when(gather.sealScatter(any(), any(), eq(1))).thenReturn(Optional.of(new SliceProgress(1, 0, 1, true)));

        var result = consumer.consume(pageWire("REST_CALL", 0), "KAFKA", "tasks.rest_call");

        assertEquals(AsyncTaskConsumer.ConsumeResult.PROCESSED, result);
        assertEquals(1, completion.calls.size(), "el seal de la última página reanuda la tarea una vez");
    }

    @Test
    void pageChainMiddlePageEnqueuesNextButDoesNotSeal() throws Exception {
        when(registry.resolve("REST_CALL")).thenReturn(new CapturingBatchProvider(TaskResult.success("ok")));
        when(pageChain.readAndChain(any(), any())).thenReturn(new AsyncPageChainService.Page(
                java.util.List.of(new ReadRecord(Map.of("id", "1"))), false, -1, true));
        when(gather.commitCompletedSlice(any(), any(), any())).thenReturn(Optional.of(new SliceProgress(1, 0, -1, false)));

        consumer.consume(pageWire("REST_CALL", 0), "KAFKA", "tasks.rest_call");

        verify(gather, never()).sealScatter(any(), any(), anyInt());
        assertTrue(completion.calls.isEmpty(), "una página intermedia no reanuda la tarea");
    }

    @Test
    void pageChainShortCircuitsWhenScatterAlreadyTerminal() throws Exception {
        var provider = new CapturingBatchProvider(TaskResult.success("ok"));
        when(registry.resolve("REST_CALL")).thenReturn(provider);
        // El scatter ya cerró (fail-fast de una página previa): esta página tardía no debe hacer nada.
        when(gather.isScatterTerminal(any(), any())).thenReturn(true);

        var result = consumer.consume(pageWire("REST_CALL", 5), "KAFKA", "tasks.rest_call");

        assertEquals(AsyncTaskConsumer.ConsumeResult.DUPLICATE, result);
        verify(pageChain, never()).readAndChain(any(), any());
        assertNull(provider.records, "no ejecuta el provider (evita side-effects tras el fail-fast)");
    }

    @Test
    void pageChainEmptyPageSealsWithoutExecutingProvider() throws Exception {
        var provider = new CapturingBatchProvider(TaskResult.success("ok"));
        when(registry.resolve("REST_CALL")).thenReturn(provider);
        when(pageChain.readAndChain(any(), any())).thenReturn(
                new AsyncPageChainService.Page(java.util.List.of(), true, 0, false));
        when(gather.sealScatter(any(), any(), eq(0))).thenReturn(Optional.of(new SliceProgress(0, 0, 0, true)));

        consumer.consume(pageWire("REST_CALL", 0), "KAFKA", "tasks.rest_call");

        assertNull(provider.records, "página vacía: no se ejecuta el provider");
        verify(gather, never()).commitCompletedSlice(any(), any(), any());
        assertEquals(1, completion.calls.size(), "seal(0) cierra y reanuda (tabla vacía)");
    }

    // --- scatter-gather (Opción B) ---------------------------------------------

    private String sliceWire(String taskType, int idx, int total, java.util.List<Map<String, Object>> records)
            throws Exception {
        return sliceWire(taskType, idx, total, records, Map.of(), Map.of(), Map.of());
    }

    private String sliceWire(String taskType, int idx, int total, java.util.List<Map<String, Object>> records,
                             Map<String, Object> taskOutputs, Map<String, Object> metadata,
                             Map<String, String> executionVariables) throws Exception {
        var workItem = new AsyncSliceWorkItem(Map.of("targetTable", "t"), records, idx, total,
                taskOutputs, metadata, executionVariables);
        var envelope = new AsyncTaskEnvelope("exec-1", 1L, 2L, taskType, "KAFKA",
                TaskIdempotency.key(1L, 2L, "slice-" + idx), 1, mapper.writeValueAsString(workItem),
                Map.of("kind", "SLICE", "sliceIndex", String.valueOf(idx)));
        return AsyncTaskMessageCodec.toMessage(envelope, mapper).payload();
    }

    @Test
    void sliceCountsButDoesNotResumeTaskUntilBatchCloses() throws Exception {
        var provider = new CapturingBatchProvider(TaskResult.success("slice ok"));
        when(registry.resolve("DB_WRITE")).thenReturn(provider);
        when(gather.commitCompletedSlice(any(), any(), any())).thenReturn(Optional.of(new SliceProgress(1, 0, 3, false)));

        var result = consumer.consume(sliceWire("DB_WRITE", 0, 3, java.util.List.of(Map.of("id", "a"))),
                "KAFKA", "tasks.db_write");

        assertEquals(AsyncTaskConsumer.ConsumeResult.PROCESSED, result);
        assertEquals("a", provider.records.get(0).values().get("id"), "el provider recibió los records de la slice");
        assertTrue(completion.calls.isEmpty(), "una slice intermedia NO reanuda la tarea");
    }

    @Test
    void lastSliceResumesTaskExactlyOnce() throws Exception {
        when(registry.resolve("DB_WRITE")).thenReturn(new CapturingBatchProvider(TaskResult.success("slice ok")));
        when(gather.commitCompletedSlice(any(), any(), any())).thenReturn(Optional.of(new SliceProgress(3, 0, 3, true)));

        var result = consumer.consume(sliceWire("DB_WRITE", 2, 3, java.util.List.of(Map.of("id", "z"))),
                "KAFKA", "tasks.db_write");

        assertEquals(AsyncTaskConsumer.ConsumeResult.PROCESSED, result);
        assertEquals(1, completion.calls.size(), "la última slice reanuda la tarea una vez");
        assertTrue(completion.calls.get(0).result().success());
    }

    @Test
    void failedSliceThatTransitionsFailsTheTask() throws Exception {
        when(registry.resolve("DB_WRITE")).thenReturn(new CapturingBatchProvider(TaskResult.failure("boom")));
        // fail-fast: la slice fallida cierra el scatter como terminal → falla la tarea.
        when(gather.failSlice(any(), any(), anyBoolean())).thenReturn(Optional.of(new SliceProgress(0, 1, 3, true)));

        var result = consumer.consume(sliceWire("DB_WRITE", 1, 3, java.util.List.of(Map.of("id", "b"))),
                "KAFKA", "tasks.db_write");

        assertEquals(AsyncTaskConsumer.ConsumeResult.FAILED, result);
        assertEquals(1, completion.calls.size(), "la primera slice fallida falla la tarea una vez");
        assertFalse(completion.calls.get(0).result().success());
    }

    @Test
    void continueOnFailureClosingSliceCompletesWithErrorsNotFailure() throws Exception {
        when(registry.resolve("DB_WRITE")).thenReturn(new CapturingBatchProvider(TaskResult.failure("bad row")));
        when(gather.failSlice(any(), any(), anyBoolean())).thenReturn(Optional.of(new SliceProgress(2, 1, 3, true)));

        var workItem = new AsyncSliceWorkItem(Map.of("continueOnFailure", true),
                java.util.List.of(Map.of("id", "x")), 2, 3, Map.of(), Map.of(), Map.of());
        var envelope = new AsyncTaskEnvelope("exec-1", 1L, 2L, "DB_WRITE", "KAFKA",
                TaskIdempotency.key(1L, 2L, "slice-2"), 1, mapper.writeValueAsString(workItem),
                Map.of("kind", "SLICE", "sliceIndex", "2"));
        var payload = AsyncTaskMessageCodec.toMessage(envelope, mapper).payload();

        var result = consumer.consume(payload, "KAFKA", "tasks.db_write");

        assertEquals(AsyncTaskConsumer.ConsumeResult.FAILED, result);
        assertEquals(1, completion.calls.size());
        assertTrue(completion.calls.get(0).result().success(),
                "continueOnFailure: la tarea completa CON errores, no falla el proceso");
    }

    @Test
    void sliceRehydratesPropagatedContextForTheProvider() throws Exception {
        var provider = new CapturingBatchProvider(TaskResult.success("slice ok"));
        when(registry.resolve("REST_CALL")).thenReturn(provider);
        when(gather.commitCompletedSlice(any(), any(), any())).thenReturn(Optional.of(new SliceProgress(1, 0, 2, false)));

        // Nivel 2: la slice lleva outputs de tarea origen + variables; el consumer los rehidrata.
        var payload = sliceWire("REST_CALL", 0, 2, java.util.List.of(Map.of("id", "a")),
                Map.of("task-1.status", "SENT"), Map.of("processName", "P"), Map.of("env", "prod"));

        var result = consumer.consume(payload, "KAFKA", "tasks.rest_call");

        assertEquals(AsyncTaskConsumer.ConsumeResult.PROCESSED, result);
        assertEquals("SENT", ((Map<?, ?>) provider.context.attributes().get("taskOutputs")).get("task-1.status"),
                "los outputs de la tarea origen llegaron al provider");
        assertEquals("P", ((Map<?, ?>) provider.context.attributes().get("metadata")).get("processName"));
        assertEquals("prod", ((Map<?, ?>) provider.context.attributes().get("executionVariables")).get("env"));
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

    /** Suspendible de prueba (Nivel 3): su primer execute en el consumer devuelve suspended. */
    private static final class SuspendingProvider implements TaskProvider {
        private final TaskResult result;

        SuspendingProvider(TaskResult result) {
            this.result = result;
        }

        @Override
        public String type() {
            return "MT101_STATUS";
        }

        @Override
        public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
            return result;
        }
    }

    private static final class CapturingBatchProvider implements BatchTaskProvider {
        private final TaskResult result;
        java.util.List<ReadRecord> records;
        Map<String, Object> configuration;
        TaskContext context;

        CapturingBatchProvider(TaskResult result) {
            this.result = result;
        }

        @Override
        public String type() {
            return "DB_WRITE";
        }

        @Override
        public TaskResult executeRecords(TaskContext context, Map<String, Object> configuration,
                                         java.util.List<ReadRecord> records, SourcePayload sourcePayload) {
            this.records = records;
            this.configuration = configuration;
            this.context = context;
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

    /** Falla (throw transitorio) las primeras {@code failures} veces y luego devuelve {@code onSuccess}. */
    private static final class FlakyProvider implements TaskProvider {
        private final int failures;
        private final TaskResult onSuccess;
        int calls = 0;

        FlakyProvider(int failures, TaskResult onSuccess) {
            this.failures = failures;
            this.onSuccess = onSuccess;
        }

        @Override
        public String type() {
            return "DB_WRITE";
        }

        @Override
        public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
            calls++;
            if (calls <= failures) {
                throw new IllegalStateException("BD caída (intento " + calls + ")");
            }
            return onSuccess;
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
        AsyncTaskCompletion.SuspendedContext suspendedContext = AsyncTaskCompletion.SuspendedContext.empty();

        @Override
        public ProcessExecutionResumeService.ResumeOutcome completeFromExternalResult(
                Long processExecutionId, Long taskDefinitionId, TaskResult result) {
            calls.add(new Call(processExecutionId, taskDefinitionId, result));
            if (result.suspended()) {
                // Nivel 3: el provider volvió a suspender → el motor re-suspende (nuevo token).
                return new ProcessExecutionResumeService.ResumeOutcome(
                        ProcessExecutionResumeService.Outcome.RE_SUSPENDED, "new-token", false, result.details());
            }
            return new ProcessExecutionResumeService.ResumeOutcome(
                    ProcessExecutionResumeService.Outcome.COMPLETED, null, true, "ok");
        }

        @Override
        public AsyncTaskCompletion.SuspendedContext loadSuspendedContext(
                Long processExecutionId, Long taskDefinitionId) {
            return suspendedContext;
        }

        record Call(Long processExecutionId, Long taskDefinitionId, TaskResult result) {
        }
    }
}
