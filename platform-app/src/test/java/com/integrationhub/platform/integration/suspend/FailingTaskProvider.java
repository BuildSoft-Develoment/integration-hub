package com.integrationhub.platform.integration.suspend;

import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Map;

/**
 * Test-only provider que devuelve {@link TaskResult#failure} (fallo de negocio,
 * sin excepcion). Valida la propagacion de failure al engine: por defecto el
 * proceso debe quedar FAILED y las tareas downstream NO deben ejecutarse.
 *
 * @trace spec 003 (propagacion de TaskResult.failure)
 */
@ApplicationScoped
public class FailingTaskProvider implements TaskProvider {

    public static final String TASK_TYPE = "TEST_BUSINESS_FAILURE";

    @Override
    public String type() {
        return TASK_TYPE;
    }

    @Override
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        return TaskResult.failure("business validation failed: 3 invalid records",
                Map.of("invalidCount", 3, "errors", java.util.List.of("E1", "E2", "E3")));
    }
}
