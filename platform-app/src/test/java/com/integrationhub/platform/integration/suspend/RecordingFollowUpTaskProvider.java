package com.integrationhub.platform.integration.suspend;

import com.integrationhub.platform.spi.task.AsyncOffloadSupport;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Test-only provider downstream para validar la continuacion M-2.1: registra
 * cuantas veces se ejecuto y que {@code taskOutputs} de la tarea suspendida
 * (rehidratados del envelope) le llegaron.
 *
 * @trace spec 003 T-017 (M-2.1), ADR-009
 */
@ApplicationScoped
public class RecordingFollowUpTaskProvider implements TaskProvider {

    public static final String TASK_TYPE = "TEST_FOLLOW_UP";

    public static final AtomicInteger EXECUTIONS = new AtomicInteger();
    public static final AtomicReference<Object> SEEN_UPSTREAM_STATUS = new AtomicReference<>();

    public static void resetRecording() {
        EXECUTIONS.set(0);
        SEEN_UPSTREAM_STATUS.set(null);
    }

    @Override
    public String type() {
        return TASK_TYPE;
    }

    // Config-only (taskOutputs es opcional): offloadable en cualquier modo, incl. once async (E2E).
    @Override
    public AsyncOffloadSupport asyncOffloadSupport() {
        return AsyncOffloadSupport.SUPPORTED;
    }

    @Override
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        EXECUTIONS.incrementAndGet();
        if (context.attributes().get("taskOutputs") instanceof Map<?, ?> taskOutputs) {
            SEEN_UPSTREAM_STATUS.set(taskOutputs.get("task-1.status"));
        }
        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("followUpDone", true);
        return TaskResult.success("follow-up executed", outputs);
    }
}
