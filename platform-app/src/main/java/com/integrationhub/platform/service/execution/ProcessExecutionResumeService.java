package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.repository.ProcessTaskDefinitionRepository;
import com.integrationhub.platform.repository.ProcessTaskExecutionRepository;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.service.TaskProviderRegistry;
import com.integrationhub.platform.spi.task.SuspendableTaskProvider;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Reanuda una tarea suspendida (M-2). Punto de entrada del callback externo
 * o del scheduler periodico.
 *
 * <p><b>Limitacion de scope (foundation)</b>: tras un resume exitoso solo se
 * marca la tarea como completada y, si era la <i>ultima</i> del proceso, se
 * marca el proceso como COMPLETED. Si quedan tareas downstream, el proceso
 * permanece en {@code RUNNING} y requiere re-drive manual (la continuacion
 * automatica del pipeline desde un punto intermedio es trabajo futuro:
 * implica rehidratar {@code taskOutputs} persistido).</p>
 *
 * <p>El typical use case de la vertical 008 (suspension en {@code MT101_STATUS}
 * que suele ser la ultima tarea del pipeline) queda cubierto al 100%.</p>
 *
 * @trace spec 003 T-017 (M-2 suspension engine), ADR-009
 * @trace spec 008-mensajeria-pagos RF-019
 */
@ApplicationScoped
public class ProcessExecutionResumeService {

    private final ProcessExecutionStateService stateService;
    private final ProcessTaskExecutionRepository taskExecutionRepository;
    private final ProcessTaskDefinitionRepository taskDefinitionRepository;
    private final TaskProviderRegistry taskProviderRegistry;
    private final JsonConfigurationMapper configurationMapper;
    private final SuspendedStateMarshaller stateMarshaller;
    private final SuspensionTokenGenerator tokenGenerator;
    private final ProcessExecutionAuditMapper auditMapper;

    public ProcessExecutionResumeService(
            ProcessExecutionStateService stateService,
            ProcessTaskExecutionRepository taskExecutionRepository,
            ProcessTaskDefinitionRepository taskDefinitionRepository,
            TaskProviderRegistry taskProviderRegistry,
            JsonConfigurationMapper configurationMapper,
            SuspendedStateMarshaller stateMarshaller,
            SuspensionTokenGenerator tokenGenerator,
            ProcessExecutionAuditMapper auditMapper) {
        this.stateService = stateService;
        this.taskExecutionRepository = taskExecutionRepository;
        this.taskDefinitionRepository = taskDefinitionRepository;
        this.taskProviderRegistry = taskProviderRegistry;
        this.configurationMapper = configurationMapper;
        this.stateMarshaller = stateMarshaller;
        this.tokenGenerator = tokenGenerator;
        this.auditMapper = auditMapper;
    }

