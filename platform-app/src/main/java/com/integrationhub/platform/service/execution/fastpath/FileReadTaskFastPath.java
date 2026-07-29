package com.integrationhub.platform.service.execution.fastpath;

import com.integrationhub.platform.domain.TaskType;
import com.integrationhub.platform.entity.ProcessExecution;
import com.integrationhub.platform.service.TaskProviderRegistry;
import com.integrationhub.platform.service.execution.StreamingPipelineService;
import com.integrationhub.platform.service.execution.ProcessExecutionAuditMapper;
import com.integrationhub.platform.service.execution.ProcessExecutionStateService;
import com.integrationhub.platform.service.execution.ProcessedSourceFileService;
import com.integrationhub.platform.service.execution.TaskOutputRegistry;
import com.integrationhub.platform.service.execution.async.TaskDispatchPlanner;
import com.integrationhub.platform.service.reader.ReaderProviderRegistry;
import com.integrationhub.platform.spi.task.BatchTaskProvider;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Map;
import java.util.Set;

@ApplicationScoped
public class FileReadTaskFastPath implements ExecutionFastPath {


    private final StreamingPipelineService pipelineService;
    private final ProcessExecutionStateService stateService;
    private final ProcessExecutionAuditMapper auditMapper;
    private final ProcessedSourceFileService processedSourceFileService;
    private final TaskProviderRegistry taskProviderRegistry;
    private final ReaderProviderRegistry readerProviderRegistry;
    private final TaskOutputRegistry taskOutputRegistry;
    private final TaskDispatchPlanner dispatchPlanner;

    public FileReadTaskFastPath(StreamingPipelineService pipelineService,
                                ProcessExecutionStateService stateService,
                                ProcessExecutionAuditMapper auditMapper,
                                ProcessedSourceFileService processedSourceFileService,
                                TaskProviderRegistry taskProviderRegistry,
                                ReaderProviderRegistry readerProviderRegistry,
                                TaskOutputRegistry taskOutputRegistry,
                                TaskDispatchPlanner dispatchPlanner) {
        this.pipelineService = pipelineService;
        this.stateService = stateService;
        this.auditMapper = auditMapper;
        this.processedSourceFileService = processedSourceFileService;
        this.taskProviderRegistry = taskProviderRegistry;
        this.readerProviderRegistry = readerProviderRegistry;
        this.taskOutputRegistry = taskOutputRegistry;
        this.dispatchPlanner = dispatchPlanner;
    }

    @Override
    public boolean supports(ProcessExecutionStateService.TaskPlan current, ProcessExecutionStateService.TaskPlan next) {
        if (current == null || next == null) return false;
        if (!TaskType.FILE_READ.equals(current.taskType())) return false;
        if (!readerSupportsStreamingPipeline(current.readerType())) return false;
        if (!declaresCurrentReadRecordsInput(current, next)) return false;

        // ADR-021: el provider declara si publica `records` consumibles aguas abajo (p.ej. MT101_PARSE
        // -> MT101_ROUTE). El fast path solo materializa un summary (processedCount), asi que fusionar
        // una tarea cuyos records alguien lee romperia la resolucion de `<taskRef>.records`. Su sink
        // natural aca es DB_WRITE (staging), que no produce records consumibles. Antes esto era una
        // lista de literales de un vertical dentro del motor.
        if (taskProviderRegistry.producesConsumableRecords(next.taskType())) {
            return false;
        }

        // ADR-015: una tarea async NO puede fusionarse al fast path (el offload por lotes no existe y
        // el modelo de correlación es por-tarea, no por-record). Se cede a runTask, que lanza el error
        // explícito en vez de ejecutarse síncrona en silencio (sin fallback).
        if (dispatchPlanner.plan(taskOutputRegistry.configuration(next.configurationJson())).isAsync()) {
            return false;
        }

        var provider = taskProviderRegistry.resolve(next.taskType());
        return provider instanceof BatchTaskProvider;
    }

