package com.integrationhub.platform.integration.async;

import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.task.AsyncOffloadSupport;
import com.integrationhub.platform.spi.task.BatchTaskProvider;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
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
    /** taskOutputs rehidratado en la última slice (Nivel 2): prueba la propagación de contexto E2E. */
    public static final java.util.concurrent.atomic.AtomicReference<Object> SEEN_TASK_OUTPUTS =
            new java.util.concurrent.atomic.AtomicReference<>();
    /** ids de los records vistos por el provider (prueba qué páginas se ejecutaron y cuáles no). */
    public static final Set<String> SEEN_IDS = ConcurrentHashMap.newKeySet();
    /** Si un batch contiene este id, el provider falla (para probar fail-fast en streaming); null = nunca. */
    public static volatile String FAIL_ON_RECORD_ID = null;

    public static void reset() {
        SLICE_EXECUTIONS.set(0);
        TOTAL_RECORDS.set(0);
        SEEN_TASK_OUTPUTS.set(null);
        SEEN_IDS.clear();
        FAIL_ON_RECORD_ID = null;
    }

    @Override
    public String type() {
        return TASK_TYPE;
    }

    // Trabaja sobre los records del slice (que viajan en scatter) ⇒ SLICE_ONLY.
    @Override
    public AsyncOffloadSupport asyncOffloadSupport() {
        return AsyncOffloadSupport.SLICE_ONLY;
    }

    @Override
    public TaskResult executeRecords(TaskContext context, Map<String, Object> configuration,
                                     List<ReadRecord> records, SourcePayload sourcePayload) {
        SLICE_EXECUTIONS.incrementAndGet();
        TOTAL_RECORDS.addAndGet(records.size());
        SEEN_TASK_OUTPUTS.set(context.attributes().get("taskOutputs"));
        boolean fail = false;
        for (var record : records) {
            var id = record.values().get("id");
            if (id != null) {
                SEEN_IDS.add(String.valueOf(id));
                if (FAIL_ON_RECORD_ID != null && FAIL_ON_RECORD_ID.equals(String.valueOf(id))) {
                    fail = true;
                }
            }
        }
        if (fail) {
            return TaskResult.failure("slice falló en record " + FAIL_ON_RECORD_ID);
        }
        return TaskResult.success("slice ok", Map.of("count", records.size()));
    }
}
