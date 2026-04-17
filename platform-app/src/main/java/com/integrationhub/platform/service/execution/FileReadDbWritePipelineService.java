package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.domain.TaskType;
import com.integrationhub.platform.provider.task.dbwrite.DbWriteTaskProvider;
import com.integrationhub.platform.service.reader.ReaderProviderRegistry;
import com.integrationhub.platform.service.source.SourceProviderRegistry;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.reader.ReadSkip;
import com.integrationhub.platform.spi.source.SelectedSourceFile;
import com.integrationhub.platform.spi.task.TaskContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class FileReadDbWritePipelineService {

    private final SourceProviderRegistry sourceProviderRegistry;
    private final ReaderProviderRegistry readerProviderRegistry;
    private final DbWriteTaskProvider dbWriteTaskProvider;
    private final FileReadRuntimeSupport fileReadRuntimeSupport;

    public FileReadDbWritePipelineService(SourceProviderRegistry sourceProviderRegistry,
                                          ReaderProviderRegistry readerProviderRegistry,
                                          DbWriteTaskProvider dbWriteTaskProvider,
                                          FileReadRuntimeSupport fileReadRuntimeSupport) {
        this.sourceProviderRegistry = sourceProviderRegistry;
        this.readerProviderRegistry = readerProviderRegistry;
        this.dbWriteTaskProvider = dbWriteTaskProvider;
        this.fileReadRuntimeSupport = fileReadRuntimeSupport;
    }

    @Transactional(Transactional.TxType.NOT_SUPPORTED)
    public FileReadDbWriteResult run(Long processExecutionId,
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
        var sourceConfiguration = fileReadRuntimeSupport.sourceConfiguration(
                fileReadPlan.sourceConfigurationJson(),
                fileReadPlan.configurationJson(),
                executionVariables
        );
        var readerConfiguration = fileReadRuntimeSupport.configuration(fileReadPlan.readerConfigurationJson());
        var dbWriteConfiguration = fileReadRuntimeSupport.configuration(dbWritePlan.configurationJson());

        var selectedFiles = fileReadRuntimeSupport.filterSelectedFiles(
                sourceProvider.selectFiles(sourceConfiguration),
                selectedFileReferences
        );
        var dbTaskContext = new TaskContext(processExecutionId, dbWritePlan.taskDefinitionId());
        if (executionVariables != null && !executionVariables.isEmpty()) {
            dbTaskContext.attributes().put("executionVariables", executionVariables);
        }

        int batchSize = Math.max(fileReadRuntimeSupport.batchSize(dbWriteConfiguration), 1);
        int totalWritten = 0;
        int totalValid = 0;
        int totalSkipped = 0;
        var aggregatedSkips = new ArrayList<ReadSkip>();
        var fileSummaries = new ArrayList<FileReadSummary>();
        var failedFiles = new ArrayList<FileFailureSummary>();
        var fileErrorPolicy = fileReadRuntimeSupport.normalizeFileErrorPolicy(sourceConfiguration.get("fileErrorPolicy"));

        for (var selectedFile : selectedFiles) {
            try {
                var payload = sourceProvider.openFile(selectedFile, sourceConfiguration);
                dbTaskContext.attributes().put("sourcePayload", payload);
                int beforeWritten = totalWritten;
                var fileResult = readerProvider.readInBatches(payload, readerConfiguration, batchSize, batch -> {
                    var enrichedRecords = fileReadRuntimeSupport.enrichRecordsWithSourceMetadata(batch.records(), payload);
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
