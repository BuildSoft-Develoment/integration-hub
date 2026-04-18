package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.domain.TaskType;
import com.integrationhub.platform.service.TaskProviderRegistry;
import com.integrationhub.platform.service.reader.ReaderProviderRegistry;
import com.integrationhub.platform.service.source.SourceProviderRegistry;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.reader.ReadSkip;
import com.integrationhub.platform.spi.source.SelectedSourceFile;
import com.integrationhub.platform.spi.task.BatchTaskProvider;
import com.integrationhub.platform.spi.task.TaskContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class FileReadTaskPipelineService {

    private final SourceProviderRegistry sourceProviderRegistry;
    private final ReaderProviderRegistry readerProviderRegistry;
    private final TaskProviderRegistry taskProviderRegistry;
    private final FileReadRuntimeSupport fileReadRuntimeSupport;

    public FileReadTaskPipelineService(SourceProviderRegistry sourceProviderRegistry,
                                       ReaderProviderRegistry readerProviderRegistry,
                                       TaskProviderRegistry taskProviderRegistry,
                                       FileReadRuntimeSupport fileReadRuntimeSupport) {
        this.sourceProviderRegistry = sourceProviderRegistry;
        this.readerProviderRegistry = readerProviderRegistry;
        this.taskProviderRegistry = taskProviderRegistry;
        this.fileReadRuntimeSupport = fileReadRuntimeSupport;
    }

    @Transactional(Transactional.TxType.NOT_SUPPORTED)
    public FileReadTaskResult run(Long processExecutionId,
                                  ProcessExecutionStateService.TaskPlan fileReadPlan,
                                  ProcessExecutionStateService.TaskPlan sinkTaskPlan,
                                  Map<String, String> executionVariables,
                                  List<String> selectedFileReferences) {
        if (fileReadPlan.taskType() != TaskType.FILE_READ) {
            throw new IllegalArgumentException("Pipeline requires a FILE_READ task as source");
        }
        if (fileReadPlan.sourceType() == null || fileReadPlan.readerType() == null) {
            throw new IllegalArgumentException("FILE_READ task requires linked sourceDefinition and readerDefinition");
        }

        var provider = taskProviderRegistry.resolve(sinkTaskPlan.taskType().name());
        if (!(provider instanceof BatchTaskProvider sinkTaskProvider)) {
            throw new IllegalArgumentException("Pipeline sink task " + sinkTaskPlan.taskType() + " must implement BatchTaskProvider");
        }

        var sourceProvider = sourceProviderRegistry.resolve(fileReadPlan.sourceType());
        var readerProvider = readerProviderRegistry.resolve(fileReadPlan.readerType());
        var sourceConfiguration = fileReadRuntimeSupport.sourceConfiguration(
                fileReadPlan.sourceConfigurationJson(),
                fileReadPlan.configurationJson(),
                executionVariables
        );
        var readerConfiguration = fileReadRuntimeSupport.configuration(fileReadPlan.readerConfigurationJson());
        var sinkConfiguration = fileReadRuntimeSupport.configuration(sinkTaskPlan.configurationJson());

        var selectedFiles = fileReadRuntimeSupport.filterSelectedFiles(
                sourceProvider.selectFiles(sourceConfiguration),
                selectedFileReferences
        );
        var sinkTaskContext = new TaskContext(processExecutionId, sinkTaskPlan.taskDefinitionId());
        if (executionVariables != null && !executionVariables.isEmpty()) {
            sinkTaskContext.attributes().put("executionVariables", executionVariables);
        }

        int batchSize = Math.max(fileReadRuntimeSupport.batchSize(sinkConfiguration), 1);
        int totalProcessed = 0;
        int totalValid = 0;
        int totalSkipped = 0;
        var aggregatedSkips = new ArrayList<ReadSkip>();
        var fileSummaries = new ArrayList<FileReadSummary>();
        var failedFiles = new ArrayList<FileFailureSummary>();
        var fileErrorPolicy = fileReadRuntimeSupport.normalizeFileErrorPolicy(sourceConfiguration.get("fileErrorPolicy"));

        for (var selectedFile : selectedFiles) {
            try {
                var payload = sourceProvider.openFile(selectedFile, sourceConfiguration);
                sinkTaskContext.attributes().put("sourcePayload", payload);
                int beforeProcessed = totalProcessed;
                var fileResult = readerProvider.readInBatches(payload, readerConfiguration, batchSize, batch -> {
                    var enrichedRecords = fileReadRuntimeSupport.enrichRecordsWithSourceMetadata(batch.records(), payload);
                    var writeResult = sinkTaskProvider.executeRecords(sinkTaskContext, sinkConfiguration, enrichedRecords, payload);
                    if (!writeResult.success()) {
                        throw new IllegalStateException(writeResult.details());
                    }
                });
                totalValid += fileResult.recordCount();
                totalSkipped += fileResult.skippedCount();
                aggregatedSkips.addAll(fileResult.skippedRows());
                totalProcessed += fileResult.recordCount();
                fileSummaries.add(new FileReadSummary(selectedFile.name(), fileResult.recordCount(), fileResult.skippedCount(), totalProcessed - beforeProcessed));
            } catch (Exception fileError) {
                var message = fileError.getMessage() == null ? fileError.getClass().getSimpleName() : fileError.getMessage();
                failedFiles.add(new FileFailureSummary(selectedFile.name(), message));
                if (!"continue".equals(fileErrorPolicy)) {
                    throw new FileReadTaskPipelineException(
                            "Processing failed for file " + selectedFile.name() + ": " + message,
                            selectedFile.name(),
                            List.copyOf(fileSummaries),
                            List.copyOf(selectedFiles),
                            totalValid,
                            totalSkipped,
                            totalProcessed,
                            List.copyOf(aggregatedSkips),
                            List.copyOf(failedFiles),
                            fileError
                    );
                }
            }
        }

        if (!failedFiles.isEmpty()) {
            throw new FileReadTaskPipelineException(
                    "Processing completed with errors in " + failedFiles.size() + " file(s)",
                    failedFiles.getFirst().fileName(),
                    List.copyOf(fileSummaries),
                    List.copyOf(selectedFiles),
                    totalValid,
                    totalSkipped,
                    totalProcessed,
                    List.copyOf(aggregatedSkips),
                    List.copyOf(failedFiles),
                    null
            );
        }

        var summary = new ReadResult(List.of(), totalValid, totalSkipped, List.copyOf(aggregatedSkips));
        return new FileReadTaskResult(summary, List.copyOf(fileSummaries), List.copyOf(selectedFiles), totalProcessed);
    }

    public record FileReadTaskResult(ReadResult readResult,
                                     List<FileReadSummary> fileSummaries,
                                     List<SelectedSourceFile> selectedFiles,
                                     int processedCount) {
    }

    public record FileReadSummary(String fileName, int recordCount, int skippedCount, int writtenCount) {
    }

    public record FileFailureSummary(String fileName, String message) {
    }

    public static final class FileReadTaskPipelineException extends RuntimeException {
        private final String failedFileName;
        private final List<FileReadSummary> completedFiles;
        private final List<SelectedSourceFile> selectedFiles;
        private final int validCount;
        private final int skippedCount;
        private final int writtenCount;
        private final List<ReadSkip> skippedRows;
        private final List<FileFailureSummary> failedFiles;

        public FileReadTaskPipelineException(String message,
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
