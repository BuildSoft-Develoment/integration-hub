package com.integrationhub.platform.spi.task;

import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.source.SourcePayload;

import java.util.List;
import java.util.Map;

import com.integrationhub.platform.spi.reader.ReadResult;
import java.util.List;
import java.util.Map;

/**
 * Interface for tasks that support processing records in batches (e.g., DB_WRITE, REST_CALL).
 * This enables high-performance streaming pipelines by processing chunks of data.
 */
public interface BatchTaskProvider extends TaskProvider {

    /**
     * Executes the task logic for a batch of records.
     *
     * @param context       The task context.
     * @param configuration The task configuration.
     * @param records       The batch of records to process.
     * @param sourcePayload The information about the source file/stream.
     * @return The result of the batch execution.
     */
    TaskResult executeRecords(TaskContext context,
                              Map<String, Object> configuration,
                              List<ReadRecord> records,
                              SourcePayload sourcePayload);

    @Override
    default TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        ReadResult readResult = (ReadResult) context.attributes().get("readResult");
        SourcePayload sourcePayload = (SourcePayload) context.attributes().get("sourcePayload");
        List<ReadRecord> records = readResult == null ? List.of() : readResult.records();
        return executeRecords(context, configuration, records, sourcePayload);
    }
}
