package com.integrationhub.platform.service.execution.async;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.repository.TaskAsyncDispatchRepository;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Lado <b>productor</b> del scatter-gather (ADR-015, Opción B, Etapa B2): parte una tarea
 * batch/per-record async en N slices, abre el tracker de agregación N→1 y encola un work-item por
 * slice. El relay los publica; N workers los procesan en paralelo; el tracker cierra la tarea cuando
 * la última slice completa (Etapa B3).
 *
 * <p><b>Atomicidad</b>: {@code open(N)} y los {@code enqueue} corren en la transacción del caller
 * (la de la suspensión de la tarea, como el transactional outbox per-task): o se abre el scatter con
 * sus N slices, o nada.</p>
 *
 * <p><b>idempotencyKey por-slice</b>: {@code TaskIdempotency.key(peId, tdId, "slice-i")} → cada slice
 * tiene clave determinista propia (dedup por-slice en el inbox y reproceso por-slice).</p>
 */
@ApplicationScoped
public class AsyncSliceDispatchService {

    private final TaskAsyncDispatchRepository tracker;
    private final TaskOutboxStore outboxStore;
    private final ObjectMapper objectMapper;
    private final AsyncPageChainService pageChain;

    @Inject
    public AsyncSliceDispatchService(TaskAsyncDispatchRepository tracker,
                                     TaskOutboxStore outboxStore,
                                     ObjectMapper objectMapper,
                                     AsyncPageChainService pageChain) {
        this.tracker = tracker;
        this.outboxStore = outboxStore;
        this.objectMapper = objectMapper;
        this.pageChain = pageChain;
    }

    /**
     * Despacha las {@code slices} de una tarea como N work-items y abre el tracker. Devuelve el número
     * de slices despachadas. No hace nada (devuelve 0) si no hay slices.
     *
     * <p><b>Atómico</b> (una sola transacción): {@code open(N)} + los N {@code enqueue} commitean
     * juntos, o nada. Sin esto, un crash a mitad dejaría el tracker con {@code total=N} pero menos de
     * N work-items → el scatter nunca podría cerrar. El caller (motor, B2b) lo invoca dentro de la tx
     * de la suspensión, con lo que el tracker+work-items commitean atómicos con la suspensión.</p>
     */
    @Transactional
    public int dispatchSlices(Long processExecutionId,
                              Long taskDefinitionId,
                              String taskType,
                              String transport,
                              Map<String, Object> configuration,
                              List<List<ReadRecord>> slices) {
        return dispatchSlices(processExecutionId, taskDefinitionId, taskType, transport, configuration,
                slices, Map.of(), Map.of(), Map.of());
    }

    /**
     * Variante con propagación de contexto (Nivel 2): {@code taskOutputs}/{@code metadata}/
     * {@code executionVariables} viajan en cada slice para que el consumer reconstruya el
     * {@code TaskContext} (p.ej. resolución de {@code ${task-N.x}} en plantillas).
     */
    @Transactional
    public int dispatchSlices(Long processExecutionId,
                              Long taskDefinitionId,
                              String taskType,
                              String transport,
                              Map<String, Object> configuration,
                              List<List<ReadRecord>> slices,
                              Map<String, Object> taskOutputs,
                              Map<String, Object> metadata,
                              Map<String, String> executionVariables) {
        if (processExecutionId == null || taskDefinitionId == null) {
            throw new IllegalStateException("El scatter async requiere processExecutionId y taskDefinitionId");
        }
        if (slices == null || slices.isEmpty()) {
            return 0;
        }
        var total = slices.size();
        tracker.open(processExecutionId, taskDefinitionId, total);

        var traceId = "exec-" + processExecutionId;
        for (var i = 0; i < total; i++) {
            var records = slices.get(i).stream().map(ReadRecord::values).toList();
            var workItem = new AsyncSliceWorkItem(configuration, records, i, total,
                    taskOutputs, metadata, executionVariables);
            var idempotencyKey = TaskIdempotency.key(processExecutionId, taskDefinitionId, "slice-" + i);
            var envelope = new AsyncTaskEnvelope(
                    traceId,
                    processExecutionId,
                    taskDefinitionId,
                    taskType,
                    transport,
                    idempotencyKey,
                    1,
                    serialize(workItem),
                    Map.of("traceId", traceId, "kind", "SLICE", "sliceIndex", String.valueOf(i)));
            outboxStore.enqueue(envelope);
        }
        return total;
    }

    /**
     * Overload por {@link ScatterDispatch}, para invocarlo desde la tx de la suspensión (B2b). Si el
     * request es <b>streaming</b> ({@code seedPage != null}, input por table-streaming), abre el scatter
     * open-ended y encola la página semilla (page-chain); si es materializado, reparte los N slices.
     */
    @Transactional
    public int dispatchSlices(ScatterDispatch request) {
        if (request.seedPage() != null) {
            pageChain.seed(request.processExecutionId(), request.taskDefinitionId(),
                    request.taskType(), request.transport(), request.seedPage());
            return 1; // una página semilla; la cadena se auto-propaga en los consumers
        }
        return dispatchSlices(request.processExecutionId(), request.taskDefinitionId(), request.taskType(),
                request.transport(), request.configuration(), request.slices(),
                request.taskOutputs(), request.metadata(), request.executionVariables());
    }

    /**
     * Petición de scatter que el motor construye en {@code runTask} y ejecuta atómicamente con la
     * suspensión de la tarea (dentro de la tx de {@code suspendTask}). Materializado: {@code slices} con
     * el contexto serializable a propagar. Streaming (table-streaming): {@code seedPage} con la primera
     * página (los demás campos de slices van vacíos).
     */
    public record ScatterDispatch(Long processExecutionId,
                                  Long taskDefinitionId,
                                  String taskType,
                                  String transport,
                                  Map<String, Object> configuration,
                                  List<List<ReadRecord>> slices,
                                  Map<String, Object> taskOutputs,
                                  Map<String, Object> metadata,
                                  Map<String, String> executionVariables,
                                  AsyncPageWorkItem seedPage) {

        /** Scatter materializado (N slices conocidos). */
        public static ScatterDispatch materialized(Long processExecutionId, Long taskDefinitionId, String taskType,
                                                   String transport, Map<String, Object> configuration,
                                                   List<List<ReadRecord>> slices, Map<String, Object> taskOutputs,
                                                   Map<String, Object> metadata,
                                                   Map<String, String> executionVariables) {
            return new ScatterDispatch(processExecutionId, taskDefinitionId, taskType, transport, configuration,
                    slices, taskOutputs, metadata, executionVariables, null);
        }

        /** Scatter en streaming (page-chain): solo la página semilla. */
        public static ScatterDispatch streaming(Long processExecutionId, Long taskDefinitionId, String taskType,
                                                String transport, AsyncPageWorkItem seedPage) {
            return new ScatterDispatch(processExecutionId, taskDefinitionId, taskType, transport, Map.of(),
                    List.of(), Map.of(), Map.of(), Map.of(), seedPage);
        }
    }

    private String serialize(AsyncSliceWorkItem workItem) {
        try {
            return objectMapper.writeValueAsString(workItem);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Slice work-item no serializable", e);
        }
    }
}
