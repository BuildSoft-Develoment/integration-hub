package com.integrationhub.platform.service;

import com.integrationhub.platform.domain.TaskType;
import com.integrationhub.platform.entity.ProcessExecution;
import com.integrationhub.platform.entity.ProcessTaskDefinition;
import com.integrationhub.platform.provider.task.DbWriteTaskProvider;
import com.integrationhub.platform.repository.ProcessExecutionRepository;
import com.integrationhub.platform.repository.ProcessTaskDefinitionRepository;
import com.integrationhub.platform.spi.ReadRecord;
import com.integrationhub.platform.spi.ReadResult;
import com.integrationhub.platform.spi.ReadSkip;
import com.integrationhub.platform.spi.ReaderProvider;
import com.integrationhub.platform.spi.SelectedSourceFile;
import com.integrationhub.platform.spi.SourcePayload;
import com.integrationhub.platform.spi.TaskContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@ApplicationScoped
public class ProcessTaskRuntimeService {

    private final JsonConfigurationMapper jsonConfigurationMapper;
    private final SourceProviderRegistry sourceProviderRegistry;
    private final ReaderProviderRegistry readerProviderRegistry;
    private final TaskProviderRegistry taskProviderRegistry;
    private final ProcessExecutionRepository processExecutionRepository;
    private final ProcessTaskDefinitionRepository processTaskDefinitionRepository;
    private final DbWriteTaskProvider dbWriteTaskProvider;

    public ProcessTaskRuntimeService(
            JsonConfigurationMapper jsonConfigurationMapper,
            SourceProviderRegistry sourceProviderRegistry,
            ReaderProviderRegistry readerProviderRegistry,
            TaskProviderRegistry taskProviderRegistry,
            ProcessExecutionRepository processExecutionRepository,
            ProcessTaskDefinitionRepository processTaskDefinitionRepository,
            DbWriteTaskProvider dbWriteTaskProvider
    ) {
        this.jsonConfigurationMapper = jsonConfigurationMapper;
        this.sourceProviderRegistry = sourceProviderRegistry;
        this.readerProviderRegistry = readerProviderRegistry;
        this.taskProviderRegistry = taskProviderRegistry;
        this.processExecutionRepository = processExecutionRepository;
        this.processTaskDefinitionRepository = processTaskDefinitionRepository;
        this.dbWriteTaskProvider = dbWriteTaskProvider;
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
            if (taskPlan.sourceType() == null || taskPlan.readerType() == null) {
                throw new IllegalArgumentException("FILE_READ task requires linked sourceDefinition and readerDefinition");
            }
            var sourceProvider = sourceProviderRegistry.resolve(taskPlan.sourceType());
            var readerProvider = readerProviderRegistry.resolve(taskPlan.readerType());
            var sourceConfiguration = new LinkedHashMap<>(jsonConfigurationMapper.toMap(taskPlan.sourceConfigurationJson()));
            var taskConfiguration = jsonConfigurationMapper.toMap(taskPlan.configurationJson());
            mergeTemplateVariables(sourceConfiguration, taskConfiguration, executionVariables);
            var selectedFiles = filterSelectedFiles(sourceProvider.selectFiles(sourceConfiguration), selectedFileReferences);
            if (selectedFiles.isEmpty()) {
                throw new IllegalStateException("No source files were selected");
            }
            var nextSourcePayload = sourceProvider.openFile(selectedFiles.getFirst(), sourceConfiguration);
            var nextReadResult = collectReadResult(
                    readerProvider,
                    nextSourcePayload,
                    jsonConfigurationMapper.toMap(taskPlan.readerConfigurationJson())
            );
            return TaskRunResult.fileRead(nextSourcePayload, nextReadResult);
        }

