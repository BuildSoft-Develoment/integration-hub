package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.spi.engine.ExecutionReconciliationGateway;
import com.integrationhub.platform.spi.execution.ExecutionStatus;
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
import java.util.Collection;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class ProcessExecutionStateService implements ExecutionReconciliationGateway {

    private final ProcessDefinitionRepository processDefinitionRepository;
    private final ProcessTaskDefinitionRepository processTaskDefinitionRepository;
    private final ProcessExecutionRepository processExecutionRepository;
    private final ProcessTaskExecutionRepository processTaskExecutionRepository;
    private final AuditService auditService;
    private final TaskOutboxStore taskOutboxStore;
    private final AsyncSliceDispatchService sliceDispatchService;
    private final MoneyMovementDetector moneyMovementDetector;

    public ProcessExecutionStateService(
            ProcessDefinitionRepository processDefinitionRepository,
            ProcessTaskDefinitionRepository processTaskDefinitionRepository,
            ProcessExecutionRepository processExecutionRepository,
            ProcessTaskExecutionRepository processTaskExecutionRepository,
            AuditService auditService,
            TaskOutboxStore taskOutboxStore,
            AsyncSliceDispatchService sliceDispatchService,
            MoneyMovementDetector moneyMovementDetector
    ) {
        this.processDefinitionRepository = processDefinitionRepository;
        this.processTaskDefinitionRepository = processTaskDefinitionRepository;
        this.processExecutionRepository = processExecutionRepository;
        this.processTaskExecutionRepository = processTaskExecutionRepository;
        this.auditService = auditService;
        this.taskOutboxStore = taskOutboxStore;
        this.sliceDispatchService = sliceDispatchService;
        this.moneyMovementDetector = moneyMovementDetector;
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
    public Long startProcess(Long processDefinitionId, String processName, Long sourceExecutionId, String triggerSource,
                             String executionToken) {
        var definition = processDefinitionRepository.findRequired(processDefinitionId);
        var execution = new ProcessExecution();
        execution.processDefinition = definition;
        execution.status = ExecutionStatus.RUNNING;
        // P2 (fencing): el path SÍNCRONO también fija un token, para que TODA transición del runtime sea guardada
        // uniformemente (sin caminos sin fencing). El path queued fija su token en el claim distribuido.
        execution.executionToken = executionToken;
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
     * ejecucion YA inicio una tarea que mueve dinero (efecto no-idempotente) -> {@code NEEDS_RECONCILIATION}
     * (nunca se re-ejecuta a ciegas; se resuelve por STATUS/RECONCILE); si NO -> {@code PENDING} (re-encolar).
     * Atomico por fila.
     *
     * <p>ADR-021 (E): la pregunta se le hace a la COLUMNA {@code moves_money} de la ejecucion de tarea, no al
     * tipo de la definicion. El tipo cubre lo que se sabe de pago por su nombre, pero deja fuera a la tarea
     * generica que entrega a un banco ({@code FILE_DELIVER} a un sink critico), y ademas se lee de la
     * definicion ACTUAL — que pudo cambiar entre la caida y este barrido. La columna se escribio al arrancar
     * la tarea, asi que dice lo que realmente paso.</p>
     */
    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public int recoverExpiredExecutions(int limit) {
        var now = LocalDateTime.now();
        var expiredIds = processExecutionRepository.listExpiredRunningIds(now, limit);
        var recovered = 0;
        for (var id : expiredIds) {
            var startedPay = processExecutionRepository.hasStartedMoneyMovement(id);
            var target = startedPay ? ExecutionStatus.NEEDS_RECONCILIATION : ExecutionStatus.PENDING;
            var detail = startedPay
                    ? "Recovered orphaned execution (lease expired) that already started a money-movement task; "
                            + "NEEDS_RECONCILIATION (no blind re-run; resolve via STATUS/RECONCILE)"
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

    /**
     * P2 (fencing): confirma que ESTE worker sigue siendo el dueño RUNNING (token) antes de mutar estado. 0 filas ⇒
     * perdió el token (lease vencido, recuperado por otro nodo) ⇒ {@link FencingTokenLostException} (aborta el worker).
     */
    private void assertOwner(Long processExecutionId, String executionToken, String operation) {
        if (processExecutionRepository.touchRunningOwner(processExecutionId, executionToken, LocalDateTime.now()) == 0) {
            throw new FencingTokenLostException(processExecutionId, operation);
        }
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public Long startTask(Long processExecutionId, String executionToken, Long taskDefinitionId, String taskType, Integer taskOrder) {
        assertOwner(processExecutionId, executionToken, "startTask");
        var execution = processExecutionRepository.findById(processExecutionId);
        var taskDefinition = processTaskDefinitionRepository.findById(taskDefinitionId);
        var taskExecution = new ProcessTaskExecution();
        taskExecution.processExecution = execution;
        taskExecution.taskDefinition = taskDefinition;
        taskExecution.movesMoney = moneyMovementDetector.movesMoney(taskType, taskDefinition.configurationJson);
        taskExecution.status = ExecutionStatus.RUNNING;
        taskExecution.executedAt = LocalDateTime.now();
        taskExecution.startedAt = taskExecution.executedAt;
        processTaskExecutionRepository.persist(taskExecution);
        auditService.record(execution, taskDefinition, "TASK_STARTED", "RUNNING", "Task execution started", Map.of("taskType", taskType, "taskOrder", taskOrder));
        return taskExecution.id;
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void completeTask(Long processExecutionId, String executionToken, Long taskExecutionId, String details, Object payload) {
        assertOwner(processExecutionId, executionToken, "completeTask");
        var execution = processExecutionRepository.findById(processExecutionId);
        var taskExecution = processTaskExecutionRepository.findById(taskExecutionId);
        taskExecution.status = ExecutionStatus.COMPLETED;
        taskExecution.finishedAt = LocalDateTime.now();
        taskExecution.details = details;
        auditService.record(execution, taskExecution.taskDefinition, "TASK_COMPLETED", "COMPLETED", details, payload);
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void failTask(Long processExecutionId, String executionToken, Long taskExecutionId, String message, Object payload) {
        assertOwner(processExecutionId, executionToken, "failTask");
        var execution = processExecutionRepository.findById(processExecutionId);
        var taskExecution = processTaskExecutionRepository.findById(taskExecutionId);
        taskExecution.status = ExecutionStatus.FAILED;
        taskExecution.finishedAt = LocalDateTime.now();
        taskExecution.details = message;
        auditService.record(execution, taskExecution.taskDefinition, "TASK_FAILED", "FAILED", message, payload);
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void completeTaskWithErrors(Long processExecutionId, String executionToken, Long taskExecutionId, String details, Object payload) {
        assertOwner(processExecutionId, executionToken, "completeTaskWithErrors");
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
     * @trace spec 003-diseno-y-ejecucion-procesos T-017 (M-2 suspension engine), ADR-009
     */
    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void suspendTask(Long processExecutionId,
                            String executionToken,
                            Long taskExecutionId,
                            String suspendedStateJson,
                            String resumeToken,
                            LocalDateTime expiresAt,
                            String details,
                            Object auditPayload) {
        suspendTask(processExecutionId, executionToken, taskExecutionId, suspendedStateJson, resumeToken,
                expiresAt, null, details, auditPayload);
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void suspendTask(Long processExecutionId,
                            String executionToken,
                            Long taskExecutionId,
                            String suspendedStateJson,
                            String resumeToken,
                            LocalDateTime expiresAt,
                            String continuationJson,
                            String details,
                            Object auditPayload) {
        suspendTask(processExecutionId, executionToken, taskExecutionId, suspendedStateJson, resumeToken,
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
                            String executionToken,
                            Long taskExecutionId,
                            String suspendedStateJson,
                            String resumeToken,
                            LocalDateTime expiresAt,
                            String continuationJson,
                            String details,
                            Object auditPayload,
                            AsyncTaskEnvelope asyncDispatch) {
        persistSuspension(processExecutionId, executionToken, taskExecutionId, suspendedStateJson, resumeToken,
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
                            String executionToken,
                            Long taskExecutionId,
                            String suspendedStateJson,
                            String resumeToken,
                            LocalDateTime expiresAt,
                            String continuationJson,
                            String details,
                            Object auditPayload,
                            AsyncSliceDispatchService.ScatterDispatch scatterDispatch) {
        persistSuspension(processExecutionId, executionToken, taskExecutionId, suspendedStateJson, resumeToken,
                expiresAt, continuationJson, details, auditPayload);
        if (scatterDispatch != null) {
            sliceDispatchService.dispatchSlices(scatterDispatch);
        }
    }

    private void persistSuspension(Long processExecutionId,
                                   String executionToken,
                                   Long taskExecutionId,
                                   String suspendedStateJson,
                                   String resumeToken,
                                   LocalDateTime expiresAt,
                                   String continuationJson,
                                   String details,
                                   Object auditPayload) {
        assertOwner(processExecutionId, executionToken, "suspendTask");
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

    /** P2 (fencing): transición terminal guardada por token+RUNNING; 0 filas ⇒ token perdido ⇒ aborta sin sobrescribir. */
    private void transitionProcessTerminal(Long processExecutionId, String executionToken, ExecutionStatus toStatus,
                                           String details, String auditType, String operation) {
        var rows = processExecutionRepository.transitionRunningProcess(
                processExecutionId, executionToken, toStatus, details, LocalDateTime.now());
        if (rows == 0) {
            throw new FencingTokenLostException(processExecutionId, operation);
        }
        var execution = processExecutionRepository.findById(processExecutionId);
        auditService.record(execution, null, auditType, toStatus.name(), details, null);
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void completeProcess(Long processExecutionId, String executionToken, String details) {
        transitionProcessTerminal(processExecutionId, executionToken, ExecutionStatus.COMPLETED, details,
                "PROCESS_COMPLETED", "completeProcess");
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void failProcess(Long processExecutionId, String executionToken, String message) {
        transitionProcessTerminal(processExecutionId, executionToken, ExecutionStatus.FAILED, message,
                "PROCESS_FAILED", "failProcess");
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void completeProcessWithErrors(Long processExecutionId, String executionToken, String details) {
        transitionProcessTerminal(processExecutionId, executionToken, ExecutionStatus.COMPLETED_WITH_ERRORS, details,
                "PROCESS_COMPLETED_WITH_ERRORS", "completeProcessWithErrors");
    }

    /**
     * G1 — cierra la ejecución en {@code NEEDS_RECONCILIATION} cuando una tarea del money-path dejó dinero en estado
     * ambiguo (MT101_PAY normal con fragmentos {@code UNCERTAIN}). NO es COMPLETED silencioso ni FAILED opaco: obliga a
     * conciliar (STATUS/RECONCILE) y reusa el ciclo de cierre de {@link #closeReconciled}. Guardado por token+RUNNING
     * (fencing), igual que los demás terminales.
     */
    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void markNeedsReconciliation(Long processExecutionId, String executionToken, String details) {
        transitionProcessTerminal(processExecutionId, executionToken, ExecutionStatus.NEEDS_RECONCILIATION, details,
                "PROCESS_NEEDS_RECONCILIATION", "markNeedsReconciliation");
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public ProcessExecution getExecution(Long processExecutionId) {
        return processExecutionRepository.findById(processExecutionId);
    }

    /**
     * ADR-021: la version del puerto — devuelve solo el estado, no la entidad. Quien concilia no
     * necesita (ni debe) tener en la mano un {@code ProcessExecution} de JPA.
     */
    @Override
    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public ExecutionStatus statusOf(Long processExecutionId) {
        var execution = processExecutionRepository.findById(processExecutionId);
        return execution == null ? null : execution.status;
    }

    /**
     * v54-fix: cierra una ejecucion en {@code NEEDS_RECONCILIATION} (tras reconciliar sus fragmentos) hacia
     * {@code COMPLETED} o {@code COMPLETED_WITH_ERRORS}. Atomico ({@code WHERE status='NEEDS_RECONCILIATION'}): no
     * cierra dos veces ni desde otro estado. El guard de terminalidad de fragmentos vive en el caller MT101. NO
     * re-ejecuta ni reenvia; solo cierra el estado del motor. Devuelve false si ya no estaba en NEEDS_RECONCILIATION.
     */
    @Transactional(Transactional.TxType.REQUIRES_NEW)
    @Override
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
