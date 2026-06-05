package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.domain.TaskType;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class TaskOutputRegistryTest {

    @Test
    void registersSummaryAndTableOutputsByTaskRef() {
        var registry = new TaskOutputRegistry(new JsonConfigurationMapper());
        var taskPlan = new ProcessExecutionStateService.TaskPlan(
                20L,
                2,
                TaskType.DB_WRITE,
                "{\"taskRef\":\"task-2-db-write\",\"targetTable\":\"public.cliente_target\"}",
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
        var taskOutputs = new LinkedHashMap<String, Object>();

        registry.registerTaskResult(taskOutputs, taskPlan, registry.configuration(taskPlan.configurationJson()), Map.of(
                "targetTable", "public.cliente_target",
                "writtenCount", 250,
                "processedCount", 250
        ));

        assertEquals(250, taskOutputs.get("writtenCount"));
        assertEquals(250, taskOutputs.get("task-2-db-write.writtenCount"));
        assertEquals(250, taskOutputs.get("task-2-db-write.summary.writtenCount"));
        assertEquals("public.cliente_target", taskOutputs.get("task-2-db-write.table"));
    }
}
