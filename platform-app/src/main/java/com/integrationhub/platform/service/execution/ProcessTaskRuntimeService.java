package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.domain.TaskType;
import com.integrationhub.platform.service.TaskProviderRegistry;
import com.integrationhub.platform.service.reader.ReaderProviderRegistry;
import com.integrationhub.platform.service.source.SourceProviderRegistry;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.task.TaskContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class ProcessTaskRuntimeService {

    private final SourceProviderRegistry sourceProviderRegistry;
    private final ReaderProviderRegistry readerProviderRegistry;
    private final TaskProviderRegistry taskProviderRegistry;
    private final FileReadRuntimeSupport fileReadRuntimeSupport;

    public ProcessTaskRuntimeService(SourceProviderRegistry sourceProviderRegistry,
                                     ReaderProviderRegistry readerProviderRegistry,
                                     TaskProviderRegistry taskProviderRegistry,
                                     FileReadRuntimeSupport fileReadRuntimeSupport) {
        this.sourceProviderRegistry = sourceProviderRegistry;
        this.readerProviderRegistry = readerProviderRegistry;
        this.taskProviderRegistry = taskProviderRegistry;
        this.fileReadRuntimeSupport = fileReadRuntimeSupport;
    }

    @Transactional
    public TaskRunResult runTask(Long processExecutionId,
                                 ProcessExecutionStateService.TaskPlan taskPlan,
                                 SourcePayload sourcePayload,
                                 ReadResult readResult,
                                 Map<String, String> executionVariables,
                                 Map<String, Object> taskOutputs,
                                 List<String> selectedFileReferences) {
        if (taskPlan.taskType() == TaskType.FILE_READ) {
            return runFileReadTask(taskPlan, executionVariables, selectedFileReferences);
        }

        var provider = taskProviderRegistry.resolve(taskPlan.taskType().name());
        var taskContext = new TaskContext(processExecutionId, taskPlan.taskDefinitionId());
        if (sourcePayload != null) {
            taskContext.attributes().put("sourcePayload", sourcePayload);
        }
        if (readResult != null) {
            taskContext.attributes().put("readResult", readResult);
        }
        if (executionVariables != null && !executionVariables.isEmpty()) {
            taskContext.attributes().put("executionVariables", executionVariables);
        }
        if (taskOutputs != null && !taskOutputs.isEmpty()) {
            taskContext.attributes().put("taskOutputs", taskOutputs);
        }
        var result = provider.execute(taskContext, fileReadRuntimeSupport.configuration(taskPlan.configurationJson()));
        return TaskRunResult.generic(result.details(), sourcePayload, readResult, result.outputs());
    }

    private TaskRunResult runFileReadTask(ProcessExecutionStateService.TaskPlan taskPlan,
                                          Map<String, String> executionVariables,
                                          List<String> selectedFileReferences) {
        if (taskPlan.sourceType() == null || taskPlan.readerType() == null) {
            throw new IllegalArgumentException("FILE_READ task requires linked sourceDefinition and readerDefinition");
        }
        var sourceProvider = sourceProviderRegistry.resolve(taskPlan.sourceType());
        var readerProvider = readerProviderRegistry.resolve(taskPlan.readerType());
        var sourceConfiguration = fileReadRuntimeSupport.sourceConfiguration(
                taskPlan.sourceConfigurationJson(),
                taskPlan.configurationJson(),
                executionVariables
        );
        var selectedFiles = fileReadRuntimeSupport.filterSelectedFiles(
                sourceProvider.selectFiles(sourceConfiguration),
                selectedFileReferences
        );
        if (selectedFiles.isEmpty()) {
            throw new IllegalStateException("No source files were selected");
        }
        var nextSourcePayload = sourceProvider.openFile(selectedFiles.getFirst(), sourceConfiguration);
        var nextReadResult = fileReadRuntimeSupport.collectReadResult(
                readerProvider,
                nextSourcePayload,
                fileReadRuntimeSupport.configuration(taskPlan.readerConfigurationJson())
        );
        return TaskRunResult.fileRead(nextSourcePayload, nextReadResult);
    }

    public record TaskRunResult(
            String details,
            SourcePayload sourcePayload,
            ReadResult readResult,
            Map<String, Object> outputs,
            boolean fileRead
    ) {
        static TaskRunResult fileRead(SourcePayload sourcePayload, ReadResult readResult) {
            return new TaskRunResult(null, sourcePayload, readResult, Map.of(), true);
        }

        static TaskRunResult generic(String details, SourcePayload sourcePayload, ReadResult readResult, Map<String, Object> outputs) {
            return new TaskRunResult(details, sourcePayload, readResult, outputs == null ? Map.of() : new LinkedHashMap<>(outputs), false);
        }
    }
}
