package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.repository.ProcessTaskDefinitionRepository;
import com.integrationhub.platform.repository.ProcessTaskExecutionRepository;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.service.TaskProviderRegistry;
import com.integrationhub.platform.service.execution.async.AsyncTaskCompletion;
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
 * <p><b>Continuacion downstream (M-2.1)</b>: tras un resume exitoso con tareas
 * pendientes despues de la suspendida, rehidrata el envelope capturado al
 * suspender ({@code taskOutputs} + variables + trigger), registra los outputs
 * del resume bajo el taskRef de la tarea y continua el pipeline desde
 * {@code taskOrder+1} — fuera de la transaccion del resume, con la misma
 * semantica del loop normal (incluida suspension anidada). Si el envelope no
 * existe (suspensiones pre-V16) o no fue serializable, degrada a
 * {@code COMPLETED_NEEDS_REDRIVE}.</p>
 *
 * @trace spec 003 T-017 (M-2 / M-2.1), ADR-009
 * @trace spec 008-mensajeria-pagos RF-019
 */
@ApplicationScoped
public class ProcessExecutionResumeService implements AsyncTaskCompletion {

    private final ProcessExecutionStateService stateService;
    private final ProcessTaskExecutionRepository taskExecutionRepository;
    private final ProcessTaskDefinitionRepository taskDefinitionRepository;
    private final TaskProviderRegistry taskProviderRegistry;
    private final JsonConfigurationMapper configurationMapper;
    private final SuspendedStateMarshaller stateMarshaller;
    private final SuspensionTokenGenerator tokenGenerator;
    private final ProcessExecutionAuditMapper auditMapper;
    private final SuspensionContinuation suspensionContinuation;
    private final TaskOutputRegistry taskOutputRegistry;
    private final ProcessExecutionService processExecutionService;

    public ProcessExecutionResumeService(
            ProcessExecutionStateService stateService,
            ProcessTaskExecutionRepository taskExecutionRepository,
            ProcessTaskDefinitionRepository taskDefinitionRepository,
            TaskProviderRegistry taskProviderRegistry,
            JsonConfigurationMapper configurationMapper,
            SuspendedStateMarshaller stateMarshaller,
            SuspensionTokenGenerator tokenGenerator,
            ProcessExecutionAuditMapper auditMapper,
            SuspensionContinuation suspensionContinuation,
            TaskOutputRegistry taskOutputRegistry,
            ProcessExecutionService processExecutionService) {
        this.stateService = stateService;
        this.taskExecutionRepository = taskExecutionRepository;
        this.taskDefinitionRepository = taskDefinitionRepository;
        this.taskProviderRegistry = taskProviderRegistry;
        this.configurationMapper = configurationMapper;
        this.stateMarshaller = stateMarshaller;
        this.tokenGenerator = tokenGenerator;
        this.auditMapper = auditMapper;
        this.suspensionContinuation = suspensionContinuation;
        this.taskOutputRegistry = taskOutputRegistry;
        this.processExecutionService = processExecutionService;
    }

    /**
     * Orquestador sin transaccion propia: la fase de resume corre en
     * {@link #resumeTransactional}; la continuacion del pipeline (que puede
     * ejecutar HTTP/SFTP/BD largos) corre fuera de esa transaccion.
     */
    public ResumeOutcome resume(String token, Map<String, Object> externalEvent) {
        return runContinuation(resumeTransactional(token, externalEvent));
    }

    /**
     * <b>Completación async (ADR-015 Etapa 4)</b>: la tarea ya se ejecutó en el consumer y aquí NO se
     * re-invoca al provider — se aplica el {@link TaskResult} ya calculado a la tarea suspendida por
     * despacho async (correlacionada por {@code processExecutionId + taskDefinitionId}) y se continúa
     * el pipeline. Idempotente: si la suspensión ya fue reanudada por una entrega anterior
     * (at-least-once), devuelve {@link Outcome#NOT_FOUND} sin efecto.
     */
    @Override
    public ResumeOutcome completeFromExternalResult(Long processExecutionId, Long taskDefinitionId, TaskResult result) {
        return runContinuation(completeTransactional(processExecutionId, taskDefinitionId, result));
    }

