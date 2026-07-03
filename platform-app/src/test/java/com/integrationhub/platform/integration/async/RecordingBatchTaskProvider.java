package com.integrationhub.platform.integration.async;

import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.task.BatchTaskProvider;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Test-only {@link BatchTaskProvider} para el E2E del scatter-gather (Opción B): cuenta cuántas
 * slices ejecutó y cuántos records procesó en total, para verificar que el reparto por-slice llega
 * completo a los workers.
 */
@ApplicationScoped
public class RecordingBatchTaskProvider implements BatchTaskProvider {

    public static final String TASK_TYPE = "TEST_SCATTER_BATCH";

    public static final AtomicInteger SLICE_EXECUTIONS = new AtomicInteger();
    public static final AtomicInteger TOTAL_RECORDS = new AtomicInteger();

    public static void reset() {
        SLICE_EXECUTIONS.set(0);
        TOTAL_RECORDS.set(0);
    }

    @Override
    public String type() {
        return TASK_TYPE;
    }

    @Override
    public TaskResult executeRecords(TaskContext context, Map<String, Object> configuration,
                                     List<ReadRecord> records, SourcePayload sourcePayload) {
        SLICE_EXECUTIONS.incrementAndGet();
        TOTAL_RECORDS.addAndGet(records.size());
        return TaskResult.success("slice ok", Map.of("count", records.size()));
    }
}
