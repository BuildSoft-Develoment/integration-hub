package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.entity.TaskInbox;
import com.integrationhub.platform.repository.TaskAsyncDispatchRepository;
import com.integrationhub.platform.repository.TaskAsyncDispatchRepository.SliceProgress;
import com.integrationhub.platform.repository.TaskInboxRepository;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.Optional;

/**
 * Gather del scatter-gather (ADR-015 Opción B, Etapa B3): registra el resultado de una slice y avanza
 * la agregación N→1 de forma <b>atómica</b>. El dedup por-slice (inbox) y el incremento del tracker
 * viven en <b>una sola transacción</b>: así una reentrega no cuenta dos veces, y un crash entre ambos
 * no deja la slice "procesada pero no contada" (que colgaría el scatter para siempre).
 */
@ApplicationScoped
public class SliceGatherService {

    private final TaskInboxRepository inbox;
    private final TaskAsyncDispatchRepository tracker;

    @Inject
    public SliceGatherService(TaskInboxRepository inbox, TaskAsyncDispatchRepository tracker) {
        this.inbox = inbox;
        this.tracker = tracker;
    }

    /**
     * Cuenta una slice completada: inserta su dedup en el inbox y, solo si es nueva, incrementa el
     * tracker. Devuelve el progreso si esta entrega fue la que contó la slice; vacío si era duplicada
     * (o no hay scatter activo) → el caller no debe disparar la reanudación.
     */
    @Transactional
    public Optional<SliceProgress> commitCompletedSlice(AsyncTaskEnvelope envelope, String outputsJson, String details) {
        var inserted = inbox.insertIfAbsent(envelope.idempotencyKey(), envelope.taskType(),
                envelope.processExecutionId(), envelope.taskDefinitionId(), TaskInbox.PROCESSED,
                outputsJson, details, null, null, envelope.transport(), null);
        if (inserted == 0) {
            return Optional.empty(); // slice ya contada (reentrega): no re-incrementar
        }
        return tracker.recordSliceCompleted(envelope.processExecutionId(), envelope.taskDefinitionId());
    }

    /**
     * Cuenta una slice fallida (sin recuperación): dedup en el inbox y, si es nueva, transiciona el
     * scatter a FAILED. Devuelve {@code true} si esta entrega provocó la transición (para que el caller
     * falle la tarea una sola vez).
     */
    @Transactional
    public boolean failSlice(AsyncTaskEnvelope envelope, String error) {
        var inserted = inbox.insertIfAbsent(envelope.idempotencyKey(), envelope.taskType(),
                envelope.processExecutionId(), envelope.taskDefinitionId(), TaskInbox.DEAD,
                null, null, error, null, envelope.transport(), null);
        if (inserted == 0) {
            return false;
        }
        return tracker.recordSliceFailed(envelope.processExecutionId(), envelope.taskDefinitionId());
    }
}
