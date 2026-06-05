package com.integrationhub.platform.service.execution.fastpath;

import com.integrationhub.platform.domain.TaskType;
import com.integrationhub.platform.entity.ProcessExecution;
import com.integrationhub.platform.service.TaskProviderRegistry;
import com.integrationhub.platform.service.execution.StreamingPipelineService;
import com.integrationhub.platform.service.execution.ProcessExecutionAuditMapper;
import com.integrationhub.platform.service.execution.ProcessExecutionStateService;
import com.integrationhub.platform.service.execution.ProcessedSourceFileService;
import com.integrationhub.platform.service.execution.TaskOutputRegistry;
import com.integrationhub.platform.spi.task.BatchTaskProvider;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Map;
import java.util.Set;

@ApplicationScoped
public class FileReadTaskFastPath implements ExecutionFastPath {

    private static final Set<String> SUPPORTED_READERS = Set.of("TXT", "CSV", "XLS", "XLSX");

    private final StreamingPipelineService pipelineService;
    private final ProcessExecutionStateService stateService;
    private final ProcessExecutionAuditMapper auditMapper;
    private final ProcessedSourceFileService processedSourceFileService;
    private final TaskProviderRegistry taskProviderRegistry;
    private final TaskOutputRegistry taskOutputRegistry;

    public FileReadTaskFastPath(StreamingPipelineService pipelineService,
                                ProcessExecutionStateService stateService,
                                ProcessExecutionAuditMapper auditMapper,
                                ProcessedSourceFileService processedSourceFileService,
                                TaskProviderRegistry taskProviderRegistry,
                                TaskOutputRegistry taskOutputRegistry) {
        this.pipelineService = pipelineService;
        this.stateService = stateService;
        this.auditMapper = auditMapper;
        this.processedSourceFileService = processedSourceFileService;
        this.taskProviderRegistry = taskProviderRegistry;
        this.taskOutputRegistry = taskOutputRegistry;
    }

    @Override
    public boolean supports(ProcessExecutionStateService.TaskPlan current, ProcessExecutionStateService.TaskPlan next) {
        if (current == null || next == null) return false;
        if (current.taskType() != TaskType.FILE_READ) return false;
        if (current.readerType() == null || !SUPPORTED_READERS.contains(current.readerType().toUpperCase())) return false;
        if (!declaresCurrentReadRecordsInput(current, next)) return false;

        var provider = taskProviderRegistry.resolve(next.taskType().name());
        return provider instanceof BatchTaskProvider;
    }

