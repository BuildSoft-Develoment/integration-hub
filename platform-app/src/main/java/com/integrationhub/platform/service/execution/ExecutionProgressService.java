package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.entity.TaskAsyncDispatch;
import com.integrationhub.platform.repository.TaskAsyncDispatchRepository;
import com.integrationhub.platform.service.execution.async.AsyncTaskDlqService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.List;

/**
 * Progreso de ejecución para la UI de monitoreo a escala (ADR-015): agrega el tracker
 * {@code task_async_dispatch} por tarea (scatter) y la salud del pipeline async. La UI la puede pollear
 * (auto-refresh) para mostrar avance de un proceso de 1M registros en vez de solo el estado terminal.
 *
 * <p><b>Alcance</b>: el progreso granular existe para tareas <b>scatter</b> (tracker N→1/page-chain) y
 * para tareas <b>sync</b> por sus dos caminos de ejecución, ambos upserteando (throttled) a
 * {@code task_sync_progress}: el <i>batch</i> vía {@code executeByMode} (loop en {@code ProcessTaskRuntimeService})
 * y el <i>streaming fastpath</i> FILE_READ→DB_WRITE vía {@code SyncProgressReporter} en
 * {@code StreamingPipelineService}.</p>
 */
@ApplicationScoped
public class ExecutionProgressService {

    private final TaskAsyncDispatchRepository scatterTracker;
    private final com.integrationhub.platform.repository.TaskSyncProgressRepository syncProgressRepository;
    private final AsyncTaskDlqService dlqService;

    public ExecutionProgressService(TaskAsyncDispatchRepository scatterTracker,
                                    com.integrationhub.platform.repository.TaskSyncProgressRepository syncProgressRepository,
                                    AsyncTaskDlqService dlqService) {
        this.scatterTracker = scatterTracker;
        this.syncProgressRepository = syncProgressRepository;
        this.dlqService = dlqService;
    }

    @Transactional
    public ExecutionProgress progress(Long processExecutionId) {
        var scatterTasks = scatterTracker.findByExecution(processExecutionId).stream()
                .map(this::toTaskProgress)
                .toList();
        // Progreso de tareas SÍNCRONAS: el contador en vivo upserteado por el loop batch (tabla dedicada).
        var syncTasks = syncProgressRepository.findByExecution(processExecutionId).stream()
                .map(p -> new SyncTaskProgress(p.taskDefinitionId, p.recordsProcessed))
                .toList();
        return new ExecutionProgress(processExecutionId, scatterTasks, syncTasks, dlqService.summary());
    }

    private TaskScatterProgress toTaskProgress(TaskAsyncDispatch t) {
        var streaming = t.totalSlices == null; // page-chain aún sin sellar → total desconocido
        var percent = (streaming || t.totalSlices == 0)
                ? null
                : Math.min(100, (int) Math.round(100.0 * (t.completedSlices + t.failedSlices) / t.totalSlices));
        return new TaskScatterProgress(t.taskDefinitionId, t.completedSlices, t.failedSlices,
                t.totalSlices, streaming, percent, t.status, t.lastProgressAt);
    }

    /** Progreso agregado de una ejecución: tareas scatter + tareas sync + salud del pipeline. */
    public record ExecutionProgress(Long executionId, List<TaskScatterProgress> scatterTasks,
                                    List<SyncTaskProgress> syncTasks, AsyncTaskDlqService.DlqSummary pipeline) {
    }

    /** Progreso en vivo de una tarea batch síncrona (records_processed upserteado throttled). */
    public record SyncTaskProgress(Long taskDefinitionId, long recordsProcessed) {
    }

    /**
     * Progreso de una tarea scatter. {@code total=null}/{@code streaming=true} ⇒ page-chain sin sellar
     * (mostrar indeterminado, sin % ni ETA falsos); {@code percent} solo cuando el total se conoce.
     */
    public record TaskScatterProgress(Long taskDefinitionId, int completed, int failed, Integer total,
                                      boolean streaming, Integer percent, String status,
                                      java.time.LocalDateTime lastProgressAt) {
    }
}
