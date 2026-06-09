package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.domain.TaskType;
import com.integrationhub.platform.service.TaskProviderRegistry;
import com.integrationhub.platform.service.reader.ReaderProviderRegistry;
import com.integrationhub.platform.service.source.SourceProviderRegistry;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.task.BatchTaskProvider;
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
    private final TaskOutputRegistry taskOutputRegistry;
    private final TaskInputResolver taskInputResolver;

    public ProcessTaskRuntimeService(SourceProviderRegistry sourceProviderRegistry,
                                     ReaderProviderRegistry readerProviderRegistry,
                                     TaskProviderRegistry taskProviderRegistry,
                                     FileReadRuntimeSupport fileReadRuntimeSupport,
                                     TaskOutputRegistry taskOutputRegistry,
                                     TaskInputResolver taskInputResolver) {
        this.sourceProviderRegistry = sourceProviderRegistry;
        this.readerProviderRegistry = readerProviderRegistry;
        this.taskProviderRegistry = taskProviderRegistry;
        this.fileReadRuntimeSupport = fileReadRuntimeSupport;
        this.taskOutputRegistry = taskOutputRegistry;
        this.taskInputResolver = taskInputResolver;
    }

    @Transactional
    public TaskRunResult runTask(Long processExecutionId,
                                 ProcessExecutionStateService.TaskPlan taskPlan,
                                 SourcePayload sourcePayload,
                                 ReadResult readResult,
                                 Map<String, String> executionVariables,
                                 Map<String, Object> taskOutputs,
                                 List<String> selectedFileReferences,
                                 String triggerSource) {
        var configuration = fileReadRuntimeSupport.configuration(taskPlan.configurationJson());
        taskOutputRegistry.taskRef(taskPlan, configuration);
        var executionMode = taskOutputRegistry.executionMode(configuration);
        taskOutputRegistry.registerMetadata(taskOutputs, processExecutionId, taskPlan, configuration, triggerSource);

        if (TaskType.FILE_READ.equals(taskPlan.taskType())) {
            return runFileReadTask(taskPlan, executionVariables, selectedFileReferences);
        }

        var provider = taskProviderRegistry.resolve(taskPlan.taskType());
        if (requiresRecordInput(executionMode) && !(configuration.get("input") instanceof Map<?, ?>)) {
            throw new IllegalArgumentException("Task " + taskOutputRegistry.taskRef(taskPlan, configuration)
                    + " requires input for executionMode " + executionMode);
        }
        var resolvedInput = taskInputResolver.resolve(configuration, taskOutputs);

        if ("batch".equals(executionMode) || "per-record".equals(executionMode)) {
            var accumulator = taskInputResolver.executeByMode(
                    resolvedInput,
                    executionMode,
                    configuredBatchSize(configuration),
                    slice -> {
                        var sliceReadResult = new ReadResult(slice.records(), slice.records().size());
                        var taskContext = taskContext(
                                processExecutionId,
                                taskPlan,
                                configuration,
                                resolvedInput.sourcePayload(),
                                sliceReadResult,
                                executionVariables,
                                taskOutputs,
                                triggerSource
                        );
                        addBatchMetadata(taskContext, slice);
                        if (slice.records().size() == 1) {
                            taskContext.attributes().put("currentRecord", slice.records().getFirst().values());
                        }
                        if (provider instanceof BatchTaskProvider batchTaskProvider) {
                            return batchTaskProvider.executeRecords(taskContext, configuration, slice.records(), resolvedInput.sourcePayload());
                        }
                        return provider.execute(taskContext, configuration);
                    }
            );
            return TaskRunResult.generic(accumulator.details(), sourcePayload, readResult, accumulator.outputs());
        }

        var taskContext = taskContext(
                processExecutionId,
                taskPlan,
                configuration,
                resolvedInput.sourcePayload(),
                resolvedInput.readResult(),
                executionVariables,
                taskOutputs,
                triggerSource
        );
        if (resolvedInput.readResult() != null && resolvedInput.readResult().records().size() == 1) {
            taskContext.attributes().put("currentRecord", resolvedInput.readResult().records().getFirst().values());
        }
        var result = provider.execute(taskContext, configuration);
        return TaskRunResult.generic(result.details(), sourcePayload, readResult, result.outputs());
    }

    private boolean requiresRecordInput(String executionMode) {
        return "batch".equals(executionMode) || "per-record".equals(executionMode);
    }

    private TaskContext taskContext(Long processExecutionId,
                                    ProcessExecutionStateService.TaskPlan taskPlan,
                                    Map<String, Object> configuration,
                                    SourcePayload sourcePayload,
                                    ReadResult readResult,
                                    Map<String, String> executionVariables,
                                    Map<String, Object> taskOutputs,
                                    String triggerSource) {
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
        var metadata = taskOutputRegistry.taskMetadata(processExecutionId, taskPlan, configuration, triggerSource);
        taskContext.attributes().put("metadata", metadata);
        return taskContext;
    }

    @SuppressWarnings("unchecked")
    private int configuredBatchSize(Map<String, Object> configuration) {
        var input = configuration.get("input") instanceof Map<?, ?> rawInput
                ? (Map<String, Object>) rawInput
                : Map.<String, Object>of();
        // Lote funcional de lectura/proceso: input.batchSize > configuration.batchSize > default.
        // NO cae a jdbcBatchSize (eso es el lote de INSERT de DB_WRITE, concepto distinto; P2.1).
        return intValue(
                input.get("batchSize"),
                intValue(configuration.get("batchSize"), 1000)
        );
    }

    private void addBatchMetadata(TaskContext taskContext, TaskInputResolver.BatchSlice slice) {
        if (!(taskContext.attributes().get("metadata") instanceof Map<?, ?> rawMetadata)) {
            return;
        }
        @SuppressWarnings("unchecked")
        var metadata = (Map<String, Object>) rawMetadata;
        metadata.put("_batchNumber", slice.batchNumber());
        metadata.put("_batchSize", slice.records().size());
        metadata.put("_batchFrom", slice.batchFrom());
        metadata.put("_batchTo", slice.batchTo());
    }

    private int intValue(Object value, int defaultValue) {
        if (value == null || String.valueOf(value).isBlank()) {
            return defaultValue;
        }
        return Integer.parseInt(String.valueOf(value));
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