    private boolean declaresCurrentReadRecordsInput(ProcessExecutionStateService.TaskPlan current,
                                                    ProcessExecutionStateService.TaskPlan next) {
        var currentConfiguration = taskOutputRegistry.configuration(current.configurationJson());
        var nextConfiguration = taskOutputRegistry.configuration(next.configurationJson());
        taskOutputRegistry.taskRef(current, currentConfiguration);
        var executionMode = taskOutputRegistry.executionMode(nextConfiguration);
        if (!"batch".equals(executionMode) && !"per-record".equals(executionMode)) {
            return false;
        }
        if (!(nextConfiguration.get("input") instanceof Map<?, ?> rawInput)) {
            return false;
        }
        var source = stringValue(rawInput.get("source"));
        var sourceTaskRef = stringValue(rawInput.get("sourceTaskRef"));
        var sourceOutput = stringValue(rawInput.get("sourceOutput"));
        return "task-output".equalsIgnoreCase(source)
                && taskOutputRegistry.taskRef(current, currentConfiguration).equals(sourceTaskRef)
                && ("records".equalsIgnoreCase(sourceOutput) || sourceOutput.isBlank());
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    @Override
    public ProcessExecution execute(Long processExecutionId,
                                    ProcessExecutionStateService.TaskPlan current,
                                    ProcessExecutionStateService.TaskPlan next,
                                    Map<String, String> executionVariables,
                                    List<String> selectedFiles,
                                    String triggerSource,
                                    Map<String, Object> taskOutputs) {
        var readTaskExecutionId = stateService.startTask(processExecutionId, current.taskDefinitionId(), current.taskType().name(), current.taskOrder());
        var sinkTaskExecutionId = stateService.startTask(processExecutionId, next.taskDefinitionId(), next.taskType().name(), next.taskOrder());

        try {
            var pipelineResult = pipelineService.run(processExecutionId, current, next, executionVariables, selectedFiles);
            var currentConfiguration = taskOutputRegistry.configuration(current.configurationJson());
            var nextConfiguration = taskOutputRegistry.configuration(next.configurationJson());
            // P2.2: pasar la metadata de archivo (si es un unico archivo) para que el summary del
            // fast path incluya sourceFileName/Path/... igual que el camino normal.
            var selectedSourceFiles = pipelineResult.selectedFiles();
            var sourceFile = selectedSourceFiles != null && selectedSourceFiles.size() == 1
                    ? selectedSourceFiles.get(0)
                    : null;
            taskOutputRegistry.registerFileRead(taskOutputs, current, currentConfiguration, sourceFile, pipelineResult.readResult());
            taskOutputRegistry.registerTaskResult(taskOutputs, next, nextConfiguration, taskOutputRegistry.pipelineSinkOutputs(next, pipelineResult.processedCount()));

            stateService.completeTask(
                    processExecutionId,
                    readTaskExecutionId,
                    auditMapper.buildReadDetails(current.sourceName(), pipelineResult.readResult(), pipelineResult.fileSummaries()),
                    auditMapper.buildReadAuditPayload(current, pipelineResult.readResult(), pipelineResult.fileSummaries(), pipelineResult.selectedFiles(), executionVariables, triggerSource)
            );

            processedSourceFileService.recordPipelineFiles(
                    processExecutionId,
                    current.taskDefinitionId(),
                    pipelineResult.selectedFiles(),
                    pipelineResult.fileSummaries(),
                    List.of()
            );

            stateService.completeTask(
                    processExecutionId,
                    sinkTaskExecutionId,
                    auditMapper.buildTaskDetails(next, "Pipeline sink completed with " + pipelineResult.processedCount() + " records processed"),
                    auditMapper.buildBatchSinkAuditPayload(
                            next,
                            pipelineResult.processedCount(),
                            pipelineResult.processedCount(),
                            pipelineResult.fileSummaries()
                    )
            );
            return null; // Continue process
        } catch (Exception pipelineError) {
            return handleError(processExecutionId, current, next, readTaskExecutionId, sinkTaskExecutionId, executionVariables, triggerSource, pipelineError);
        }
    }

    private ProcessExecution handleError(Long processExecutionId,
                                         ProcessExecutionStateService.TaskPlan current,
                                         ProcessExecutionStateService.TaskPlan next,
                                         Long readExecutionId,
                                         Long sinkExecutionId,
                                         Map<String, String> executionVariables,
                                         String triggerSource,
                                         Exception error) {

        if (error instanceof StreamingPipelineService.StreamingPipelineException pipelineFailure) {
            var failureDetails = auditMapper.buildPipelineFailureDetails(current.sourceName(), pipelineFailure);
            var failurePayloadRead = auditMapper.buildPipelineFailurePayload(current, pipelineFailure, executionVariables, triggerSource, current.taskType().name());
            var failurePayloadSink = auditMapper.buildPipelineFailurePayload(current, pipelineFailure, executionVariables, triggerSource, next.taskType().name());

            processedSourceFileService.recordPipelineFiles(
                    processExecutionId,
                    current.taskDefinitionId(),
                    pipelineFailure.selectedFiles(),
                    pipelineFailure.completedFiles(),
                    pipelineFailure.failedFiles()
            );

            var fileErrorPolicy = auditMapper.resolveFileErrorPolicy(current);
            if ("continue".equals(fileErrorPolicy)) {
                stateService.completeTaskWithErrors(processExecutionId, readExecutionId, failureDetails, failurePayloadRead);
                stateService.completeTaskWithErrors(processExecutionId, sinkExecutionId, failureDetails, failurePayloadSink);
                stateService.completeProcessWithErrors(processExecutionId, failureDetails);
                return stateService.getExecution(processExecutionId);
            }

            stateService.failTask(processExecutionId, readExecutionId, failureDetails, failurePayloadRead);
            stateService.failTask(processExecutionId, sinkExecutionId, failureDetails, failurePayloadSink);
            // The caller (ProcessExecutionService) will mark the process as failed.
        } else {
            var message = error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage();
            var payloadRead = auditMapper.buildTaskFailurePayload(current, executionVariables, triggerSource);
            var payloadSink = auditMapper.buildTaskFailurePayload(next, executionVariables, triggerSource);
            stateService.failTask(processExecutionId, readExecutionId, message, payloadRead);
            stateService.failTask(processExecutionId, sinkExecutionId, message, payloadSink);
        }
        if (error instanceof RuntimeException re) throw re;
        throw new RuntimeException(error);
    }

    @Override
    public int consumedTaskCount() {
        return 2;
    }
}
