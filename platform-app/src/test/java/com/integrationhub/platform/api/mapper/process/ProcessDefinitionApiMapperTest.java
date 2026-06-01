package com.integrationhub.platform.api.mapper.process;

import com.integrationhub.platform.domain.TaskType;
import com.integrationhub.platform.entity.ProcessDefinition;
import com.integrationhub.platform.entity.ProcessTaskDefinition;
import com.integrationhub.platform.entity.ReaderDefinition;
import com.integrationhub.platform.entity.SourceDefinition;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

// @covers RF-001 (reingenieria: prueba que cubre el/los RF en produccion)
class ProcessDefinitionApiMapperTest {

    private final ProcessDefinitionApiMapper mapper = new ProcessDefinitionApiMapper();

    private ProcessDefinition baseDefinition() {
        var definition = new ProcessDefinition();
        definition.id = 1L;
        definition.name = "carga-clientes";
        definition.description = "Carga diaria";
        definition.active = true;
        definition.scheduled = true;
        definition.scheduleEvery = "30s";
        definition.nextRunAt = LocalDateTime.of(2026, 1, 1, 9, 0);
        definition.lastRunAt = LocalDateTime.of(2026, 1, 1, 8, 0);
        definition.flowLayoutJson = "{}";
        definition.tasks = new ArrayList<>();
        return definition;
    }

    private ProcessTaskDefinition task(Long id, int order, TaskType type, boolean active) {
        var task = new ProcessTaskDefinition();
        task.id = id;
        task.taskOrder = order;
        task.taskType = type;
        task.active = active;
        task.configurationJson = "{}";
        return task;
    }

    @Test
    void toResponseFiltersInactiveAndSortsByTaskOrder() {
        var definition = baseDefinition();
        definition.tasks.add(task(10L, 2, TaskType.DB_WRITE, true));
        definition.tasks.add(task(11L, 1, TaskType.FILE_READ, true));
        definition.tasks.add(task(12L, 3, TaskType.NOTIFICATION, false)); // inactiva -> excluida

        var response = mapper.toResponse(definition);

        assertEquals(1L, response.id());
        assertEquals("carga-clientes", response.name());
        assertEquals("30s", response.scheduleEvery());
        assertEquals(2, response.tasks().size());
        // ordenadas: taskOrder 1 antes que 2
        assertEquals(11L, response.tasks().get(0).id());
        assertEquals(TaskType.FILE_READ, response.tasks().get(0).taskType());
        assertEquals(10L, response.tasks().get(1).id());
    }

    @Test
    void toResponseHandlesNullTaskList() {
        var definition = baseDefinition();
        definition.tasks = null;

        var response = mapper.toResponse(definition);

        assertNotNull(response.tasks());
        assertTrue(response.tasks().isEmpty());
    }

    @Test
    void toTaskResponseMapsSourceAndReaderRefs() {
        var definition = baseDefinition();
        var source = new SourceDefinition();
        source.id = 5L;
        source.name = "dropzone";
        var reader = new ReaderDefinition();
        reader.id = 6L;
        reader.name = "csv-reader";
        var task = task(20L, 1, TaskType.FILE_READ, true);
        task.sourceDefinition = source;
        task.readerDefinition = reader;
        definition.tasks.add(task);

        var taskResponse = mapper.toResponse(definition).tasks().get(0);

        assertEquals(5L, taskResponse.sourceDefinition().id());
        assertEquals("dropzone", taskResponse.sourceDefinition().name());
        assertEquals(6L, taskResponse.readerDefinition().id());
        assertEquals("csv-reader", taskResponse.readerDefinition().name());
    }

    @Test
    void toTaskResponseLeavesNullRefsWhenAbsent() {
        var definition = baseDefinition();
        definition.tasks.add(task(21L, 1, TaskType.REST_CALL, true));

        var taskResponse = mapper.toResponse(definition).tasks().get(0);

        assertNull(taskResponse.sourceDefinition());
        assertNull(taskResponse.readerDefinition());
    }

    @Test
    void toScheduleResponseFromEntityCopiesScheduleFields() {
        var response = mapper.toScheduleResponse(baseDefinition());

        assertEquals(1L, response.id());
        assertEquals("carga-clientes", response.name());
        assertTrue(response.scheduled());
        assertEquals("30s", response.scheduleEvery());
        assertEquals(LocalDateTime.of(2026, 1, 1, 9, 0), response.nextRunAt());
    }

    @Test
    void toScheduleResponseFromResponseRoundTrips() {
        var definitionResponse = mapper.toResponse(baseDefinition());

        var scheduleResponse = mapper.toScheduleResponse(definitionResponse);

        assertEquals(definitionResponse.id(), scheduleResponse.id());
        assertEquals(definitionResponse.name(), scheduleResponse.name());
        assertEquals(definitionResponse.scheduleEvery(), scheduleResponse.scheduleEvery());
        assertEquals(definitionResponse.lastRunAt(), scheduleResponse.lastRunAt());
    }
}