    /**
     * Continuación del pipeline fuera de la transacción (compartida por el resume por callback y por
     * la completación async). Si no hay continuación pendiente, devuelve el outcome terminal tal cual.
     */
    private ResumeOutcome runContinuation(ResumeCompletion completion) {
        if (completion.continuation() == null) {
            return completion.outcome();
        }
        var continuation = completion.continuation();
        try {
            var execution = processExecutionService.continueAfterResume(
                    continuation.processExecutionId(),
                    continuation.processDefinitionId(),
                    continuation.afterTaskOrder(),
                    continuation.taskOutputs(),
                    continuation.executionVariables(),
                    continuation.triggerSource());
            return switch (execution.status) {
                case COMPLETED -> new ResumeOutcome(Outcome.COMPLETED, null, true,
                        completion.outcome().details() + "; downstream tasks completed");
                case SUSPENDED -> new ResumeOutcome(Outcome.RE_SUSPENDED,
                        taskExecutionRepository.findActiveResumeToken(continuation.processExecutionId()),
                        false,
                        completion.outcome().details() + "; a downstream task suspended");
                default -> new ResumeOutcome(Outcome.FAILED, null, false,
                        "Downstream continuation ended with status " + execution.status);
            };
        } catch (RuntimeException error) {
            // executeTasks ya marco la tarea/proceso como FAILED; aqui solo
            // traducimos el resultado para el caller.
            var message = error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage();
            return new ResumeOutcome(Outcome.FAILED, null, false,
                    "Downstream continuation failed: " + message);
        }
    }

    /**
     * Fase transaccional de la completación async: correlaciona la tarea suspendida por ids, la marca
     * reanudada y aplica el resultado externo compartiendo la misma cola terminal que el resume
     * (completeTask/failProcess + continuación downstream), pero sin re-invocar al provider.
     */
    @Transactional
    ResumeCompletion completeTransactional(Long processExecutionId, Long taskDefinitionId, TaskResult result) {
        if (result.suspended()) {
            throw new IllegalArgumentException("La completación async no acepta resultados suspended");
        }
        var taskExecution = taskExecutionRepository.findActiveSuspendedByExecutionAndTask(
                processExecutionId, taskDefinitionId);
        if (taskExecution == null) {
            return ResumeCompletion.terminal(new ResumeOutcome(Outcome.NOT_FOUND, null, false,
                    "No hay suspensión async activa para exec=" + processExecutionId + " task=" + taskDefinitionId));
        }
        var taskDefinition = taskExecution.taskDefinition;
        if (taskDefinition == null) {
            throw new IllegalStateException("Suspended task " + taskExecution.id + " has no taskDefinition");
        }
        var processExecution = taskExecution.processExecution;
        var processDefinition = taskDefinition.processDefinition;
        var configuration = configurationMapper.toMap(taskDefinition.configurationJson);
        var resolvedProcessExecutionId = processExecution == null ? null : processExecution.id;
        var taskExecutionId = taskExecution.id;

        stateService.markResumed(taskExecutionId);
        return finishTerminalResult(taskExecution, taskDefinition, processDefinition,
                resolvedProcessExecutionId, taskExecutionId, configuration, result, taskExecution.resumeToken);
    }

