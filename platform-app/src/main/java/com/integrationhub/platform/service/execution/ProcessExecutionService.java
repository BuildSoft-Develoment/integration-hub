package com.integrationhub.platform.service.execution;

// @trace spec 003-diseno-y-ejecucion-procesos RF-005 (reingenieria: clase que implementa el/los RF en produccion)

import com.integrationhub.platform.service.execution.fastpath.ExecutionFastPath;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.source.SourcePayload;
import io.opentelemetry.api.trace.StatusCode;
import io.opentelemetry.api.trace.Tracer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;

import java.util.List;
import java.util.Map;

@ApplicationScoped
public class ProcessExecutionService {

    private final ProcessExecutionStateService processExecutionStateService;
    private final ProcessTaskRuntimeService processTaskRuntimeService;
    private final ProcessExecutionAuditMapper auditMapper;
    private final Instance<ExecutionFastPath> fastPaths;
    private final TaskOutputRegistry taskOutputRegistry;
    private final Tracer tracer;
    private final SuspensionTokenGenerator suspensionTokenGenerator;
    private final SuspendedStateMarshaller suspendedStateMarshaller;
    private final SuspensionContinuation suspensionContinuation;

    public ProcessExecutionService(
            ProcessExecutionStateService processExecutionStateService,
            ProcessTaskRuntimeService processTaskRuntimeService,
            ProcessExecutionAuditMapper auditMapper,
            Instance<ExecutionFastPath> fastPaths,
            TaskOutputRegistry taskOutputRegistry,
            Tracer tracer,
            SuspensionTokenGenerator suspensionTokenGenerator,
            SuspendedStateMarshaller suspendedStateMarshaller,
            SuspensionContinuation suspensionContinuation
    ) {
        this.processExecutionStateService = processExecutionStateService;
        this.processTaskRuntimeService = processTaskRuntimeService;
        this.auditMapper = auditMapper;
        this.fastPaths = fastPaths;
        this.taskOutputRegistry = taskOutputRegistry;
        this.tracer = tracer;
        this.suspensionTokenGenerator = suspensionTokenGenerator;
        this.suspendedStateMarshaller = suspendedStateMarshaller;
        this.suspensionContinuation = suspensionContinuation;
    }

    public com.integrationhub.platform.entity.ProcessExecution execute(Long processDefinitionId) {
        return execute(processDefinitionId, Map.of(), List.of(), null, "MANUAL");
    }

    public com.integrationhub.platform.entity.ProcessExecution execute(Long processDefinitionId,
                                                                        Map<String, String> executionVariables,
                                                                        String triggerSource) {
        return execute(processDefinitionId, executionVariables, List.of(), null, triggerSource);
    }

    public com.integrationhub.platform.entity.ProcessExecution execute(Long processDefinitionId,
                                                                        Map<String, String> executionVariables,
                                                                        List<String> selectedFiles,
                                                                        Long sourceExecutionId,
                                                                        String triggerSource) {
        var normalizedExecutionVariables = executionVariables == null ? Map.<String, String>of() : Map.copyOf(executionVariables);
        var normalizedSelectedFiles = selectedFiles == null ? List.<String>of() : selectedFiles.stream().filter(value -> value != null && !value.isBlank()).map(String::trim).distinct().toList();
        var normalizedTriggerSource = triggerSource == null || triggerSource.isBlank() ? "MANUAL" : triggerSource;

        var processSpan = tracer.spanBuilder("process.execute").startSpan();
        processSpan.setAttribute("process.definition.id", processDefinitionId);
        processSpan.setAttribute("process.trigger.source", normalizedTriggerSource);

        var plan = processExecutionStateService.loadExecutionPlan(processDefinitionId);
        processSpan.setAttribute("process.definition.name", plan.processName());
        // P2 (fencing): el path síncrono también fija un token de ejecución, para que TODA transición sea guardada
        // uniformemente (sin caminos sin fencing). El path queued usa el token del claim distribuido.
        var executionToken = java.util.UUID.randomUUID().toString();
        var processExecutionId = processExecutionStateService.startProcess(plan.processDefinitionId(), plan.processName(), sourceExecutionId, normalizedTriggerSource, executionToken);
        return executeLoadedPlan(plan, processExecutionId, executionToken, normalizedExecutionVariables, normalizedSelectedFiles, normalizedTriggerSource, processSpan);
    }