        var execution = processExecutionRepository.findById(processExecutionId);
        var taskDefinition = processTaskDefinitionRepository.findById(taskPlan.taskDefinitionId());
        var provider = taskProviderRegistry.resolve(taskPlan.taskType().name());
        var taskContext = new TaskContext(execution, taskDefinition);
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
        var result = provider.execute(taskContext, jsonConfigurationMapper.toMap(taskPlan.configurationJson()));
        return TaskRunResult.generic(result.details(), sourcePayload, readResult, result.outputs());
    }

    @Transactional
    public FileReadDbWriteResult runFileReadToDbWrite(Long processExecutionId,
                                                      ProcessExecutionStateService.TaskPlan fileReadPlan,
                                                      ProcessExecutionStateService.TaskPlan dbWritePlan,
                                                      Map<String, String> executionVariables,
                                                      List<String> selectedFileReferences) {
        if (fileReadPlan.taskType() != TaskType.FILE_READ || dbWritePlan.taskType() != TaskType.DB_WRITE) {
            throw new IllegalArgumentException("Pipeline requires FILE_READ followed by DB_WRITE");
        }
        if (fileReadPlan.sourceType() == null || fileReadPlan.readerType() == null) {
            throw new IllegalArgumentException("FILE_READ task requires linked sourceDefinition and readerDefinition");
        }

        var sourceProvider = sourceProviderRegistry.resolve(fileReadPlan.sourceType());
        var readerProvider = readerProviderRegistry.resolve(fileReadPlan.readerType());
        var sourceConfiguration = new LinkedHashMap<>(jsonConfigurationMapper.toMap(fileReadPlan.sourceConfigurationJson()));
        var fileReadConfiguration = jsonConfigurationMapper.toMap(fileReadPlan.configurationJson());
        var readerConfiguration = jsonConfigurationMapper.toMap(fileReadPlan.readerConfigurationJson());
        var dbWriteConfiguration = jsonConfigurationMapper.toMap(dbWritePlan.configurationJson());
        mergeTemplateVariables(sourceConfiguration, fileReadConfiguration, executionVariables);

        var selectedFiles = filterSelectedFiles(sourceProvider.selectFiles(sourceConfiguration), selectedFileReferences);
        var processExecution = processExecutionRepository.findById(processExecutionId);
        var dbWriteTaskDefinition = processTaskDefinitionRepository.findById(dbWritePlan.taskDefinitionId());
        var dbTaskContext = new TaskContext(processExecution, dbWriteTaskDefinition);
        if (executionVariables != null && !executionVariables.isEmpty()) {
            dbTaskContext.attributes().put("executionVariables", executionVariables);
        }

        int batchSize = Math.max(batchSize(dbWriteConfiguration), 1);
        int totalWritten = 0;
        int totalValid = 0;
        int totalSkipped = 0;
        var aggregatedSkips = new ArrayList<ReadSkip>();
        var fileSummaries = new ArrayList<FileReadSummary>();
        var failedFiles = new ArrayList<FileFailureSummary>();
        var fileErrorPolicy = normalizeFileErrorPolicy(sourceConfiguration.get("fileErrorPolicy"));

        for (var selectedFile : selectedFiles) {
            try {
                var payload = sourceProvider.openFile(selectedFile, sourceConfiguration);
                dbTaskContext.attributes().put("sourcePayload", payload);
                int beforeWritten = totalWritten;
                var fileResult = readerProvider.readInBatches(payload, readerConfiguration, batchSize, batch -> {
                    var enrichedRecords = enrichRecordsWithSourceMetadata(batch.records(), payload);
                    var writeResult = dbWriteTaskProvider.executeRecords(dbTaskContext, dbWriteConfiguration, enrichedRecords, payload);
                    if (!writeResult.success()) {
                        throw new IllegalStateException(writeResult.details());
                    }
                });
                totalValid += fileResult.recordCount();
                totalSkipped += fileResult.skippedCount();
                aggregatedSkips.addAll(fileResult.skippedRows());
                totalWritten += fileResult.recordCount();
                fileSummaries.add(new FileReadSummary(selectedFile.name(), fileResult.recordCount(), fileResult.skippedCount(), totalWritten - beforeWritten));
            } catch (Exception fileError) {
                var message = fileError.getMessage() == null ? fileError.getClass().getSimpleName() : fileError.getMessage();
                failedFiles.add(new FileFailureSummary(selectedFile.name(), message));
                if (!"continue".equals(fileErrorPolicy)) {
                    throw new FileReadDbWritePipelineException(
                            "Processing failed for file " + selectedFile.name() + ": " + message,
                            selectedFile.name(),
                            List.copyOf(fileSummaries),
                            List.copyOf(selectedFiles),
                            totalValid,
                            totalSkipped,
                            totalWritten,
                            List.copyOf(aggregatedSkips),
                            List.copyOf(failedFiles),
                            fileError
                    );
                }
            }
        }

        if (!failedFiles.isEmpty()) {
            throw new FileReadDbWritePipelineException(
                    "Processing completed with errors in " + failedFiles.size() + " file(s)",
                    failedFiles.getFirst().fileName(),
                    List.copyOf(fileSummaries),
                    List.copyOf(selectedFiles),
                    totalValid,
                    totalSkipped,
                    totalWritten,
                    List.copyOf(aggregatedSkips),
                    List.copyOf(failedFiles),
                    null
            );
        }

        var summary = new ReadResult(List.of(), totalValid, totalSkipped, List.copyOf(aggregatedSkips));
        return new FileReadDbWriteResult(summary, List.copyOf(fileSummaries), List.copyOf(selectedFiles), totalWritten);
    }

    @SuppressWarnings("unchecked")
    private void mergeTemplateVariables(Map<String, Object> sourceConfiguration,
                                        Map<String, Object> taskConfiguration,
                                        Map<String, String> executionVariables) {
        var mergedVariables = new LinkedHashMap<String, String>();
        mergedVariables.putAll(stringMap(sourceConfiguration.get("templateVariables")));
        mergedVariables.putAll(stringMap(taskConfiguration.get("sourceVariables")));
        if (executionVariables != null) {
            executionVariables.forEach((key, value) -> {
                if (key != null && !key.isBlank() && value != null && !value.isBlank()) {
                    mergedVariables.put(key.trim(), value.trim());
                }
            });
        }
        if (!mergedVariables.isEmpty()) {
            sourceConfiguration.put("templateVariables", mergedVariables);
        }
    }

    private int batchSize(Map<String, Object> configuration) {
        var value = configuration.get("batchSize");
        if (value == null || String.valueOf(value).isBlank()) {
            return 500;
        }
        return Integer.parseInt(String.valueOf(value));
    }

    private List<SelectedSourceFile> filterSelectedFiles(List<SelectedSourceFile> selectedFiles,
                                                      List<String> selectedFileReferences) {
        if (selectedFileReferences == null || selectedFileReferences.isEmpty()) {
            return selectedFiles;
        }
        var requested = selectedFileReferences.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(java.util.stream.Collectors.toSet());
        return selectedFiles.stream()
                .filter(file -> requested.contains(file.location()) || requested.contains(file.name()))
                .toList();
    }

    private String normalizeFileErrorPolicy(Object value) {
        if (value == null || String.valueOf(value).isBlank()) {
            return "failFast";
        }
        var normalized = String.valueOf(value).trim();
        return "continue".equalsIgnoreCase(normalized) ? "continue" : "failFast";
    }

    private ReadResult collectReadResult(ReaderProvider readerProvider,
                                         SourcePayload payload,
                                         Map<String, Object> configuration) {
        var records = new ArrayList<ReadRecord>();
        var result = readerProvider.readInBatches(
                payload,
                configuration,
                Integer.MAX_VALUE,
                batch -> records.addAll(enrichRecordsWithSourceMetadata(batch.records(), payload))
        );
        return new ReadResult(List.copyOf(records), result.recordCount(), result.skippedCount(), result.skippedRows());
    }

    private List<ReadRecord> enrichRecordsWithSourceMetadata(List<ReadRecord> records, SourcePayload payload) {
        if (records == null || records.isEmpty() || payload == null) {
            return records == null ? List.of() : records;
        }
        var sourceFile = payload.file();
        return records.stream()
                .filter(Objects::nonNull)
                .map(record -> enrichRecordWithSourceMetadata(record, payload, sourceFile))
                .toList();
    }

    private ReadRecord enrichRecordWithSourceMetadata(ReadRecord record,
                                                      SourcePayload payload,
                                                      SelectedSourceFile sourceFile) {
        var values = new LinkedHashMap<String, Object>();
        if (record.values() != null) {
            values.putAll(record.values());
        }
        values.put("_sourceFileName", payload.name());
        values.put("_sourceFilePath", payload.location());
        values.put("_sourceMediaType", payload.mediaType());
        if (sourceFile != null) {
            values.put("_sourceFileSize", sourceFile.size());
            values.put("_sourceLastModified", sourceFile.lastModified());
        }
        return new ReadRecord(values);
    }

    private Map<String, String> stringMap(Object value) {
        if (!(value instanceof Map<?, ?> rawMap)) {
            return Map.of();
        }
        var result = new LinkedHashMap<String, String>();
        rawMap.forEach((key, nestedValue) -> {
            var normalizedKey = key == null ? "" : String.valueOf(key).trim();
            var normalizedValue = nestedValue == null ? "" : String.valueOf(nestedValue).trim();
            if (!normalizedKey.isBlank() && !normalizedValue.isBlank()) {
                result.put(normalizedKey, normalizedValue);
            }
        });
        return result;
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

    public record FileReadDbWriteResult(ReadResult readResult,
                                        List<FileReadSummary> fileSummaries,
                                        List<SelectedSourceFile> selectedFiles,
                                        int writtenCount) {
    }

    public record FileReadSummary(String fileName, int recordCount, int skippedCount, int writtenCount) {
    }

    public record FileFailureSummary(String fileName, String message) {
    }

    public static final class FileReadDbWritePipelineException extends RuntimeException {
        private final String failedFileName;
        private final List<FileReadSummary> completedFiles;
        private final List<SelectedSourceFile> selectedFiles;
        private final int validCount;
        private final int skippedCount;
        private final int writtenCount;
        private final List<ReadSkip> skippedRows;
        private final List<FileFailureSummary> failedFiles;

        public FileReadDbWritePipelineException(String message,
                                                String failedFileName,
                                                List<FileReadSummary> completedFiles,
                                                List<SelectedSourceFile> selectedFiles,
                                                int validCount,
                                                int skippedCount,
                                                int writtenCount,
                                                List<ReadSkip> skippedRows,
                                                List<FileFailureSummary> failedFiles,
                                                Throwable cause) {
            super(message, cause);
            this.failedFileName = failedFileName;
            this.completedFiles = completedFiles;
            this.selectedFiles = selectedFiles;
            this.validCount = validCount;
            this.skippedCount = skippedCount;
            this.writtenCount = writtenCount;
            this.skippedRows = skippedRows;
            this.failedFiles = failedFiles;
        }

        public String failedFileName() {
            return failedFileName;
        }

        public List<FileReadSummary> completedFiles() {
            return completedFiles;
        }

        public List<SelectedSourceFile> selectedFiles() {
            return selectedFiles;
        }

        public int validCount() {
            return validCount;
        }

        public int skippedCount() {
            return skippedCount;
        }

        public int writtenCount() {
            return writtenCount;
        }

        public List<ReadSkip> skippedRows() {
            return skippedRows;
        }

        public List<FileFailureSummary> failedFiles() {
            return failedFiles;
        }
    }
}



