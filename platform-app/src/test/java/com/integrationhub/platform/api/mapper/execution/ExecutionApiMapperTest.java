package com.integrationhub.platform.api.mapper.execution;

import com.integrationhub.platform.domain.ExecutionStatus;
import com.integrationhub.platform.entity.ProcessDefinition;
import com.integrationhub.platform.entity.ProcessExecution;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

// @covers RF-002 (reingenieria: prueba que cubre el/los RF en produccion)
class ExecutionApiMapperTest {

    private final ExecutionApiMapper mapper = new ExecutionApiMapper();

    private ProcessExecution sampleExecution() {
        var definition = new ProcessDefinition();
        definition.id = 2L;
        definition.name = "carga-diaria";

        var execution = new ProcessExecution();
        execution.id = 5L;
        execution.processDefinition = definition;
        execution.status = ExecutionStatus.RUNNING;
        execution.startedAt = LocalDateTime.of(2026, 1, 1, 8, 0);
        execution.finishedAt = null;
        execution.sourceExecutionId = 99L;
        execution.triggerSource = "MANUAL";
        execution.details = "en progreso";
        return execution;
    }

    @Test
    void toStartResponseMapsEnumNameAndScalars() {
        var response = mapper.toStartResponse(sampleExecution());

        assertEquals(5L, response.id());
        assertEquals("RUNNING", response.status());
        assertEquals(LocalDateTime.of(2026, 1, 1, 8, 0), response.startedAt());
        assertNull(response.finishedAt());
        assertEquals(99L, response.sourceExecutionId());
        assertEquals("MANUAL", response.triggerSource());
        assertEquals("en progreso", response.details());
    }

    @Test
    void toResponseIncludesProcessDefinitionData() {
        var response = mapper.toResponse(sampleExecution());

        assertEquals(5L, response.id());
        assertEquals(2L, response.processDefinitionId());
        assertEquals("carga-diaria", response.processName());
        assertEquals("RUNNING", response.status());
        assertEquals(99L, response.sourceExecutionId());
        assertEquals("MANUAL", response.triggerSource());
        assertEquals("en progreso", response.details());
    }
}
