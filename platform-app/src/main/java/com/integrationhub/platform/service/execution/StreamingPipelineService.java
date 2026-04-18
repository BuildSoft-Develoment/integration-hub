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
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.context.ManagedExecutor;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicInteger;

@ApplicationScoped
public class StreamingPipelineService {

    private final SourceProviderRegistry sourceProviderRegistry;
    private final ReaderProviderRegistry readerProviderRegistry;
    private final TaskProviderRegistry taskProviderRegistry;
    private final FileReadRuntimeSupport fileReadRuntimeSupport;
    private final ManagedExecutor managedExecutor;

    public StreamingPipelineService(SourceProviderRegistry sourceProviderRegistry,
                                    ReaderProviderRegistry readerProviderRegistry,
                                    TaskProviderRegistry taskProviderRegistry,
                                    FileReadRuntimeSupport fileReadRuntimeSupport,
                                    ManagedExecutor managedExecutor) {
        this.sourceProviderRegistry = sourceProviderRegistry;
        this.readerProviderRegistry = readerProviderRegistry;
        this.taskProviderRegistry = taskProviderRegistry;
        this.fileReadRuntimeSupport = fileReadRuntimeSupport;
        this.managedExecutor = managedExecutor;
    }

    @Transactional(Transactional.TxType.NOT_SUPPORTED)
    public StreamingResult run(Long processExecutionId,
                               ProcessExecutionStateService.TaskPlan sourcePlan,
                               ProcessExecutionStateService.TaskPlan sinkTaskPlan,
                               Map<String, String> executionVariables,
                               List<String> selectedFileReferences) {
        
        // This service currently handles FILE_READ as the streaming source
        if (sourcePlan.taskType() != TaskType.FILE_READ) {
            throw new IllegalArgumentException("Streaming pipeline requires a FILE_READ task as source for now");
        }

        var provider = taskProviderRegistry.resolve(sinkTaskPlan.taskType().name());
        if (!(provider instanceof BatchTaskProvider sinkTaskProvider)) {
            throw new IllegalArgumentException("Pipeline sink task " + sinkTaskPlan.taskType() + " must implement BatchTaskProvider");
        }

        var sourceProvider = sourceProviderRegistry.resolve(sourcePlan.sourceType());
        var readerProvider = readerProviderRegistry.resolve(sourcePlan.readerType());
        
        var sourceConfiguration = fileReadRuntimeSupport.sourceConfiguration(
                sourcePlan.sourceConfigurationJson(),
                sourcePlan.configurationJson(),
                executionVariables
        );
        var readerConfiguration = fileReadRuntimeSupport.configuration(sourcePlan.readerConfigurationJson());
        var sinkConfiguration = fileReadRuntimeSupport.configuration(sinkTaskPlan.configurationJson());

        var selectedFiles = fileReadRuntimeSupport.filterSelectedFiles(
                sourceProvider.selectFiles(sourceConfiguration),
                selectedFileReferences
        );

        int batchSize = Math.max(fileReadRuntimeSupport.batchSize(sinkConfiguration), 1);
        boolean parallel = fileReadRuntimeSupport.isParallelEnabled(sourceConfiguration);
        
        var fileSummaries = new ConcurrentLinkedQueue<BatchSummary>();
        var failedFiles = new ConcurrentLinkedQueue<StreamFailureSummary>();
        var aggregatedSkips = new ConcurrentLinkedQueue<ReadSkip>();
        var totalProcessed = new AtomicInteger(0);
        var totalValid = new AtomicInteger(0);
        var totalSkipped = new AtomicInteger(0);

        var fileErrorPolicy = fileReadRuntimeSupport.normalizeFileErrorPolicy(sourceConfiguration.get("fileErrorPolicy"));

        if (parallel) {
            runParallel(processExecutionId, sinkTaskPlan, executionVariables, sourceProvider, readerProvider,
                    sourceConfiguration, readerConfiguration, sinkTaskProvider, sinkConfiguration,
                    selectedFiles, batchSize, fileSummaries, failedFiles, aggregatedSkips, 
                    totalProcessed, totalValid, totalSkipped, fileErrorPolicy);
        } else {
            runSequential(processExecutionId, sinkTaskPlan, executionVariables, sourceProvider, readerProvider,
                    sourceConfiguration, readerConfiguration, sinkTaskProvider, sinkConfiguration,
                    selectedFiles, batchSize, fileSummaries, failedFiles, aggregatedSkips, 
                    totalProcessed, totalValid, totalSkipped, fileErrorPolicy);
        }

        if (!failedFiles.isEmpty()) {
            throw new StreamingPipelineException(
                    "Streaming completed with " + failedFiles.size() + " error(s)",
                    failedFiles.peek().fileName(),
                    List.copyOf(fileSummaries),
                    List.copyOf(selectedFiles),
                    totalValid.get(),
                    totalSkipped.get(),
                    totalProcessed.get(),
                    List.copyOf(aggregatedSkips),
                    List.copyOf(failedFiles),
                    null
            );
        }

        var summary = new ReadResult(List.of(), totalValid.get(), totalSkipped.get(), List.copyOf(aggregatedSkips));
        return new StreamingResult(summary, List.copyOf(fileSummaries), List.copyOf(selectedFiles), totalProcessed.get());
    }

