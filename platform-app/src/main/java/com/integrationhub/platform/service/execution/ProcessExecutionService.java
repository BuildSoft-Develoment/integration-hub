package com.integrationhub.platform.service.execution;

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
    private final Tracer tracer;

    public ProcessExecutionService(
            ProcessExecutionStateService processExecutionStateService,
            ProcessTaskRuntimeService processTaskRuntimeService,
            ProcessExecutionAuditMapper auditMapper,
            Instance<ExecutionFastPath> fastPaths,
            Tracer tracer
    ) {
        this.processExecutionStateService = processExecutionStateService;
        this.processTaskRuntimeService = processTaskRuntimeService;
        this.auditMapper = auditMapper;
        this.fastPaths = fastPaths;
        this.tracer = tracer;
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
        var processExecutionId = processExecutionStateService.startProcess(plan.processDefinitionId(), plan.processName(), sourceExecutionId, normalizedTriggerSource);
        return executeLoadedPlan(plan, processExecutionId, normalizedExecutionVariables, normalizedSelectedFiles, normalizedTriggerSource, processSpan);
    }

    public com.integrationhub.platform.entity.ProcessExecution executeQueued(Long processExecutionId,
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
        return executeLoadedPlan(plan, processExecutionId, normalizedExecutionVariables, normalizedSelectedFiles, normalizedTriggerSource, processSpan);
    }

    private com.integrationhub.platform.entity.ProcessExecution executeLoadedPlan(ProcessExecutionStateService.ExecutionPlan plan,
                                                                                  Long processExecutionId,
                                                                                  Map<String, String> executionVariables,
                                                                                  List<String> selectedFiles,
                                                                                  String triggerSource,
                                                                                  io.opentelemetry.api.trace.Span processSpan) {
        try {
            SourcePayload sourcePayload = null;
            ReadResult readResult = null;
            var taskOutputs = new java.util.LinkedHashMap<String, Object>();
            var tasks = plan.tasks();

            for (int index = 0; index < tasks.size(); index++) {
                var taskPlan = tasks.get(index);
                var nextTaskPlan = index + 1 < tasks.size() ? tasks.get(index + 1) : null;

                // 1. Try Optimized Fast Paths (e.g. Pipeline FILE_READ -> BATCH_SINK)
                var fastPath = resolveFastPath(taskPlan, nextTaskPlan);
                if (fastPath != null) {
                    var result = fastPath.execute(processExecutionId, taskPlan, nextTaskPlan, executionVariables, selectedFiles, triggerSource);
                    if (result != null) return result; // Pipeline forced an early exit
                    index += fastPath.consumedTaskCount() - 1;
                    continue;
                }

                // 2. Regular Sequential Path
                var taskSpan = tracer.spanBuilder("process.task.execute")
                        .setAttribute("task.definition.id", taskPlan.taskDefinitionId())
                        .setAttribute("task.order", taskPlan.taskOrder())
                        .setAttribute("task.type", taskPlan.taskType().name())
                        .startSpan();

                var taskExecutionId = processExecutionStateService.startTask(processExecutionId, taskPlan.taskDefinitionId(), taskPlan.taskType().name(), taskPlan.taskOrder());
                try {
                    var runResult = processTaskRuntimeService.runTask(processExecutionId, taskPlan, sourcePayload, readResult, executionVariables, taskOutputs, selectedFiles);
                    String taskDetails;
                    Object taskPayload;

                    if (runResult.fileRead()) {
                        sourcePayload = runResult.sourcePayload();
                        readResult = runResult.readResult();
                        taskDetails = auditMapper.buildReadDetails(taskPlan.sourceName(), readResult, List.of());
                        taskPayload = auditMapper.buildReadAuditPayload(taskPlan, readResult, List.of(), List.of(), executionVariables, triggerSource);
                        taskSpan.setAttribute("records.count", readResult.recordCount());
                    } else {
                        taskDetails = auditMapper.buildTaskDetails(taskPlan, runResult.details());
                        if (runResult.outputs() != null && !runResult.outputs().isEmpty()) {
                            taskOutputs.putAll(runResult.outputs());
                        }
                        taskPayload = Map.of("taskType", taskPlan.taskType().name(), "outputs", runResult.outputs());
                    }

                    processExecutionStateService.completeTask(processExecutionId, taskExecutionId, taskDetails, taskPayload);
                } catch (Exception taskError) {
                    var message = taskError.getMessage() == null ? taskError.getClass().getSimpleName() : taskError.getMessage();
                    processExecutionStateService.failTask(processExecutionId, taskExecutionId, message, auditMapper.buildTaskFailurePayload(taskPlan, executionVariables, triggerSource));
                    taskSpan.recordException(taskError);
                    taskSpan.setStatus(StatusCode.ERROR, message);
                    throw taskError;
                } finally {
                    taskSpan.end();
                }
            }

            processExecutionStateService.completeProcess(processExecutionId, "Process completed successfully");
            return processExecutionStateService.getExecution(processExecutionId);
        } catch (Exception e) {
            var message = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
            processExecutionStateService.failProcess(processExecutionId, message);
            processSpan.recordException(e);
            processSpan.setStatus(StatusCode.ERROR, message);
            throw e;
        } finally {
            processSpan.end();
        }
    }

    private ExecutionFastPath resolveFastPath(ProcessExecutionStateService.TaskPlan current,
                                              ProcessExecutionStateService.TaskPlan next) {
        return fastPaths.stream()
                .filter(fp -> fp.supports(current, next))
                .findFirst()
                .orElse(null);
    }
}
