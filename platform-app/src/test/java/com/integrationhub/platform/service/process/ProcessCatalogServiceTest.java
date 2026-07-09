package com.integrationhub.platform.service.process;

import com.integrationhub.platform.api.mapper.process.ProcessDefinitionApiMapper;
import com.integrationhub.platform.api.request.process.ProcessDefinitionRequest;
import com.integrationhub.platform.api.request.process.ProcessTaskRequest;
import com.integrationhub.platform.domain.TaskType;
import com.integrationhub.platform.entity.ProcessDefinition;
import com.integrationhub.platform.entity.ProcessTaskDefinition;
import com.integrationhub.platform.entity.ReaderDefinition;
import com.integrationhub.platform.entity.SourceDefinition;
import com.integrationhub.platform.repository.ProcessDefinitionRepository;
import com.integrationhub.platform.repository.ProcessTaskDefinitionRepository;
import com.integrationhub.platform.repository.ReaderDefinitionRepository;
import com.integrationhub.platform.repository.SourceDefinitionRepository;
import com.integrationhub.platform.service.execution.TaskTypeRegistry;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// @covers RF-001 (reingenieria: prueba que cubre el/los RF en produccion)
class ProcessCatalogServiceTest {

    private final ProcessDefinitionRepository processDefinitionRepository = mock(ProcessDefinitionRepository.class);
    private final ProcessTaskDefinitionRepository processTaskDefinitionRepository = mock(ProcessTaskDefinitionRepository.class);
    private final SourceDefinitionRepository sourceDefinitionRepository = mock(SourceDefinitionRepository.class);
    private final ReaderDefinitionRepository readerDefinitionRepository = mock(ReaderDefinitionRepository.class);
    private final ProcessDefinitionApiMapper apiMapper = new ProcessDefinitionApiMapper();
    private final TaskTypeRegistry taskTypeRegistry = mock(TaskTypeRegistry.class);

    private final ProcessCatalogService service = new ProcessCatalogService(
            processDefinitionRepository,
            processTaskDefinitionRepository,
            sourceDefinitionRepository,
            readerDefinitionRepository,
            apiMapper,
            taskTypeRegistry,
            new Mt101PayResolutionValidator(new com.fasterxml.jackson.databind.ObjectMapper()));

    private ProcessDefinitionRequest request(boolean scheduled, String scheduleEvery, List<ProcessTaskRequest> tasks) {
        tasks.forEach(task -> when(taskTypeRegistry.isRegistered(task.taskType())).thenReturn(true));
        return new ProcessDefinitionRequest("carga", "desc", true, scheduled, scheduleEvery, "{}", tasks);
    }

    @Test
    void createPersistsDefinitionAndTasks() {
        var task = new ProcessTaskRequest(1, TaskType.REST_CALL, null, null, "{}");

        var response = service.create(request(false, null, List.of(task)));

        assertEquals("carga", response.name());
        assertEquals(1, response.tasks().size());
        assertEquals(TaskType.REST_CALL, response.tasks().get(0).taskType());
        verify(processDefinitionRepository).persist(any(ProcessDefinition.class));
        verify(processTaskDefinitionRepository).persist(any(ProcessTaskDefinition.class));
    }

    @Test
    void createScheduledActiveSetsNextRunAt() {
        var response = service.create(request(true, "30s", List.of()));

        assertTrue(response.scheduled());
        assertEquals("30s", response.scheduleEvery());
        assertNotNull(response.nextRunAt());
    }

    @Test
    void createBlankScheduleEveryNormalizesToNullAndClearsNextRun() {
        var response = service.create(request(true, "   ", List.of()));

        assertNull(response.scheduleEvery());
        assertNull(response.nextRunAt());
    }

    @Test
    void createFileReadTaskWithoutSourceOrReaderIsRejected() {
        var badTask = new ProcessTaskRequest(1, TaskType.FILE_READ, null, null, "{}");

        var error = assertThrows(IllegalArgumentException.class,
                () -> service.create(request(false, null, List.of(badTask))));

        assertTrue(error.getMessage().contains("FILE_READ"));
    }

    @Test
    void createUnknownTaskTypeIsRejected() {
        var badTask = new ProcessTaskRequest(1, "UNKNOWN_TASK", null, null, "{}");
        when(taskTypeRegistry.isRegistered("UNKNOWN_TASK")).thenReturn(false);

        var error = assertThrows(IllegalArgumentException.class,
                () -> service.create(new ProcessDefinitionRequest("carga", "desc", true,
                        false, null, "{}", List.of(badTask))));

        assertTrue(error.getMessage().contains("UNKNOWN_TASK"));
    }

    @Test
    void createFileReadTaskResolvesSourceAndReaderRefs() {
        var source = new SourceDefinition();
        source.id = 5L;
        source.name = "dropzone";
        var reader = new ReaderDefinition();
        reader.id = 6L;
        reader.name = "csv";
        when(sourceDefinitionRepository.findRequired(5L)).thenReturn(source);
        when(readerDefinitionRepository.findRequired(6L)).thenReturn(reader);
        var task = new ProcessTaskRequest(1, TaskType.FILE_READ, 5L, 6L, "{}");

        var response = service.create(request(false, null, List.of(task)));

        var taskResponse = response.tasks().get(0);
        assertEquals(5L, taskResponse.sourceDefinition().id());
        assertEquals(6L, taskResponse.readerDefinition().id());
    }

    @Test
    void updateDeactivatesExistingTasksThenReplaces() {
        var existing = new ProcessDefinition();
        existing.id = 9L;
        when(processDefinitionRepository.findRequired(9L)).thenReturn(existing);
        var task = new ProcessTaskRequest(1, TaskType.NOTIFICATION, null, null, "{}");

        var response = service.update(9L, request(false, null, List.of(task)));

        assertEquals(9L, response.id());
        verify(processTaskDefinitionRepository).deactivateByProcessDefinition(existing);
        verify(processTaskDefinitionRepository).persist(any(ProcessTaskDefinition.class));
    }

    @Test
    void setActiveFalseClearsNextRunAt() {
        var existing = new ProcessDefinition();
        existing.id = 3L;
        existing.scheduled = true;
        existing.scheduleEvery = "30s";
        existing.nextRunAt = java.time.LocalDateTime.now();
        when(processDefinitionRepository.findRequired(3L)).thenReturn(existing);

        var response = service.setActive(3L, false);

        assertFalse(response.active());
        assertNull(response.nextRunAt());
    }

    @Test
    void setActiveTrueOnScheduledSchedulesNextRun() {
        var existing = new ProcessDefinition();
        existing.id = 4L;
        existing.scheduled = true;
        existing.scheduleEvery = "5m";
        existing.nextRunAt = null;
        when(processDefinitionRepository.findRequired(4L)).thenReturn(existing);

        var response = service.setActive(4L, true);

        assertTrue(response.active());
        assertNotNull(response.nextRunAt());
    }

    @Test
    void listAllMapsOrderedDefinitions() {
        var a = new ProcessDefinition();
        a.id = 1L;
        a.name = "a";
        var b = new ProcessDefinition();
        b.id = 2L;
        b.name = "b";
        when(processDefinitionRepository.listAllOrdered()).thenReturn(List.of(a, b));

        var responses = service.listAll();

        assertEquals(2, responses.size());
        assertEquals("a", responses.get(0).name());
        assertEquals("b", responses.get(1).name());
    }
}
