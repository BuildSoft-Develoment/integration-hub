package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.domain.ExecutionStatus;
import com.integrationhub.platform.entity.ProcessDefinition;
import com.integrationhub.platform.entity.ProcessExecution;
import com.integrationhub.platform.entity.ProcessTaskDefinition;
import com.integrationhub.platform.entity.ProcessTaskExecution;
import com.integrationhub.platform.repository.ProcessDefinitionRepository;
import com.integrationhub.platform.repository.ProcessExecutionRepository;
import com.integrationhub.platform.repository.ProcessTaskDefinitionRepository;
import com.integrationhub.platform.repository.ProcessTaskExecutionRepository;
import com.integrationhub.platform.service.execution.async.AsyncSliceDispatchService;
import com.integrationhub.platform.service.execution.async.TaskOutboxStore;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class ProcessExecutionStateService {

    private final ProcessDefinitionRepository processDefinitionRepository;
    private final ProcessTaskDefinitionRepository processTaskDefinitionRepository;
    private final ProcessExecutionRepository processExecutionRepository;
    private final ProcessTaskExecutionRepository processTaskExecutionRepository;
    private final AuditService auditService;
    private final TaskOutboxStore taskOutboxStore;
    private final AsyncSliceDispatchService sliceDispatchService;

    public ProcessExecutionStateService(
            ProcessDefinitionRepository processDefinitionRepository,
            ProcessTaskDefinitionRepository processTaskDefinitionRepository,
            ProcessExecutionRepository processExecutionRepository,
            ProcessTaskExecutionRepository processTaskExecutionRepository,
            AuditService auditService,
            TaskOutboxStore taskOutboxStore,
            AsyncSliceDispatchService sliceDispatchService
    ) {
        this.processDefinitionRepository = processDefinitionRepository;
        this.processTaskDefinitionRepository = processTaskDefinitionRepository;
        this.processExecutionRepository = processExecutionRepository;
        this.processTaskExecutionRepository = processTaskExecutionRepository;
        this.auditService = auditService;
        this.taskOutboxStore = taskOutboxStore;
        this.sliceDispatchService = sliceDispatchService;
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public ExecutionPlan loadExecutionPlan(Long processDefinitionId) {
        var definition = processDefinitionRepository.findRequired(processDefinitionId);
        var tasks = definition.tasks.stream()
                .filter(task -> task.active)
                .sorted(Comparator.comparing(task -> task.taskOrder))
                .map(this::toTaskPlan)
                .toList();
        return new ExecutionPlan(definition.id, definition.name, tasks);
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public Long startProcess(Long processDefinitionId, String processName, Long sourceExecutionId, String triggerSource) {
        var definition = processDefinitionRepository.findRequired(processDefinitionId);
        var execution = new ProcessExecution();
        execution.processDefinition = definition;
        execution.status = ExecutionStatus.RUNNING;
        execution.startedAt = LocalDateTime.now();
        execution.sourceExecutionId = sourceExecutionId;
        execution.triggerSource = triggerSource;
        processExecutionRepository.persist(execution);
        var payload = new java.util.LinkedHashMap<String, Object>();
        payload.put("processDefinitionId", definition.id);
        payload.put("processName", processName);
        if (sourceExecutionId != null) payload.put("sourceExecutionId", sourceExecutionId);
        if (triggerSource != null && !triggerSource.isBlank()) payload.put("triggerSource", triggerSource);
        auditService.record(execution, null, "PROCESS_STARTED", "RUNNING", "Process execution started", payload);
        return execution.id;
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public Long queueProcess(Long processDefinitionId,
                             String processName,
                             Long sourceExecutionId,
                             String triggerSource,
                             String requestPayloadJson) {
        var definition = processDefinitionRepository.findRequired(processDefinitionId);
        var execution = new ProcessExecution();
        execution.processDefinition = definition;
        execution.status = ExecutionStatus.PENDING;
        execution.startedAt = LocalDateTime.now();
        execution.sourceExecutionId = sourceExecutionId;
        execution.triggerSource = triggerSource;
        execution.requestPayloadJson = requestPayloadJson;
        execution.details = "Execution queued";
        processExecutionRepository.persist(execution);
        var payload = new java.util.LinkedHashMap<String, Object>();
        payload.put("processDefinitionId", definition.id);
        payload.put("processName", processName);
        if (sourceExecutionId != null) payload.put("sourceExecutionId", sourceExecutionId);
        if (triggerSource != null && !triggerSource.isBlank()) payload.put("triggerSource", triggerSource);
        auditService.record(execution, null, "PROCESS_QUEUED", "PENDING", "Process execution queued", payload);
        return execution.id;
    }

    /**
     * v53-fix (#8): claim ATOMICO DISTRIBUIDO PENDING -> RUNNING. Reemplaza el read-then-write anterior por un
     * {@code UPDATE ... WHERE status='PENDING'}: en cluster, solo el nodo cuyo UPDATE afecta la fila despacha; los
     * demas ven 0 filas y siguen. Fija owner/token + lease/heartbeat iniciales.
     */
    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public boolean claimProcessForExecution(Long processExecutionId, String owner, String token, int leaseSeconds) {
        var now = LocalDateTime.now();
        var leaseUntil = now.plusSeconds(Math.max(leaseSeconds, 1));
        if (processExecutionRepository.claimForRunning(processExecutionId, owner, token, leaseUntil, now) != 1) {
            return false;
        }
        var execution = processExecutionRepository.findById(processExecutionId);
        auditService.record(execution, null, "PROCESS_STARTED", "RUNNING",
                "Process execution claimed by " + owner, Map.of(
                        "processDefinitionId", execution.processDefinition.id,
                        "processName", execution.processDefinition.name,
                        "executionOwner", owner));
        return true;
    }

    /** v53-fix: renueva el lease/heartbeat mientras el nodo dueño ejecuta (evita falso-reclamo de una sana). */
    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public boolean renewExecutionLease(Long processExecutionId, String token, int leaseSeconds) {
        var now = LocalDateTime.now();
        return processExecutionRepository.renewLease(processExecutionId, token,
                now.plusSeconds(Math.max(leaseSeconds, 1)), now) == 1;
    }

    /**
     * v53-fix: recupera ejecuciones RUNNING huerfanas (lease vencido = nodo caido). REGLA DE SEGURIDAD: si la
     * ejecucion YA inicio {@code payTaskType} (efecto no-idempotente) -> {@code NEEDS_RECONCILIATION} (nunca se
     * re-ejecuta a ciegas; se resuelve por STATUS/RECONCILE); si NO -> {@code PENDING} (re-encolar). Atomico por fila.
     */
    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public int recoverExpiredExecutions(int limit, String payTaskType) {
        var now = LocalDateTime.now();
        var expiredIds = processExecutionRepository.listExpiredRunningIds(now, limit);
        var recovered = 0;
        for (var id : expiredIds) {
            var startedPay = processExecutionRepository.hasStartedTaskType(id, payTaskType);
            var target = startedPay ? ExecutionStatus.NEEDS_RECONCILIATION : ExecutionStatus.PENDING;
            var detail = startedPay
                    ? "Recovered orphaned execution (lease expired) that already started " + payTaskType
                            + "; NEEDS_RECONCILIATION (no blind re-run; resolve via STATUS/RECONCILE)"
                    : "Recovered orphaned execution (lease expired); re-queued for a fresh atomic claim";
            if (processExecutionRepository.recoverExpiredRunning(id, target, detail, now) == 1) {
                recovered++;
                var execution = processExecutionRepository.findById(id);
                auditService.record(execution, null, "PROCESS_RECOVERED", target.name(), detail, Map.of(
                        "processDefinitionId", execution.processDefinition.id, "startedPay", startedPay));
            }
        }
        return recovered;
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public Long startTask(Long processExecutionId, Long taskDefinitionId, String taskType, Integer taskOrder) {
        var execution = processExecutionRepository.findById(processExecutionId);
        var taskDefinition = processTaskDefinitionRepository.findById(taskDefinitionId);
        var taskExecution = new ProcessTaskExecution();
        taskExecution.processExecution = execution;
        taskExecution.taskDefinition = taskDefinition;
        taskExecution.status = ExecutionStatus.RUNNING;
        taskExecution.executedAt = LocalDateTime.now();
        taskExecution.startedAt = taskExecution.executedAt;
        processTaskExecutionRepository.persist(taskExecution);
        auditService.record(execution, taskDefinition, "TASK_STARTED", "RUNNING", "Task execution started", Map.of("taskType", taskType, "taskOrder", taskOrder));
        return taskExecution.id;
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void completeTask(Long processExecutionId, Long taskExecutionId, String details, Object payload) {
        var execution = processExecutionRepository.findById(processExecutionId);
        var taskExecution = processTaskExecutionRepository.findById(taskExecutionId);
        taskExecution.status = ExecutionStatus.COMPLETED;
        taskExecution.finishedAt = LocalDateTime.now();
        taskExecution.details = details;
        auditService.record(execution, taskExecution.taskDefinition, "TASK_COMPLETED", "COMPLETED", details, payload);
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void failTask(Long processExecutionId, Long taskExecutionId, String message, Object payload) {
        var execution = processExecutionRepository.findById(processExecutionId);
        var taskExecution = processTaskExecutionRepository.findById(taskExecutionId);
        taskExecution.status = ExecutionStatus.FAILED;
        taskExecution.finishedAt = LocalDateTime.now();
        taskExecution.details = message;
        auditService.record(execution, taskExecution.taskDefinition, "TASK_FAILED", "FAILED", message, payload);
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void completeTaskWithErrors(Long processExecutionId, Long taskExecutionId, String details, Object payload) {
        var execution = processExecutionRepository.findById(processExecutionId);
        var taskExecution = processTaskExecutionRepository.findById(taskExecutionId);
        taskExecution.status = ExecutionStatus.COMPLETED_WITH_ERRORS;
        taskExecution.finishedAt = LocalDateTime.now();
        taskExecution.details = details;
        auditService.record(execution, taskExecution.taskDefinition, "TASK_COMPLETED_WITH_ERRORS", "COMPLETED_WITH_ERRORS", details, payload);
    }

    /**
     * Suspende una tarea (y su proceso contenedor) hasta que llegue un resume.
     * Persiste el state JSON-serializado y un token opaco para callbacks.
     *
     * @trace spec 003 T-017 (M-2 suspension engine), ADR-009
     */
    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void suspendTask(Long processExecutionId,
                            Long taskExecutionId,
                            String suspendedStateJson,
                            String resumeToken,
                            LocalDateTime expiresAt,
                            String details,
                            Object auditPayload) {
        suspendTask(processExecutionId, taskExecutionId, suspendedStateJson, resumeToken,
                expiresAt, null, details, auditPayload);
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void suspendTask(Long processExecutionId,
                            Long taskExecutionId,
                            String suspendedStateJson,
                            String resumeToken,
                            LocalDateTime expiresAt,
                            String continuationJson,
                            String details,
                            Object auditPayload) {
        suspendTask(processExecutionId, taskExecutionId, suspendedStateJson, resumeToken,
                expiresAt, continuationJson, details, auditPayload, (AsyncTaskEnvelope) null);
    }

    /**
     * Variante para el <b>despacho async</b> (ADR-015): persiste la suspensión y, si hay
     * {@code asyncDispatch}, encola el work-item en el outbox <b>en esta misma transacción</b>
     * (transactional outbox). Así la trama y su suspensión commitean atómicamente: nunca hay una
     * trama consumible sin su suspensión (evita {@code NOT_FOUND}: efecto huérfano + completación
     * perdida), ni una suspensión sin su trama (proceso colgado). El {@code enqueue} del store es
     * {@code @Transactional(REQUIRED)} → se une a esta tx REQUIRES_NEW.
     */
    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void suspendTask(Long processExecutionId,
                            Long taskExecutionId,
                            String suspendedStateJson,
                            String resumeToken,
                            LocalDateTime expiresAt,
                            String continuationJson,
                            String details,
                            Object auditPayload,
                            AsyncTaskEnvelope asyncDispatch) {
        persistSuspension(processExecutionId, taskExecutionId, suspendedStateJson, resumeToken,
                expiresAt, continuationJson, details, auditPayload);
        if (asyncDispatch != null) {
            taskOutboxStore.enqueue(asyncDispatch);
        }
    }

    /**
     * Variante para el <b>scatter async</b> (Opción B): persiste la suspensión y, en <b>esta misma
     * transacción</b>, abre el tracker N→1 y encola los N work-items de slice (via
     * {@code dispatchSlices}, {@code @Transactional(REQUIRED)} → se une). Atómico: nunca hay slices ni
     * tracker sin su suspensión, ni suspensión sin sus slices.
     */
    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void suspendTask(Long processExecutionId,
                            Long taskExecutionId,
                            String suspendedStateJson,
                            String resumeToken,
                            LocalDateTime expiresAt,
                            String continuationJson,
                            String details,
                            Object auditPayload,
                            AsyncSliceDispatchService.ScatterDispatch scatterDispatch) {
        persistSuspension(processExecutionId, taskExecutionId, suspendedStateJson, resumeToken,
                expiresAt, continuationJson, details, auditPayload);
        if (scatterDispatch != null) {
            sliceDispatchService.dispatchSlices(scatterDispatch);
        }
    }

    private void persistSuspension(Long processExecutionId,
                                   Long taskExecutionId,
                                   String suspendedStateJson,
                                   String resumeToken,
                                   LocalDateTime expiresAt,
                                   String continuationJson,
                                   String details,
                                   Object auditPayload) {
        var execution = processExecutionRepository.findById(processExecutionId);
        var taskExecution = processTaskExecutionRepository.findById(taskExecutionId);
        taskExecution.status = ExecutionStatus.SUSPENDED;
        taskExecution.suspendedState = suspendedStateJson;
        taskExecution.resumeToken = resumeToken;
        taskExecution.suspendedAt = LocalDateTime.now();
        taskExecution.suspendExpiresAt = expiresAt;
        taskExecution.suspendedContinuation = continuationJson;
        // Re-suspension (provider volvio a suspender tras un resume): sin limpiar
        // resumedAt, el nuevo token seria inubicable porque findActiveByResumeToken
        // filtra por resumedAt is null. resume_count conserva el historial.
        taskExecution.resumedAt = null;
        taskExecution.details = details;
        execution.status = ExecutionStatus.SUSPENDED;
        auditService.record(execution, taskExecution.taskDefinition,
                "TASK_SUSPENDED", "SUSPENDED", details, auditPayload);
    }

    /**
     * Marca una tarea previamente suspendida como reanudada (timestamp +
     * incremento de contador). El status pasa a RUNNING; el caller decide si
     * transicionar a COMPLETED/FAILED segun el {@code TaskResult} del resume.
     */
    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void markResumed(Long taskExecutionId) {
        var taskExecution = processTaskExecutionRepository.findById(taskExecutionId);
        taskExecution.resumedAt = LocalDateTime.now();
        taskExecution.resumeCount = taskExecution.resumeCount + 1;
        taskExecution.status = ExecutionStatus.RUNNING;
        var execution = taskExecution.processExecution;
        if (execution != null && execution.status == ExecutionStatus.SUSPENDED) {
            execution.status = ExecutionStatus.RUNNING;
        }
    }

    /**
     * Lookup de una suspension activa por token (callback externo).
     * Devuelve {@code null} si no existe, ya fue reanudado o el token es vacio.
     */
    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public ProcessTaskExecution findActiveSuspension(String resumeToken) {
        return processTaskExecutionRepository.findActiveByResumeToken(resumeToken);
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void completeProcess(Long processExecutionId, String details) {
        var execution = processExecutionRepository.findById(processExecutionId);
        execution.status = ExecutionStatus.COMPLETED;
        execution.finishedAt = LocalDateTime.now();
        execution.details = details;
        auditService.record(execution, null, "PROCESS_COMPLETED", "COMPLETED", details, null);
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void failProcess(Long processExecutionId, String message) {
        var execution = processExecutionRepository.findById(processExecutionId);
        execution.status = ExecutionStatus.FAILED;
        execution.finishedAt = LocalDateTime.now();
        execution.details = message;
        auditService.record(execution, null, "PROCESS_FAILED", "FAILED", message, null);
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void completeProcessWithErrors(Long processExecutionId, String details) {
        var execution = processExecutionRepository.findById(processExecutionId);
        execution.status = ExecutionStatus.COMPLETED_WITH_ERRORS;
        execution.finishedAt = LocalDateTime.now();
        execution.details = details;
        auditService.record(execution, null, "PROCESS_COMPLETED_WITH_ERRORS", "COMPLETED_WITH_ERRORS", details, null);
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public ProcessExecution getExecution(Long processExecutionId) {
        return processExecutionRepository.findById(processExecutionId);
    }

    /**
     * v54-fix: cierra una ejecucion en {@code NEEDS_RECONCILIATION} (tras reconciliar sus fragmentos) hacia
     * {@code COMPLETED} o {@code COMPLETED_WITH_ERRORS}. Atomico ({@code WHERE status='NEEDS_RECONCILIATION'}): no
     * cierra dos veces ni desde otro estado. El guard de terminalidad de fragmentos vive en el caller MT101. NO
     * re-ejecuta ni reenvia; solo cierra el estado del motor. Devuelve false si ya no estaba en NEEDS_RECONCILIATION.
     */
    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public boolean closeReconciled(Long processExecutionId, boolean withErrors, String details) {
        var target = withErrors ? ExecutionStatus.COMPLETED_WITH_ERRORS : ExecutionStatus.COMPLETED;
        if (processExecutionRepository.closeFromNeedsReconciliation(processExecutionId, target, details,
                LocalDateTime.now()) != 1) {
            return false;
        }
        var execution = processExecutionRepository.findById(processExecutionId);
        auditService.record(execution, null, "PROCESS_RECONCILED_CLOSED", target.name(), details, Map.of(
                "processDefinitionId", execution.processDefinition.id,
                "processName", execution.processDefinition.name));
        return true;
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public long countPendingProcesses() {
        return processExecutionRepository.countPendingExecutions();
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public List<Long> listPendingProcessExecutionIds(int limit) {
        return processExecutionRepository.listPendingExecutions(limit).stream()
                .map(execution -> execution.id)
                .toList();
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public QueuedExecution loadQueuedExecution(Long processExecutionId) {
        var execution = processExecutionRepository.findRequired(processExecutionId);
        return new QueuedExecution(
                execution.id,
                execution.processDefinition.id,
                execution.triggerSource,
                execution.requestPayloadJson
        );
    }

    private TaskPlan toTaskPlan(ProcessTaskDefinition task) {
        return new TaskPlan(
                task.id,
                task.taskOrder,
                task.taskType,
                task.configurationJson,
                task.sourceDefinition == null ? null : task.sourceDefinition.id,
                task.sourceDefinition == null ? null : task.sourceDefinition.name,
                task.sourceDefinition == null ? null : task.sourceDefinition.sourceType,
                task.sourceDefinition == null ? null : task.sourceDefinition.configurationJson,
                task.readerDefinition == null ? null : task.readerDefinition.id,
                task.readerDefinition == null ? null : task.readerDefinition.readerType,
                task.readerDefinition == null ? null : task.readerDefinition.configurationJson
        );
    }

    public record ExecutionPlan(Long processDefinitionId, String processName, List<TaskPlan> tasks) {
    }

    public record QueuedExecution(
            Long processExecutionId,
            Long processDefinitionId,
            String triggerSource,
            String requestPayloadJson
    ) {
    }

    public record TaskPlan(
            Long taskDefinitionId,
            Integer taskOrder,
            String taskType,
            String configurationJson,
            Long sourceDefinitionId,
            String sourceName,
            String sourceType,
            String sourceConfigurationJson,
            Long readerDefinitionId,
            String readerType,
            String readerConfigurationJson
    ) {
    }
}
