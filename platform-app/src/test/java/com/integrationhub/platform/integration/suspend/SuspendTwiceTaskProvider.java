package com.integrationhub.platform.integration.suspend;

import com.integrationhub.platform.spi.task.SuspendableTaskProvider;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Test-only provider que se suspende DOS veces: valida el ciclo de
 * re-suspension del engine (RE_SUSPENDED emite token nuevo y ese token debe
 * ser ubicable — regresion del bug donde {@code resumed_at} no se limpiaba
 * al re-suspender y el segundo token quedaba muerto).
 *
 * @trace spec 003-diseno-y-ejecucion-procesos T-017 (M-2 suspension engine), ADR-009
 */
@ApplicationScoped
public class SuspendTwiceTaskProvider implements SuspendableTaskProvider {

    public static final String TASK_TYPE = "TEST_SUSPEND_TWICE";

    @Override
    public String type() {
        return TASK_TYPE;
    }

    @Override
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        var state = new LinkedHashMap<String, Object>();
        state.put("cycle", 1);
        return TaskResult.suspended("waiting for first event", state);
    }

    @Override
    public TaskResult resume(TaskContext context,
                             Map<String, Object> configuration,
                             Map<String, Object> suspendedState) {
        var cycle = ((Number) suspendedState.getOrDefault("cycle", 1)).intValue();
        if (cycle < 2) {
            var state = new LinkedHashMap<String, Object>();
            state.put("cycle", cycle + 1);
            return TaskResult.suspended("waiting for second event", state);
        }
        return TaskResult.success("completed after " + cycle + " suspension cycles",
                Map.of("cycles", cycle));
    }
}
