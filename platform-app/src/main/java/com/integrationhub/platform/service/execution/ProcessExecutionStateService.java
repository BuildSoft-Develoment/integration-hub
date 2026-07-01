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

    public ProcessExecutionStateService(
            ProcessDefinitionRepository processDefinitionRepository,
            ProcessTaskDefinitionRepository processTaskDefinitionRepository,
            ProcessExecutionRepository processExecutionRepository,
            ProcessTaskExecutionRepository processTaskExecutionRepository,
            AuditService auditService
    ) {
        this.processDefinitionRepository = processDefinitionRepository;
        this.processTaskDefinitionRepository = processTaskDefinitionRepository;
        this.processExecutionRepository = processExecutionRepository;
        this.processTaskExecutionRepository = processTaskExecutionRepository;
        this.auditService = auditService;
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

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public boolean markProcessRunningIfPending(Long processExecutionId) {
        var execution = processExecutionRepository.findById(processExecutionId);
        if (execution == null || execution.status != ExecutionStatus.PENDING) {
            return false;
        }
        execution.status = ExecutionStatus.RUNNING;
        execution.details = "Process execution started";
        auditService.record(execution, null, "PROCESS_STARTED", "RUNNING", "Process execution started", Map.of(
                "processDefinitionId", execution.processDefinition.id,
                "processName", execution.processDefinition.name
        ));
        return true;
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