    private void runSequential(Long processExecutionId,
                               ProcessExecutionStateService.TaskPlan sinkTaskPlan,
                               Map<String, String> executionVariables,
                               com.integrationhub.platform.spi.source.SourceProvider sourceProvider,
                               com.integrationhub.platform.spi.reader.ReaderProvider readerProvider,
                               Map<String, Object> sourceConfiguration,
                               Map<String, Object> readerConfiguration,
                               BatchTaskProvider sinkTaskProvider,
                               Map<String, Object> sinkConfiguration,
                               List<SelectedSourceFile> selectedFiles,
                               int batchSize,
                               ConcurrentLinkedQueue<BatchSummary> fileSummaries,
                               ConcurrentLinkedQueue<StreamFailureSummary> failedFiles,
                               ConcurrentLinkedQueue<ReadSkip> aggregatedSkips,
                               AtomicInteger totalProcessed,
                               AtomicInteger totalValid,
                               AtomicInteger totalSkipped,
                               String fileErrorPolicy) {
        
        var sinkTaskContext = createSinkContext(processExecutionId, sinkTaskPlan, executionVariables);

        for (var selectedFile : selectedFiles) {
            try {
                processSingleFile(selectedFile, sourceProvider, readerProvider, sourceConfiguration, 
                        readerConfiguration, sinkTaskProvider, sinkConfiguration, sinkTaskContext, 
                        batchSize, fileSummaries, aggregatedSkips, totalProcessed, totalValid, totalSkipped);
            } catch (Exception e) {
                handleFileError(selectedFile, e, fileErrorPolicy, failedFiles, fileSummaries, selectedFiles, totalProcessed, totalValid, totalSkipped, aggregatedSkips);
            }
        }
    }

    private void runParallel(Long processExecutionId,
                             ProcessExecutionStateService.TaskPlan sinkTaskPlan,
                             Map<String, String> executionVariables,
                             com.integrationhub.platform.spi.source.SourceProvider sourceProvider,
                             com.integrationhub.platform.spi.reader.ReaderProvider readerProvider,
                             Map<String, Object> sourceConfiguration,
                             Map<String, Object> readerConfiguration,
                             BatchTaskProvider sinkTaskProvider,
                             Map<String, Object> sinkConfiguration,
                             List<SelectedSourceFile> selectedFiles,
                             int batchSize,
                             ConcurrentLinkedQueue<BatchSummary> fileSummaries,
                             ConcurrentLinkedQueue<StreamFailureSummary> failedFiles,
                             ConcurrentLinkedQueue<ReadSkip> aggregatedSkips,
                             AtomicInteger totalProcessed,
                             AtomicInteger totalValid,
                             AtomicInteger totalSkipped,
                             String fileErrorPolicy) {

        List<CompletableFuture<Void>> futures = selectedFiles.stream()
                .map(file -> CompletableFuture.runAsync(() -> {
                    var sinkTaskContext = createSinkContext(processExecutionId, sinkTaskPlan, executionVariables);
                    try {
                        processSingleFile(file, sourceProvider, readerProvider, sourceConfiguration, 
                                readerConfiguration, sinkTaskProvider, sinkConfiguration, sinkTaskContext, 
                                batchSize, fileSummaries, aggregatedSkips, totalProcessed, totalValid, totalSkipped);
                    } catch (Exception e) {
                        handleFileError(file, e, fileErrorPolicy, failedFiles, fileSummaries, selectedFiles, totalProcessed, totalValid, totalSkipped, aggregatedSkips);
                    }
                }, managedExecutor))
                .toList();

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
    }

