package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.spi.reader.ReadSkip;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.source.SelectedSourceFile;
import com.integrationhub.platform.spi.task.BatchTaskProvider;
import com.integrationhub.platform.spi.task.TaskContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.control.ActivateRequestContext;
import jakarta.transaction.Transactional;

import java.util.Map;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicInteger;

@ApplicationScoped
public class StreamingPipelineWorker {

    private final FileReadRuntimeSupport fileReadRuntimeSupport;

    public StreamingPipelineWorker(FileReadRuntimeSupport fileReadRuntimeSupport) {
        this.fileReadRuntimeSupport = fileReadRuntimeSupport;
    }

    @ActivateRequestContext
    @Transactional(Transactional.TxType.NOT_SUPPORTED)
    public void processSingleFile(SelectedSourceFile selectedFile,
                                  com.integrationhub.platform.spi.source.SourceProvider sourceProvider,
                                  com.integrationhub.platform.spi.reader.ReaderProvider readerProvider,
                                  Map<String, Object> sourceConfiguration,
                                  Map<String, Object> readerConfiguration,
                                  BatchTaskProvider sinkTaskProvider,
                                  Map<String, Object> sinkConfiguration,
                                  TaskContext sinkTaskContext,
                                  int batchSize,
                                  ConcurrentLinkedQueue<StreamingPipelineService.BatchSummary> fileSummaries,
                                  ConcurrentLinkedQueue<ReadSkip> aggregatedSkips,
                                  AtomicInteger totalProcessed,
                                  AtomicInteger totalValid,
                                  AtomicInteger totalSkipped,
                                  SyncProgressReporter progressReporter) throws Exception {

        var payload = sourceProvider.openFile(selectedFile, sourceConfiguration);
        sinkTaskContext.attributes().put("sourcePayload", payload);

        var fileResult = readerProvider.readInBatches(payload, readerConfiguration, batchSize, batch -> {
            var enrichedRecords = fileReadRuntimeSupport.enrichRecordsWithSourceMetadata(batch.records(), payload);
            var writeResult = sinkTaskProvider.executeRecords(sinkTaskContext, sinkConfiguration, enrichedRecords, payload);
            if (!writeResult.success()) {
                throw new IllegalStateException(writeResult.details());
            }
            if (progressReporter != null) {
                progressReporter.batchWritten(enrichedRecords.size());
            }
        });

        totalValid.addAndGet(fileResult.recordCount());
        totalSkipped.addAndGet(fileResult.skippedCount());
        aggregatedSkips.addAll(fileResult.skippedRows());
        var processedInFile = fileResult.recordCount();
        totalProcessed.addAndGet(processedInFile);

        fileSummaries.add(new StreamingPipelineService.BatchSummary(
                selectedFile.name(),
                fileResult.recordCount(),
                fileResult.skippedCount(),
                processedInFile
        ));
    }

    @ActivateRequestContext
    @Transactional(Transactional.TxType.NOT_SUPPORTED)
    public void processBatch(SourcePayload payload,
                             List<ReadRecord> records,
                             BatchTaskProvider sinkTaskProvider,
                             Map<String, Object> sinkConfiguration,
                             TaskContext sinkTaskContext,
                             SyncProgressReporter progressReporter) {
        sinkTaskContext.attributes().put("sourcePayload", payload);
        var enrichedRecords = fileReadRuntimeSupport.enrichRecordsWithSourceMetadata(records, payload);
        var writeResult = sinkTaskProvider.executeRecords(sinkTaskContext, sinkConfiguration, enrichedRecords, payload);
        if (!writeResult.success()) {
            throw new IllegalStateException(writeResult.details());
        }
        if (progressReporter != null) {
            progressReporter.batchWritten(enrichedRecords.size());
        }
    }
}
