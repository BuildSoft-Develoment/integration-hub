package com.integrationhub.platform.integration.suspend;

import com.integrationhub.platform.spi.task.AsyncOffloadSupport;
import com.integrationhub.platform.spi.task.SuspendableTaskProvider;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Test-only {@link SuspendableTaskProvider} para el E2E de Nivel 3 (ADR-015): su primer {@code execute}
 * (que corre en el consumer async) <b>suspende</b> esperando un evento externo; el {@code resume}
 * (disparado por callback/scheduler) completa. Verifica que el offload async de un suspendible NO va a
 * DEAD, sino que re-suspende y luego reanuda a completación.
 */
@ApplicationScoped
public class RecordingSuspendableTaskProvider implements SuspendableTaskProvider {

    public static final String TASK_TYPE = "TEST_SUSPENDABLE";

    public static final AtomicInteger EXECUTIONS = new AtomicInteger();
    public static final AtomicInteger RESUMES = new AtomicInteger();
    public static final AtomicReference<Object> SEEN_TASK_OUTPUTS = new AtomicReference<>();

    public static void resetRecording() {
        EXECUTIONS.set(0);
        RESUMES.set(0);
        SEEN_TASK_OUTPUTS.set(null);
    }

    @Override
    public String type() {
        return TASK_TYPE;
    }

    @Override
    public AsyncOffloadSupport asyncOffloadSupport() {
        return AsyncOffloadSupport.SUPPORTED;
    }

    @Override
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        EXECUTIONS.incrementAndGet();
        // Captura el taskOutputs rehidratado (Nivel 3, Approach B): prueba que el contexto capturado al
        // suspender por async llegó al provider en el consumer, incluso al re-suspender.
        SEEN_TASK_OUTPUTS.set(context.attributes().get("taskOutputs"));
        // Primer intento (en el consumer): no puede completarse aún → suspende esperando confirmación.
        return TaskResult.suspended("esperando confirmación externa", Map.of("attempt", 1));
    }

    @Override
    public TaskResult resume(TaskContext context, Map<String, Object> configuration,
                             Map<String, Object> suspendedState) {
        RESUMES.incrementAndGet();
        return TaskResult.success("confirmado tras resume", Map.of("done", true));
    }
}