    public com.integrationhub.platform.entity.ProcessExecution executeQueued(Long processExecutionId,
                                                                             String executionToken,
                                                                             Long processDefinitionId,
                                                                             Map<String, String> executionVariables,
                                                                             List<String> selectedFiles,
                                                                             String triggerSource) {
        var normalizedExecutionVariables = executionVariables == null ? Map.<String, String>of() : Map.copyOf(executionVariables);
        var normalizedSelectedFiles = selectedFiles == null ? List.<String>of() : selectedFiles.stream().filter(value -> value != null && !value.isBlank()).map(String::trim).distinct().toList();
        var normalizedTriggerSource = triggerSource == null || triggerSource.isBlank() ? "MANUAL" : triggerSource;

        var processSpan = tracer.spanBuilder("process.execute.async").startSpan();
        processSpan.setAttribute("process.execution.id", processExecutionId);
        processSpan.setAttribute("process.definition.id", processDefinitionId);
        processSpan.setAttribute("process.trigger.source", normalizedTriggerSource);

        var plan = processExecutionStateService.loadExecutionPlan(processDefinitionId);
        processSpan.setAttribute("process.definition.name", plan.processName());
        return executeLoadedPlan(plan, processExecutionId, executionToken, normalizedExecutionVariables, normalizedSelectedFiles, normalizedTriggerSource, processSpan);
    }

    /**
     * Continuacion M-2.1: tras un resume exitoso con tareas downstream, rehidrata
     * el contexto del pipeline (capturado al suspender) y ejecuta las tareas con
     * {@code taskOrder > afterTaskOrder} con la misma semantica del loop normal
     * (fast-paths, suspension anidada, fallo de proceso).
     */
    public com.integrationhub.platform.entity.ProcessExecution continueAfterResume(
            Long processExecutionId,
            String executionToken,
            int afterTaskOrder,
            List<ProcessExecutionStateService.TaskPlan> remainingTasks,
            java.util.LinkedHashMap<String, Object> taskOutputs,
            Map<String, String> executionVariables,
            String triggerSource) {
        var normalizedVariables = executionVariables == null ? Map.<String, String>of() : Map.copyOf(executionVariables);
        var normalizedTriggerSource = triggerSource == null || triggerSource.isBlank() ? "RESUME" : triggerSource;
        var processSpan = tracer.spanBuilder("process.execute.continuation").startSpan();
        processSpan.setAttribute("process.execution.id", processExecutionId);
        processSpan.setAttribute("process.continuation.after-order", afterTaskOrder);

        // El plan viene CONGELADO del envelope de suspension, no releido de la definicion. Antes se
        // hacia `loadExecutionPlan(processDefinitionId)` + filtro por `taskOrder > afterTaskOrder`, y
        // como el guardado de un proceso reasigna los `taskOrder`, editarlo durante la suspension
        // cambiaba el conjunto de tareas que reanudaba: podia saltarse una o correr otra que nunca
        // estuvo en su plan. Con MT101_PAY suspendido esperando al banco, eso mueve dinero.
        return executeTasks(remainingTasks, processExecutionId, executionToken, normalizedVariables, List.of(),
                normalizedTriggerSource, processSpan, taskOutputs);
    }

    private com.integrationhub.platform.entity.ProcessExecution executeLoadedPlan(ProcessExecutionStateService.ExecutionPlan plan,
                                                                                  Long processExecutionId,
                                                                                  String executionToken,
                                                                                  Map<String, String> executionVariables,
                                                                                  List<String> selectedFiles,
                                                                                  String triggerSource,
                                                                                  io.opentelemetry.api.trace.Span processSpan) {
        return executeTasks(plan.tasks(), processExecutionId, executionToken, executionVariables, selectedFiles,
                triggerSource, processSpan, new java.util.LinkedHashMap<>());
    }