    @Transactional
    public ResumeOutcome resume(String token, Map<String, Object> externalEvent) {
        // Repo directo (no via stateService.findActiveSuspension) para que la entity
        // quede attached a la sesion del @Transactional de este metodo. Asi las
        // relaciones lazy (taskDefinition.processDefinition) se resuelven sin
        // LazyInitializationException.
        var taskExecution = taskExecutionRepository.findActiveByResumeToken(token);
        if (taskExecution == null) {
            throw new SuspensionNotFoundException(
                    "No active suspension found for token (already resumed or invalid)");
        }
        var taskDefinition = taskExecution.taskDefinition;
        if (taskDefinition == null) {
            throw new IllegalStateException(
                    "Suspended task " + taskExecution.id + " has no taskDefinition");
        }
        var processExecution = taskExecution.processExecution;
        var processDefinition = taskDefinition.processDefinition;

        var provider = taskProviderRegistry.resolve(taskDefinition.taskType);
        if (!(provider instanceof SuspendableTaskProvider suspendable)) {
            throw new IllegalStateException(
                    "Task type '" + taskDefinition.taskType + "' is not suspendable; "
                            + "cannot resume task " + taskExecution.id);
        }

        var configuration = configurationMapper.toMap(taskDefinition.configurationJson);
        var stateBeforeResume = stateMarshaller.unmarshal(taskExecution.suspendedState);
        var mergedState = new LinkedHashMap<String, Object>(stateBeforeResume);
        if (externalEvent != null && !externalEvent.isEmpty()) {
            mergedState.put("externalEvent", externalEvent);
        }

        var processExecutionId = processExecution == null ? null : processExecution.id;
        var taskContext = new TaskContext(processExecutionId, taskDefinition.id);
        var taskExecutionId = taskExecution.id;

        stateService.markResumed(taskExecutionId);

        TaskResult result;
        try {
            result = suspendable.resume(taskContext, configuration, mergedState);
        } catch (RuntimeException error) {
            var message = error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage();
            stateService.failTask(processExecutionId, taskExecutionId, message, Map.of(
                    "taskType", taskDefinition.taskType,
                    "resumeToken", token,
                    "phase", "resume"));
            if (processExecutionId != null) {
                stateService.failProcess(processExecutionId, "Resume failed: " + message);
            }
            throw error;
        }

        if (result.suspended()) {
            var newToken = tokenGenerator.generate();
            var stateJson = stateMarshaller.marshal(result.suspendedState());
            var details = auditMapper.buildTaskDetails(
                    auditTaskPlan(taskDefinition),
                    result.details());
            stateService.suspendTask(
                    processExecutionId, taskExecutionId, stateJson, newToken,
                    SuspensionExpiry.expiresAt(result.suspendedState()),
                    details,
                    Map.of("taskType", taskDefinition.taskType,
                            "resumeToken", newToken,
                            "rePhase", "re-suspended"));
            return new ResumeOutcome(Outcome.RE_SUSPENDED, newToken, false, result.details());
        }

        if (!result.success()) {
            stateService.failTask(processExecutionId, taskExecutionId, result.details(), Map.of(
                    "taskType", taskDefinition.taskType,
                    "resumeToken", token));
            if (processExecutionId != null) {
                stateService.failProcess(processExecutionId, "Resume returned failure: " + result.details());
            }
            return new ResumeOutcome(Outcome.FAILED, null, false, result.details());
        }

        var details = auditMapper.buildTaskDetails(auditTaskPlan(taskDefinition), result.details());
        stateService.completeTask(processExecutionId, taskExecutionId, details,
                Map.of("taskType", taskDefinition.taskType,
                        "outputs", result.outputs(),
                        "resumeToken", token));

        var downstreamCount = processDefinition == null
                ? 0
                : taskDefinitionRepository.countDownstreamTasks(processDefinition, taskDefinition.taskOrder);
        var processCompleted = downstreamCount == 0;
        if (processCompleted && processExecutionId != null) {
            stateService.completeProcess(processExecutionId, "Process completed after resume");
        }
        return new ResumeOutcome(
                processCompleted ? Outcome.COMPLETED : Outcome.COMPLETED_NEEDS_REDRIVE,
                null,
                processCompleted,
                result.details());
    }

    private ProcessExecutionStateService.TaskPlan auditTaskPlan(
            com.integrationhub.platform.entity.ProcessTaskDefinition definition) {
        return new ProcessExecutionStateService.TaskPlan(
                definition.id,
                definition.taskOrder,
                definition.taskType,
                definition.configurationJson,
                null, null, null, null, null, null, null);
    }

    public enum Outcome {
        /** Resume completo y proceso ya cerrado (era la ultima tarea). */
        COMPLETED,
        /** Resume completo pero quedan tareas downstream sin ejecutar. */
        COMPLETED_NEEDS_REDRIVE,
        /** El provider volvio a suspender; hay un nuevo {@code resumeToken}. */
        RE_SUSPENDED,
        /** El provider retorno failure; el proceso queda FAILED. */
        FAILED
    }

    public record ResumeOutcome(Outcome outcome,
                                 String nextResumeToken,
                                 boolean processCompleted,
                                 String details) {
    }

    public static class SuspensionNotFoundException extends RuntimeException {
        public SuspensionNotFoundException(String message) {
            super(message);
        }
    }
}
