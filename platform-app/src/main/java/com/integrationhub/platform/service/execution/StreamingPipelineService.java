package com.integrationhub.platform.service.execution;

// @trace RF-004 (reingenieria: clase que implementa el/los RF en produccion)

import com.integrationhub.platform.domain.TaskType;
import com.integrationhub.platform.service.TaskProviderRegistry;
import com.integrationhub.platform.service.reader.ReaderProviderRegistry;
import com.integrationhub.platform.service.source.SourceProviderRegistry;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.reader.ReadSkip;
import com.integrationhub.platform.spi.reader.ReadBatch;
import com.integrationhub.platform.spi.source.SelectedSourceFile;
import com.integrationhub.platform.spi.task.BatchTaskProvider;
import com.integrationhub.platform.spi.task.TaskContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.context.ManagedExecutor;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicBoolean;

@ApplicationScoped
public class StreamingPipelineService {

    private final SourceProviderRegistry sourceProviderRegistry;
    private final ReaderProviderRegistry readerProviderRegistry;
    private final TaskProviderRegistry taskProviderRegistry;
    private final FileReadRuntimeSupport fileReadRuntimeSupport;
    private final StreamingPipelineWorker pipelineWorker;
    private final ManagedExecutor managedExecutor;

    public StreamingPipelineService(SourceProviderRegistry sourceProviderRegistry,
                                    ReaderProviderRegistry readerProviderRegistry,
                                    TaskProviderRegistry taskProviderRegistry,
                                    FileReadRuntimeSupport fileReadRuntimeSupport,
                                    StreamingPipelineWorker pipelineWorker,
                                    ManagedExecutor managedExecutor) {
        this.sourceProviderRegistry = sourceProviderRegistry;
        this.readerProviderRegistry = readerProviderRegistry;
        this.taskProviderRegistry = taskProviderRegistry;
        this.fileReadRuntimeSupport = fileReadRuntimeSupport;
        this.pipelineWorker = pipelineWorker;
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

        int batchSize = Math.max(fileReadRuntimeSupport.batchSize(sourceConfiguration), 1);
        boolean parallel = fileReadRuntimeSupport.isParallelEnabled(sourceConfiguration);
        var parallelMode = fileReadRuntimeSupport.parallelMode(sourceConfiguration);
        int maxConcurrency = resolveMaxConcurrency(sourceConfiguration, selectedFiles.size(), parallelMode);

        var fileSummaries = new ConcurrentLinkedQueue<BatchSummary>();
        var failedFiles = new ConcurrentLinkedQueue<StreamFailureSummary>();
        var aggregatedSkips = new ConcurrentLinkedQueue<ReadSkip>();
        var totalProcessed = new AtomicInteger(0);
        var totalValid = new AtomicInteger(0);
        var totalSkipped = new AtomicInteger(0);

        var fileErrorPolicy = fileReadRuntimeSupport.normalizeFileErrorPolicy(sourceConfiguration.get("fileErrorPolicy"));

        if (parallel && parallelMode == StreamingParallelMode.BATCH) {
            runParallelByBatch(processExecutionId, sinkTaskPlan, executionVariables, sourceProvider, readerProvider,
                    sourceConfiguration, readerConfiguration, sinkTaskProvider, sinkConfiguration,
                    selectedFiles, batchSize, fileSummaries, failedFiles, aggregatedSkips,
                    totalProcessed, totalValid, totalSkipped, fileErrorPolicy, maxConcurrency);
        } else if (parallel) {
            runParallel(processExecutionId, sinkTaskPlan, executionVariables, sourceProvider, readerProvider,
                    sourceConfiguration, readerConfiguration, sinkTaskProvider, sinkConfiguration,
                    selectedFiles, batchSize, fileSummaries, failedFiles, aggregatedSkips, 
                    totalProcessed, totalValid, totalSkipped, fileErrorPolicy, maxConcurrency);
        } else {
            runSequential(processExecutionId, sinkTaskPlan, executionVariables, sourceProvider, readerProvider,
                    sourceConfiguration, readerConfiguration, sinkTaskProvider, sinkConfiguration,
                    selectedFiles, batchSize, fileSummaries, failedFiles, aggregatedSkips, 
                    totalProcessed, totalValid, totalSkipped, fileErrorPolicy);
        }

        if (!failedFiles.isEmpty()) {
            throw buildFailureException(
                    failedFiles,
                    fileSummaries,
                    selectedFiles,
                    totalValid,
                    totalSkipped,
                    totalProcessed,
                    aggregatedSkips,
                    "continue".equals(fileErrorPolicy)
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
        
        for (var selectedFile : selectedFiles) {
            try {
                var sinkTaskContext = createSinkContext(processExecutionId, sinkTaskPlan, executionVariables);
                pipelineWorker.processSingleFile(selectedFile, sourceProvider, readerProvider, sourceConfiguration,
                        readerConfiguration, sinkTaskProvider, sinkConfiguration, sinkTaskContext,
                        batchSize, fileSummaries, aggregatedSkips, totalProcessed, totalValid, totalSkipped);
            } catch (Exception e) {
                handleFileError(selectedFile, e, fileErrorPolicy, failedFiles, fileSummaries, selectedFiles, totalProcessed, totalValid, totalSkipped, aggregatedSkips);
            }
        }
    }

    private void runParallelByBatch(Long processExecutionId,
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
                                    String fileErrorPolicy,
                                    int maxConcurrency) {

        for (var selectedFile : selectedFiles) {
            try {
                processSingleFileInBatchParallel(
                        processExecutionId,
                        sinkTaskPlan,
                        executionVariables,
                        selectedFile,
                        sourceProvider,
                        readerProvider,
                        sourceConfiguration,
                        readerConfiguration,
                        sinkTaskProvider,
                        sinkConfiguration,
                        batchSize,
                        fileSummaries,
                        aggregatedSkips,
                        totalProcessed,
                        totalValid,
                        totalSkipped,
                        maxConcurrency
                );
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
                             String fileErrorPolicy,
                             int maxConcurrency) {

        var stopRequested = new AtomicBoolean(false);
        var permits = new Semaphore(maxConcurrency);
        var futures = new java.util.ArrayList<CompletableFuture<Void>>();

        for (var file : selectedFiles) {
            if (stopRequested.get() && !"continue".equals(fileErrorPolicy)) {
                break;
            }

            permits.acquireUninterruptibly();
            if (stopRequested.get() && !"continue".equals(fileErrorPolicy)) {
                permits.release();
                break;
            }

            futures.add(CompletableFuture.runAsync(() -> {
                try {
                    if (stopRequested.get() && !"continue".equals(fileErrorPolicy)) {
                        return;
                    }
                    var sinkTaskContext = createSinkContext(processExecutionId, sinkTaskPlan, executionVariables);
                    pipelineWorker.processSingleFile(file, sourceProvider, readerProvider, sourceConfiguration,
                            readerConfiguration, sinkTaskProvider, sinkConfiguration, sinkTaskContext,
                            batchSize, fileSummaries, aggregatedSkips, totalProcessed, totalValid, totalSkipped);
                } catch (Exception e) {
                    recordParallelFileError(file, e, fileErrorPolicy, failedFiles, stopRequested);
                } finally {
                    permits.release();
                }
            }, managedExecutor));
        }

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
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
            throw buildFailureException(file, message, failedFiles, fileSummaries, selectedFiles, totalValid, totalSkipped, totalProcessed, aggregatedSkips, e);
        }
    }

    private void recordParallelFileError(SelectedSourceFile file,
                                         Exception error,
                                         String fileErrorPolicy,
                                         ConcurrentLinkedQueue<StreamFailureSummary> failedFiles,
                                         AtomicBoolean stopRequested) {
        var message = error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage();
        failedFiles.add(new StreamFailureSummary(file.name(), message));
        if (!"continue".equals(fileErrorPolicy)) {
            stopRequested.set(true);
        }
    }

    private int resolveMaxConcurrency(Map<String, Object> sourceConfiguration,
                                      int fileCount,
                                      StreamingParallelMode parallelMode) {
        var configured = fileReadRuntimeSupport.maxConcurrency(sourceConfiguration);
        if (parallelMode == StreamingParallelMode.BATCH) {
            if (configured <= 0) {
                return Math.max(1, Runtime.getRuntime().availableProcessors());
            }
            return Math.max(1, configured);
        }
        var effectiveFileCount = Math.max(fileCount, 1);
        if (configured <= 0) {
            return effectiveFileCount;
        }
        return Math.max(1, Math.min(configured, effectiveFileCount));
    }

    private void processSingleFileInBatchParallel(Long processExecutionId,
                                                  ProcessExecutionStateService.TaskPlan sinkTaskPlan,
                                                  Map<String, String> executionVariables,
                                                  SelectedSourceFile selectedFile,
                                                  com.integrationhub.platform.spi.source.SourceProvider sourceProvider,
                                                  com.integrationhub.platform.spi.reader.ReaderProvider readerProvider,
                                                  Map<String, Object> sourceConfiguration,
                                                  Map<String, Object> readerConfiguration,
                                                  BatchTaskProvider sinkTaskProvider,
                                                  Map<String, Object> sinkConfiguration,
                                                  int batchSize,
                                                  ConcurrentLinkedQueue<BatchSummary> fileSummaries,
                                                  ConcurrentLinkedQueue<ReadSkip> aggregatedSkips,
                                                  AtomicInteger totalProcessed,
                                                  AtomicInteger totalValid,
                                                  AtomicInteger totalSkipped,
                                                  int maxConcurrency) throws Exception {

        var payload = sourceProvider.openFile(selectedFile, sourceConfiguration);
        var batchFailure = new java.util.concurrent.atomic.AtomicReference<Throwable>();
        var stopRequested = new AtomicBoolean(false);
        var permits = new Semaphore(maxConcurrency);
        var futures = new java.util.ArrayList<CompletableFuture<Void>>();

        ReadResult fileResult;
        try {
            fileResult = readerProvider.readInBatches(payload, readerConfiguration, batchSize, batch -> {
                if (stopRequested.get()) {
                    throw new StopFileProcessingException();
                }

                permits.acquireUninterruptibly();
                if (stopRequested.get()) {
                    permits.release();
                    throw new StopFileProcessingException();
                }

                var batchRecords = List.copyOf(batch.records());
                futures.add(CompletableFuture.runAsync(() -> {
                    try {
                        var sinkTaskContext = createSinkContext(processExecutionId, sinkTaskPlan, executionVariables);
                        pipelineWorker.processBatch(payload, batchRecords, sinkTaskProvider, sinkConfiguration, sinkTaskContext);
                    } catch (Throwable error) {
                        batchFailure.compareAndSet(null, new IllegalStateException(
                                "Batch " + batch.batchNumber() + " failed for file " + selectedFile.name() + ": " + describeError(error),
                                error
                        ));
                        stopRequested.set(true);
                    } finally {
                        permits.release();
                    }
                }, managedExecutor));
            });
        } catch (StopFileProcessingException e) {
            fileResult = new ReadResult(List.of(), 0, 0, List.of());
        }

        waitForBatches(futures, batchFailure, selectedFile);

        var failure = batchFailure.get();
        if (failure != null) {
            if (failure instanceof Exception exception) {
                throw exception;
            }
            throw new IllegalStateException(failure.getMessage(), failure);
        }

        totalValid.addAndGet(fileResult.recordCount());
        totalSkipped.addAndGet(fileResult.skippedCount());
        aggregatedSkips.addAll(fileResult.skippedRows());
        var processedInFile = fileResult.recordCount();
        totalProcessed.addAndGet(processedInFile);
        fileSummaries.add(new BatchSummary(selectedFile.name(), fileResult.recordCount(), fileResult.skippedCount(), processedInFile));
    }

    private void waitForBatches(List<CompletableFuture<Void>> futures,
                                java.util.concurrent.atomic.AtomicReference<Throwable> batchFailure,
                                SelectedSourceFile selectedFile) {
        try {
            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        } catch (RuntimeException joinError) {
            batchFailure.compareAndSet(null, new IllegalStateException(
                    "Parallel batch execution failed for file " + selectedFile.name() + ": " + describeError(joinError),
                    joinError
            ));
        }
    }

    private String describeError(Throwable error) {
        var candidate = error;
        if (candidate instanceof java.util.concurrent.CompletionException completionException && completionException.getCause() != null) {
            candidate = completionException.getCause();
        }
        return candidate.getMessage() == null ? candidate.getClass().getSimpleName() : candidate.getMessage();
    }

    private static final class StopFileProcessingException extends RuntimeException {
    }

    private StreamingPipelineException buildFailureException(ConcurrentLinkedQueue<StreamFailureSummary> failedFiles,
                                                            ConcurrentLinkedQueue<BatchSummary> fileSummaries,
                                                            List<SelectedSourceFile> selectedFiles,
                                                            AtomicInteger totalValid,
                                                            AtomicInteger totalSkipped,
                                                            AtomicInteger totalProcessed,
                                                            ConcurrentLinkedQueue<ReadSkip> aggregatedSkips,
                                                            boolean continueMode) {
        var firstFailure = failedFiles.peek();
        var message = continueMode
                ? "Streaming completed with " + failedFiles.size() + " error(s)"
                : "Processing failed for file " + firstFailure.fileName() + ": " + firstFailure.message();
        return new StreamingPipelineException(
                message,
                firstFailure.fileName(),
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

    private StreamingPipelineException buildFailureException(SelectedSourceFile file,
                                                            String message,
                                                            ConcurrentLinkedQueue<StreamFailureSummary> failedFiles,
                                                            ConcurrentLinkedQueue<BatchSummary> fileSummaries,
                                                            List<SelectedSourceFile> selectedFiles,
                                                            AtomicInteger totalValid,
                                                            AtomicInteger totalSkipped,
                                                            AtomicInteger totalProcessed,
                                                            ConcurrentLinkedQueue<ReadSkip> aggregatedSkips,
                                                            Throwable cause) {
        return new StreamingPipelineException(
                "Processing failed for file " + file.name() + ": " + message,
                file.name(),
                List.copyOf(fileSummaries),
                List.copyOf(selectedFiles),
                totalValid.get(),
                totalSkipped.get(),
                totalProcessed.get(),
                List.copyOf(aggregatedSkips),
                List.copyOf(failedFiles),
                cause
        );
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