    private com.integrationhub.platform.entity.ProcessExecution executeTasks(List<ProcessExecutionStateService.TaskPlan> tasks,
                                                                              Long processExecutionId,
                                                                              String executionToken,
                                                                              Map<String, String> executionVariables,
                                                                              List<String> selectedFiles,
                                                                              String triggerSource,
                                                                              io.opentelemetry.api.trace.Span processSpan,
                                                                              java.util.LinkedHashMap<String, Object> taskOutputs) {
        try {
            SourcePayload sourcePayload = null;
            ReadResult readResult = null;
            // G1: alguna tarea del money-path dejó dinero ambiguo (MT101_PAY normal con UNCERTAIN). El proceso NO puede
            // cerrar COMPLETED silencioso; al final del pipeline se enruta a NEEDS_RECONCILIATION.
            boolean executionNeedsReconciliation = false;

            for (int index = 0; index < tasks.size(); index++) {
                var taskPlan = tasks.get(index);
                var nextTaskPlan = index + 1 < tasks.size() ? tasks.get(index + 1) : null;

                // 1. Try Optimized Fast Paths (e.g. Pipeline FILE_READ -> BATCH_SINK)
                var fastPath = resolveFastPath(taskPlan, nextTaskPlan);
                if (fastPath != null) {
                    var result = fastPath.execute(processExecutionId, executionToken, taskPlan, nextTaskPlan, executionVariables, selectedFiles, triggerSource, taskOutputs);
                    if (result != null) return result; // Pipeline forced an early exit
                    index += fastPath.consumedTaskCount() - 1;
                    continue;
                }

                // 2. Regular Sequential Path
                var taskSpan = tracer.spanBuilder("process.task.execute")
                        .setAttribute("task.definition.id", taskPlan.taskDefinitionId())
                        .setAttribute("task.order", taskPlan.taskOrder())
                        .setAttribute("task.type", taskPlan.taskType())
                        .startSpan();

                var taskExecutionId = processExecutionStateService.startTask(processExecutionId, executionToken, taskPlan.taskDefinitionId(), taskPlan.taskType(), taskPlan.taskOrder());
                try {
                    var taskConfiguration = taskOutputRegistry.configuration(taskPlan.configurationJson());
                    var runResult = processTaskRuntimeService.runTask(processExecutionId, taskPlan, sourcePayload, readResult, executionVariables, taskOutputs, selectedFiles, triggerSource);
                    String taskDetails;
                    Object taskPayload;

                    // M-2: el provider pidio suspender (callback externo, polling, approval).
                    // Persistimos el state + token, salimos del loop sin marcar fail.
                    // El proceso queda SUSPENDED hasta que llegue POST /api/process-executions/resume/{token}
                    // o un scheduler periodico re-invoque al provider.
                    if (runResult.suspended()) {
                        var token = suspensionTokenGenerator.generate();
                        var stateJson = suspendedStateMarshaller.marshal(runResult.suspendedState());
                        var details = auditMapper.buildTaskDetails(taskPlan, runResult.details());
                        var payload = Map.of(
                                "taskType", taskPlan.taskType(),
                                "resumeToken", token,
                                "suspendedState", runResult.suspendedState());
                        // M-2.1: capturamos el contexto del pipeline para que el
                        // resume pueda continuar las tareas downstream. El PLAN restante viaja
                        // congelado junto al contexto: si alguien edita el proceso mientras esta
                        // suspendido, la reanudacion debe correr el grafo que esta ejecucion tenia,
                        // no el que haya entonces.
                        var continuationJson = suspensionContinuation.marshal(
                                taskOutputs, executionVariables, triggerSource,
                                List.copyOf(tasks.subList(index + 1, tasks.size())));
                        var suspensionExpiry = SuspensionExpiry.expiresAt(runResult.suspendedState());
                        if (runResult.scatterDispatch() != null) {
                            // Opción B: abre el tracker N→1 y encola los N work-items de slice en ESTA
                            // misma transaccion que la suspension (atomico).
                            processExecutionStateService.suspendTask(
                                    processExecutionId, executionToken, taskExecutionId, stateJson, token, suspensionExpiry,
                                    continuationJson, details, payload, runResult.scatterDispatch());
                        } else {
                            // ADR-015: si es despacho async per-task, el work-item se encola en el outbox
                            // en ESTA misma transaccion (transactional outbox).
                            processExecutionStateService.suspendTask(
                                    processExecutionId, executionToken, taskExecutionId, stateJson, token, suspensionExpiry,
                                    continuationJson, details, payload, runResult.asyncDispatch());
                        }
                        taskSpan.setAttribute("task.suspended", true);
                        taskSpan.setAttribute("task.resume.token", token);
                        return processExecutionStateService.getExecution(processExecutionId);
                    }

                    if (runResult.fileRead()) {
                        sourcePayload = runResult.sourcePayload();
                        readResult = runResult.readResult();
                        taskOutputRegistry.registerFileRead(taskOutputs, taskPlan, taskConfiguration, sourcePayload, readResult);
                        taskDetails = auditMapper.buildReadDetails(taskPlan.sourceName(), readResult, List.of());
                        taskPayload = auditMapper.buildReadAuditPayload(taskPlan, readResult, List.of(), List.of(), executionVariables, triggerSource);
                        taskSpan.setAttribute("records.count", readResult.recordCount());
                    } else {
                        taskDetails = auditMapper.buildTaskDetails(taskPlan, runResult.details());
                        if (runResult.outputs() != null && !runResult.outputs().isEmpty()) {
                            // Los outputs se registran incluso en failure: contienen los
                            // errors que una NOTIFICATION downstream (con continueOnFailure)
                            // necesita para alertar.
                            taskOutputRegistry.registerTaskResult(taskOutputs, taskPlan, taskConfiguration, runResult.outputs());
                        }
                        taskPayload = Map.of("taskType", taskPlan.taskType(), "outputs", runResult.outputs());
                    }

                    // TaskResult.failure() es un fallo de negocio (validacion con errores,
                    // pagos rechazados): por defecto detiene el proceso. En pagos, una
                    // validacion fallida nunca debe quedar como tarea "completada".
                    // configuration.continueOnFailure=true es la politica explicita para
                    // flujos que siguen con los elementos validos (e.g. masivo donde el
                    // gate de fragmentos VALIDATED/REJECTED ya aisla los invalidos).
                    if (!runResult.suspended() && !runResult.fileRead() && !runResult.success()) {
                        // G1: dinero ambiguo (MT101_PAY normal con UNCERTAIN). No es fallo técnico ni éxito: la tarea
                        // queda COMPLETED_WITH_ERRORS y el proceso se cierra NEEDS_RECONCILIATION (nunca COMPLETED
                        // silencioso ni FAILED opaco). Con continueOnFailure sigue el pipeline (un STATUS/RECONCILE
                        // posterior puede resolver) y el terminal se decide al final; sin él, cierra ya.
                        if (runResult.needsReconciliation()) {
                            executionNeedsReconciliation = true;
                            processExecutionStateService.completeTaskWithErrors(
                                    processExecutionId, executionToken, taskExecutionId, taskDetails, taskPayload);
                            taskSpan.setAttribute("task.needs.reconciliation", true);
                            if (boolValue(taskConfiguration.get("continueOnFailure"), false)) {
                                continue;
                            }
                            processExecutionStateService.markNeedsReconciliation(processExecutionId, executionToken,
                                    "Task " + taskPlan.taskType() + " left ambiguous payments: " + runResult.details());
                            return processExecutionStateService.getExecution(processExecutionId);
                        }
                        if (boolValue(taskConfiguration.get("continueOnFailure"), false)) {
                            processExecutionStateService.completeTaskWithErrors(
                                    processExecutionId, executionToken, taskExecutionId, taskDetails, taskPayload);
                            taskSpan.setAttribute("task.completed.with.errors", true);
                            continue;
                        }
                        // El output de la tarea viaja tambien al fallar: ahi deja el provider el motivo real
                        // (MT101_PAY publica en `errors` el lastError por fragmento no despachado). Antes se emitia
                        // solo el plan y el unico rastro de un pago no entregado era el contador invalidated=N.
                        processExecutionStateService.failTask(processExecutionId, executionToken, taskExecutionId, taskDetails,
                                auditMapper.buildTaskFailurePayload(taskPlan, executionVariables, triggerSource, taskPayload));
                        processExecutionStateService.failProcess(processExecutionId, executionToken,
                                "Task " + taskPlan.taskType() + " failed: " + runResult.details());
                        taskSpan.setStatus(StatusCode.ERROR, runResult.details());
                        return processExecutionStateService.getExecution(processExecutionId);
                    }

                    // G1 (opción B): un resolutor (STATUS con resolveNormalPay) que resolvió TODA la ambigüedad limpia
                    // el flag: si no queda dinero incierto, el proceso puede cerrar COMPLETED en vez de NEEDS_RECONCILIATION.
                    if (runResult.reconciliationResolved()) {
                        executionNeedsReconciliation = false;
                    }
                    processExecutionStateService.completeTask(processExecutionId, executionToken, taskExecutionId, taskDetails, taskPayload);
                } catch (FencingTokenLostException fence) {
                    // P2: perdimos el token (lease vencido, recuperado por otro nodo). NO fallamos la tarea (eso
                    // también estaría fenced y sobrescribiría estado ajeno): abortamos el worker limpiamente.
                    taskSpan.setStatus(StatusCode.ERROR, "fencing token lost");
                    throw fence;
                } catch (Exception taskError) {
                    var message = taskError.getMessage() == null ? taskError.getClass().getSimpleName() : taskError.getMessage();
                    processExecutionStateService.failTask(processExecutionId, executionToken, taskExecutionId, message, auditMapper.buildTaskFailurePayload(taskPlan, executionVariables, triggerSource));
                    taskSpan.recordException(taskError);
                    taskSpan.setStatus(StatusCode.ERROR, message);
                    throw taskError;
                } finally {
                    taskSpan.end();
                }
            }

            // G1: si alguna tarea (con continueOnFailure) dejó dinero ambiguo, el proceso cierra NEEDS_RECONCILIATION,
            // no COMPLETED: fuerza conciliación en vez de aparentar éxito con pagos UNCERTAIN pendientes.
            if (executionNeedsReconciliation) {
                processExecutionStateService.markNeedsReconciliation(processExecutionId, executionToken,
                        "Process completed with ambiguous payments pending reconciliation (UNCERTAIN)");
                return processExecutionStateService.getExecution(processExecutionId);
            }
            processExecutionStateService.completeProcess(processExecutionId, executionToken, "Process completed successfully");
            return processExecutionStateService.getExecution(processExecutionId);
        } catch (FencingTokenLostException fence) {
            // P2: token perdido → abortar sin failProcess (evita sobrescribir el estado de otro dueño).
            processSpan.recordException(fence);
            processSpan.setStatus(StatusCode.ERROR, "fencing token lost");
            throw fence;
        } catch (Exception e) {
            var message = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
            processExecutionStateService.failProcess(processExecutionId, executionToken, message);
            processSpan.recordException(e);
            processSpan.setStatus(StatusCode.ERROR, message);
            throw e;
        } finally {
            processSpan.end();
        }
    }

    private boolean boolValue(Object raw, boolean defaultValue) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return defaultValue;
        }
        return Boolean.parseBoolean(String.valueOf(raw));
    }

    private ExecutionFastPath resolveFastPath(ProcessExecutionStateService.TaskPlan current,
                                              ProcessExecutionStateService.TaskPlan next) {
        return fastPaths.stream()
                .filter(fp -> fp.supports(current, next))
                .findFirst()
                .orElse(null);
    }
}