    private boolean readerSupportsStreamingPipeline(String readerType) {
        if (readerType == null || readerType.isBlank()) {
            return false;
        }
        try {
            return readerProviderRegistry.resolve(readerType).supportsStreamingPipeline();
        } catch (IllegalArgumentException | IllegalStateException error) {
            return false;
        }
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
                                    String executionToken,
                                    ProcessExecutionStateService.TaskPlan current,
                                    ProcessExecutionStateService.TaskPlan next,
                                    Map<String, String> executionVariables,
                                    List<String> selectedFiles,
                                    String triggerSource,
                                    Map<String, Object> taskOutputs) {
        var readTaskExecutionId = stateService.startTask(processExecutionId, executionToken, current.taskDefinitionId(), current.taskType(), current.taskOrder());
        var sinkTaskExecutionId = stateService.startTask(processExecutionId, executionToken, next.taskDefinitionId(), next.taskType(), next.taskOrder());

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
            var sinkOutputs = taskOutputRegistry.pipelineSinkOutputs(next, pipelineResult.processedCount());
            sinkOutputs.put("processExecutionId", processExecutionId);
            sinkOutputs.put("taskDefinitionId", next.taskDefinitionId());
            taskOutputRegistry.registerTaskResult(taskOutputs, next, nextConfiguration, sinkOutputs);

            stateService.completeTask(
                    processExecutionId,
                    executionToken,
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
                    executionToken,
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
        } catch (com.integrationhub.platform.service.execution.FencingTokenLostException fence) {
            // P2: token perdido → abortar sin fallar tareas (evita sobrescribir estado de otro dueño).
            throw fence;
        } catch (Exception pipelineError) {
            return handleError(processExecutionId, executionToken, current, next, readTaskExecutionId, sinkTaskExecutionId, executionVariables, triggerSource, pipelineError);
        }
    }

    private ProcessExecution handleError(Long processExecutionId,
                                         String executionToken,
                                         ProcessExecutionStateService.TaskPlan current,
                                         ProcessExecutionStateService.TaskPlan next,
                                         Long readExecutionId,
                                         Long sinkExecutionId,
                                         Map<String, String> executionVariables,
                                         String triggerSource,
                                         Exception error) {

        if (error instanceof StreamingPipelineService.StreamingPipelineException pipelineFailure) {
            var failureDetails = auditMapper.buildPipelineFailureDetails(current.sourceName(), pipelineFailure);
            var failurePayloadRead = auditMapper.buildPipelineFailurePayload(current, pipelineFailure, executionVariables, triggerSource, current.taskType());
            var failurePayloadSink = auditMapper.buildPipelineFailurePayload(current, pipelineFailure, executionVariables, triggerSource, next.taskType());

            processedSourceFileService.recordPipelineFiles(
                    processExecutionId,
                    current.taskDefinitionId(),
                    pipelineFailure.selectedFiles(),
                    pipelineFailure.completedFiles(),
                    pipelineFailure.failedFiles()
            );

            var fileErrorPolicy = auditMapper.resolveFileErrorPolicy(current);
            if ("continue".equals(fileErrorPolicy)) {
                stateService.completeTaskWithErrors(processExecutionId, executionToken, readExecutionId, failureDetails, failurePayloadRead);
                stateService.completeTaskWithErrors(processExecutionId, executionToken, sinkExecutionId, failureDetails, failurePayloadSink);
                stateService.completeProcessWithErrors(processExecutionId, executionToken, failureDetails);
                return stateService.getExecution(processExecutionId);
            }

            stateService.failTask(processExecutionId, executionToken, readExecutionId, failureDetails, failurePayloadRead);
            stateService.failTask(processExecutionId, executionToken, sinkExecutionId, failureDetails, failurePayloadSink);
            // The caller (ProcessExecutionService) will mark the process as failed.
        } else {
            var message = error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage();
            var payloadRead = auditMapper.buildTaskFailurePayload(current, executionVariables, triggerSource);
            var payloadSink = auditMapper.buildTaskFailurePayload(next, executionVariables, triggerSource);
            stateService.failTask(processExecutionId, executionToken, readExecutionId, message, payloadRead);
            stateService.failTask(processExecutionId, executionToken, sinkExecutionId, message, payloadSink);
        }
        if (error instanceof RuntimeException re) throw re;
        throw new RuntimeException(error);
    }

    @Override
    public int consumedTaskCount() {
        return 2;
    }
}
