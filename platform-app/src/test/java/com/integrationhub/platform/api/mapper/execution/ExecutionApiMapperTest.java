package com.integrationhub.platform.api.mapper.execution;

import com.integrationhub.platform.spi.execution.ExecutionStatus;
import com.integrationhub.platform.entity.ProcessDefinition;
import com.integrationhub.platform.entity.ProcessExecution;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

// Declaraba RF-002 y ningun RF-002 de ninguna spec describe esto (los candidatos son tipos de tarea,
// layout de readers, activar fuentes...). Se reasigna a los dos requisitos que este test si ejercita,
// uno por feature, en vez de cualificar un codigo que no correspondia.
// @covers spec 003-diseno-y-ejecucion-procesos RF-004 (toStartResponse: lo que devuelve el disparo manual)
// @covers spec 004-observabilidad-y-auditoria RF-001 (toResponse: la ejecucion tal como se consulta)
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