    private void processSingleFile(SelectedSourceFile selectedFile,
                                   com.integrationhub.platform.spi.source.SourceProvider sourceProvider,
                                   com.integrationhub.platform.spi.reader.ReaderProvider readerProvider,
                                   Map<String, Object> sourceConfiguration,
                                   Map<String, Object> readerConfiguration,
                                   BatchTaskProvider sinkTaskProvider,
                                   Map<String, Object> sinkConfiguration,
                                   TaskContext sinkTaskContext,
                                   int batchSize,
                                   ConcurrentLinkedQueue<BatchSummary> fileSummaries,
                                   ConcurrentLinkedQueue<ReadSkip> aggregatedSkips,
                                   AtomicInteger totalProcessed,
                                   AtomicInteger totalValid,
                                   AtomicInteger totalSkipped) throws Exception {
        
        var payload = sourceProvider.openFile(selectedFile, sourceConfiguration);
        sinkTaskContext.attributes().put("sourcePayload", payload);
        
        int initialProcessed = totalProcessed.get();
        
        var fileResult = readerProvider.readInBatches(payload, readerConfiguration, batchSize, batch -> {
            var enrichedRecords = fileReadRuntimeSupport.enrichRecordsWithSourceMetadata(batch.records(), payload);
            var writeResult = sinkTaskProvider.executeRecords(sinkTaskContext, sinkConfiguration, enrichedRecords, payload);
            if (!writeResult.success()) {
                throw new IllegalStateException(writeResult.details());
            }
        });

        totalValid.addAndGet(fileResult.recordCount());
        totalSkipped.addAndGet(fileResult.skippedCount());
        aggregatedSkips.addAll(fileResult.skippedRows());
        int processedInFile = fileResult.recordCount(); // Record count from reader
        totalProcessed.addAndGet(processedInFile);
        
        fileSummaries.add(new BatchSummary(selectedFile.name(), fileResult.recordCount(), fileResult.skippedCount(), processedInFile));
    }

    private TaskContext createSinkContext(Long processExecutionId, 
                                          ProcessExecutionStateService.TaskPlan sinkTaskPlan, 
                                          Map<String, String> executionVariables) {
        var context = new TaskContext(processExecutionId, sinkTaskPlan.taskDefinitionId());
        if (executionVariables != null && !executionVariables.isEmpty()) {
            context.attributes().put("executionVariables", executionVariables);
        }
        return context;
    }

    private void handleFileError(SelectedSourceFile file, Exception e, String fileErrorPolicy, 
                                 ConcurrentLinkedQueue<StreamFailureSummary> failedFiles,
                                 ConcurrentLinkedQueue<BatchSummary> fileSummaries,
                                 List<SelectedSourceFile> selectedFiles,
                                 AtomicInteger totalProcessed,
                                 AtomicInteger totalValid,
                                 AtomicInteger totalSkipped,
                                 ConcurrentLinkedQueue<ReadSkip> aggregatedSkips) {
        var message = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
        failedFiles.add(new StreamFailureSummary(file.name(), message));
        if (!"continue".equals(fileErrorPolicy)) {
            throw new StreamingPipelineException(
                    "Processing failed for file " + file.name() + ": " + message,
                    file.name(),
                    List.copyOf(fileSummaries),
                    List.copyOf(selectedFiles),
                    totalValid.get(),
                    totalSkipped.get(),
                    totalProcessed.get(),
                    List.copyOf(aggregatedSkips),
                    List.copyOf(failedFiles),
                    e
            );
        }
    }

    public record StreamingResult(ReadResult readResult,
                                  List<BatchSummary> fileSummaries,
                                  List<SelectedSourceFile> selectedFiles,
                                  int processedCount) {
    }

    public record BatchSummary(String fileName, int recordCount, int skippedCount, int writtenCount) {
    }

    public record StreamFailureSummary(String fileName, String message) {
    }

    public static final class StreamingPipelineException extends RuntimeException {
        private final String failedFileName;
        private final List<BatchSummary> completedFiles;
        private final List<SelectedSourceFile> selectedFiles;
        private final int validCount;
        private final int skippedCount;
        private final int writtenCount;
        private final List<ReadSkip> skippedRows;
        private final List<StreamFailureSummary> failedFiles;

        public StreamingPipelineException(String message,
                                          String failedFileName,
                                          List<BatchSummary> completedFiles,
                                          List<SelectedSourceFile> selectedFiles,
                                          int validCount,
                                          int skippedCount,
                                          int writtenCount,
                                          List<ReadSkip> skippedRows,
                                          List<StreamFailureSummary> failedFiles,
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

        public String failedFileName() { return failedFileName; }
        public List<BatchSummary> completedFiles() { return completedFiles; }
        public List<SelectedSourceFile> selectedFiles() { return selectedFiles; }
        public int validCount() { return validCount; }
        public int skippedCount() { return skippedCount; }
        public int writtenCount() { return writtenCount; }
        public List<ReadSkip> skippedRows() { return skippedRows; }
        public List<StreamFailureSummary> failedFiles() { return failedFiles; }
    }
}