    @Transactional
    ResumeCompletion resumeTransactional(String token, Map<String, Object> externalEvent) {
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
                    // El envelope previo sigue valido: los outputs de una tarea
                    // re-suspendida aun no son finales.
                    taskExecution.suspendedContinuation,
                    details,
                    Map.of("taskType", taskDefinition.taskType,
                            "resumeToken", newToken,
                            "rePhase", "re-suspended"));
            return ResumeCompletion.terminal(
                    new ResumeOutcome(Outcome.RE_SUSPENDED, newToken, false, result.details()));
        }

        return finishTerminalResult(taskExecution, taskDefinition, processDefinition,
                processExecutionId, taskExecutionId, configuration, result, token);
    }

    /**
     * Cola terminal compartida por el resume por callback y la completación async: aplica un
     * {@link TaskResult} <b>ya terminal</b> (success/failure) a la tarea suspendida —
     * completeTask/failProcess— y, si hay tareas downstream, prepara la {@link ContinuationRequest}
     * rehidratando el envelope capturado al suspender. No re-invoca al provider ni maneja re-suspensión
     * (eso vive antes, en el resume por callback).
     */
    private ResumeCompletion finishTerminalResult(
            com.integrationhub.platform.entity.ProcessTaskExecution taskExecution,
            com.integrationhub.platform.entity.ProcessTaskDefinition taskDefinition,
            com.integrationhub.platform.entity.ProcessDefinition processDefinition,
            Long processExecutionId,
            Long taskExecutionId,
            Map<String, Object> configuration,
            TaskResult result,
            String token) {
        if (!result.success()) {
            stateService.failTask(processExecutionId, taskExecutionId, result.details(), Map.of(
                    "taskType", taskDefinition.taskType,
                    "resumeToken", token == null ? "" : token));
            if (processExecutionId != null) {
                stateService.failProcess(processExecutionId, "Resume returned failure: " + result.details());
            }
            return ResumeCompletion.terminal(
                    new ResumeOutcome(Outcome.FAILED, null, false, result.details()));
        }

        var details = auditMapper.buildTaskDetails(auditTaskPlan(taskDefinition), result.details());
        stateService.completeTask(processExecutionId, taskExecutionId, details,
                Map.of("taskType", taskDefinition.taskType,
                        "outputs", result.outputs(),
                        "resumeToken", token == null ? "" : token));

        var downstreamCount = processDefinition == null
                ? 0
                : taskDefinitionRepository.countDownstreamTasks(processDefinition, taskDefinition.taskOrder);
        if (downstreamCount == 0) {
            if (processExecutionId != null) {
                stateService.completeProcess(processExecutionId, "Process completed after resume");
            }
            return ResumeCompletion.terminal(
                    new ResumeOutcome(Outcome.COMPLETED, null, true, result.details()));
        }

        // M-2.1: hay tareas downstream. Rehidratamos el envelope capturado al
        // suspender y registramos los outputs del resume bajo el taskRef de la
        // tarea, para continuar el pipeline fuera de esta transaccion.
        var envelope = suspensionContinuation.unmarshal(taskExecution.suspendedContinuation);
        if (envelope == null || processExecutionId == null || processDefinition == null
                || taskDefinition.taskOrder == null) {
            return ResumeCompletion.terminal(
                    new ResumeOutcome(Outcome.COMPLETED_NEEDS_REDRIVE, null, false, result.details()));
        }
        var taskOutputs = envelope.taskOutputs();
        if (result.outputs() != null && !result.outputs().isEmpty()) {
            taskOutputRegistry.registerTaskResult(taskOutputs, auditTaskPlan(taskDefinition),
                    configuration, result.outputs());
        }
        return new ResumeCompletion(
                new ResumeOutcome(Outcome.COMPLETED, null, false, result.details()),
                new ContinuationRequest(
                        processExecutionId,
                        processDefinition.id,
                        taskDefinition.taskOrder,
                        taskOutputs,
                        envelope.executionVariables(),
                        envelope.triggerSource()));
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
        FAILED,
        /** Completación async idempotente: no había suspensión activa (ya reanudada). */
        NOT_FOUND
    }

    public record ResumeOutcome(Outcome outcome,
                                 String nextResumeToken,
                                 boolean processCompleted,
                                 String details) {
    }

    /** Resultado de la fase transaccional: outcome + continuacion pendiente (o null). */
    record ResumeCompletion(ResumeOutcome outcome, ContinuationRequest continuation) {
        static ResumeCompletion terminal(ResumeOutcome outcome) {
            return new ResumeCompletion(outcome, null);
        }
    }

    /** Datos planos (sin entities) para continuar el pipeline fuera de la transaccion. */
    record ContinuationRequest(Long processExecutionId,
                               Long processDefinitionId,
                               int afterTaskOrder,
                               java.util.LinkedHashMap<String, Object> taskOutputs,
                               Map<String, String> executionVariables,
                               String triggerSource) {
    }

    public static class SuspensionNotFoundException extends RuntimeException {
        public SuspensionNotFoundException(String message) {
            super(message);
        }
    }
}
