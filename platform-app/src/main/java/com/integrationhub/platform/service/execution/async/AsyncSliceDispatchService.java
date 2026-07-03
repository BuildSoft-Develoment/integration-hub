package com.integrationhub.platform.service.execution.async;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.repository.TaskAsyncDispatchRepository;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

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

    @Inject
    public AsyncSliceDispatchService(TaskAsyncDispatchRepository tracker,
                                     TaskOutboxStore outboxStore,
                                     ObjectMapper objectMapper) {
        this.tracker = tracker;
        this.outboxStore = outboxStore;
        this.objectMapper = objectMapper;
    }

    /**
     * Despacha las {@code slices} de una tarea como N work-items y abre el tracker. Devuelve el número
     * de slices despachadas. No hace nada (devuelve 0) si no hay slices.
     */
    public int dispatchSlices(Long processExecutionId,
                              Long taskDefinitionId,
                              String taskType,
                              String transport,
                              Map<String, Object> configuration,
                              List<List<ReadRecord>> slices) {
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
            var workItem = new AsyncSliceWorkItem(configuration, records, i, total);
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
                    Map.of("traceId", traceId, "sliceIndex", String.valueOf(i)));
            outboxStore.enqueue(envelope);
        }
        return total;
    }

    private String serialize(AsyncSliceWorkItem workItem) {
        try {
            return objectMapper.writeValueAsString(workItem);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Slice work-item no serializable", e);
        }
    }
}
