package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.domain.TaskType;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;

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

    @Test
    void publishesRecordsOutputUnderQualifiedTaskRefKey() {
        // Contrato critico del pipeline MT101 (spec 008): MT101_VALIDATE/ARCHIVE/PAY
        // consumen `<taskRef>.records` via Mt101MessageInputResolver. Si esta clave
        // calificada deja de publicarse, toda la cadena downstream se rompe en
        // silencio ("skipped because there are no messages").
        var registry = new TaskOutputRegistry(new JsonConfigurationMapper());
        var taskPlan = new ProcessExecutionStateService.TaskPlan(
                30L,
                2,
                "MT101_BUILD",
                "{\"taskRef\":\"build-mt101\"}",
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
        var taskOutputs = new LinkedHashMap<String, Object>();
        var records = List.of(Map.of("sendersReference", "PROC-1"));

        registry.registerTaskResult(taskOutputs, taskPlan, registry.configuration(taskPlan.configurationJson()), Map.of(
                "records", records,
                "messageCount", 1
        ));

        assertSame(records, taskOutputs.get("build-mt101.records"),
                "la clave calificada <taskRef>.records debe publicarse para el resolver MT101");
        assertSame(records, taskOutputs.get("build-mt101.summary.records"));
        assertEquals(1, taskOutputs.get("build-mt101.messageCount"));
    }
}
