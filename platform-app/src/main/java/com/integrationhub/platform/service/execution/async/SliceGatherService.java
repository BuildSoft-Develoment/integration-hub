package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.entity.TaskAsyncDispatch;
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
    private final AsyncNodeIdentity nodeIdentity;

    @Inject
    public SliceGatherService(TaskInboxRepository inbox, TaskAsyncDispatchRepository tracker,
                              AsyncNodeIdentity nodeIdentity) {
        this.inbox = inbox;
        this.tracker = tracker;
        this.nodeIdentity = nodeIdentity;
    }

    /**
     * Cuenta una slice completada: inserta su dedup en el inbox y, solo si es nueva, incrementa el
     * tracker. Devuelve el progreso si esta entrega fue la que contó la slice; vacío si era duplicada
     * (o no hay scatter activo) → el caller no debe disparar la reanudación.
     */
    @Transactional
    public Optional<SliceProgress> commitCompletedSlice(AsyncTaskEnvelope envelope, String outputsJson, String details) {
        // §5: la slice se reclamó (CLAIMED) antes de ejecutar; aquí se cierra ese claim → PROCESSED y se cuenta
        // SOLO si esta entrega lo transicionó (dedup+conteo en una transacción). Fallback a insertIfAbsent para
        // una slice SIN claim previo (compat rolling-deploy): si inserta la fila terminal, también es primera vez.
        if (!countScatterUnitOnce(envelope, TaskInbox.PROCESSED, outputsJson, details, null)) {
            return Optional.empty(); // slice ya contada (reentrega): no re-incrementar
        }
        var progress = tracker.recordSliceCompleted(envelope.processExecutionId(), envelope.taskDefinitionId());
        // Si no incrementó pero el tracker NO existe, el scatter aún no se abrió (carrera): lanzar para
        // hacer rollback (deshace el dedup del inbox) y reintentar, en vez de dedupar sin contar (que
        // colgaría el scatter). Si el tracker existe pero ya cerró (COMPLETED/FAILED), es skip legítimo.
        if (progress.isEmpty()
                && tracker.findByExecutionAndTask(envelope.processExecutionId(), envelope.taskDefinitionId()).isEmpty()) {
            throw new IllegalStateException("Tracker scatter ausente para exec="
                    + envelope.processExecutionId() + " task=" + envelope.taskDefinitionId() + "; reintentar");
        }
        return progress;
    }

    /**
     * §5: dedup+registro terminal de la unidad de scatter (slice/página) en su fila del inbox, exactamente UNA vez.
     * Cierra el claim que el consumer tomó antes de ejecutar ({@code CLAIMED → status}); si no había claim (compat
     * rolling-deploy) cae a {@code insertIfAbsent}. Devuelve {@code true} si ESTA entrega fue la primera en asentar
     * el terminal (debe contar en el tracker); {@code false} si era una reentrega ya contada.
     */
    private boolean countScatterUnitOnce(AsyncTaskEnvelope envelope, String terminalStatus,
                                         String outputsJson, String details, String error) {
        if (inbox.finalizeClaimed(envelope.idempotencyKey(), terminalStatus, outputsJson, details, error,
                nodeIdentity.id()) > 0) {
            return true;
        }
        return inbox.insertIfAbsent(envelope.idempotencyKey(), envelope.taskType(),
                envelope.processExecutionId(), envelope.taskDefinitionId(), terminalStatus,
                outputsJson, details, error, null, envelope.transport(), null) > 0;
    }

    /**
     * {@code true} si el scatter de la tarea ya cerró (COMPLETED/FAILED). Lo usa el consumer para
     * <b>cortocircuitar</b> slices/páginas tardías tras un fail-fast: no ejecuta el provider (evita
     * side-effects inútiles) y —en streaming— no encola la siguiente página (mata la cadena runaway).
     * Best-effort: una entrega concurrente antes de que el fallo commitee puede no verlo aún.
     */
    @Transactional
    public boolean isScatterTerminal(Long processExecutionId, Long taskDefinitionId) {
        return tracker.findByExecutionAndTask(processExecutionId, taskDefinitionId)
                .map(t -> TaskAsyncDispatch.COMPLETED.equals(t.status) || TaskAsyncDispatch.FAILED.equals(t.status))
                .orElse(false);
    }

    /**
     * <b>Sella</b> un scatter en streaming (page-chain) fijando su total al agotar la tabla. Devuelve el
     * progreso solo si <b>este</b> seal cerró el scatter (para disparar la reanudación una vez); vacío si
     * aún faltan slices, si ya estaba sellado (reentrega de la última página) o si ya cerró.
     */
    @Transactional
    public Optional<SliceProgress> sealScatter(Long processExecutionId, Long taskDefinitionId, int totalSlices) {
        return tracker.seal(processExecutionId, taskDefinitionId, totalSlices);
    }

    /**
     * Cuenta una slice fallida: dedup en el inbox y, si es nueva, avanza el scatter (fail-fast → FAILED;
     * continueOnFailure → cuenta la fallida y cierra cuando todas están contadas). Devuelve el progreso
     * si esta entrega contó la slice; vacío si era duplicada.
     */
    @Transactional
    public Optional<SliceProgress> failSlice(AsyncTaskEnvelope envelope, String error, boolean continueOnFailure) {
        // §5: cierra el claim de la slice → DEAD y cuenta solo si esta entrega lo transicionó (o, sin claim previo,
        // si insertIfAbsent asienta la fila). Mismo dedup+conteo atómico que el camino de éxito.
        if (!countScatterUnitOnce(envelope, TaskInbox.DEAD, null, null, error)) {
            return Optional.empty();
        }
        var progress = tracker.recordSliceFailed(envelope.processExecutionId(), envelope.taskDefinitionId(),
                continueOnFailure);
        if (progress.isEmpty()
                && tracker.findByExecutionAndTask(envelope.processExecutionId(), envelope.taskDefinitionId()).isEmpty()) {
            throw new IllegalStateException("Tracker scatter ausente para exec="
                    + envelope.processExecutionId() + " task=" + envelope.taskDefinitionId() + "; reintentar");
        }
        return progress;
    }
}
