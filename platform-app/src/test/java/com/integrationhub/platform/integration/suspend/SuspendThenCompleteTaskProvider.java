package com.integrationhub.platform.integration.suspend;

import com.integrationhub.platform.spi.task.SuspendableTaskProvider;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Test-only {@link SuspendableTaskProvider} para validar el contrato de
 * suspend/resume del engine sin depender de un caso de uso productivo.
 *
 * <p>Comportamiento: primera ejecucion siempre suspende con state
 * {@code {attempt: 1}}; el resume completa con outputs que reflejan el
 * {@code externalEvent} recibido del callback + el state previo.</p>
 *
 * @trace spec 003 T-017 (M-2 suspension engine), ADR-009
 */
@ApplicationScoped
public class SuspendThenCompleteTaskProvider implements SuspendableTaskProvider {

    public static final String TASK_TYPE = "TEST_SUSPEND_COMPLETE";

    @Override
    public String type() {
        return TASK_TYPE;
    }

    @Override
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        var state = new LinkedHashMap<String, Object>();
        state.put("attempt", 1);
        state.put("startedFor", "test-suspend-complete");
        return TaskResult.suspended("waiting for external callback", state);
    }

    @Override
    public TaskResult resume(TaskContext context,
                             Map<String, Object> configuration,
                             Map<String, Object> suspendedState) {
        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("resumedFromAttempt", suspendedState.get("attempt"));
        outputs.put("externalEvent", suspendedState.get("externalEvent"));
        outputs.put("status", "COMPLETED");
        return TaskResult.success("Resumed and completed", outputs);
    }
}
