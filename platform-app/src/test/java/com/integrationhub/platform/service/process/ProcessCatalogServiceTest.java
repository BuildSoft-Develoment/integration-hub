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
import com.integrationhub.platform.spi.process.ProcessDefinitionValidator;
import com.integrationhub.platform.spi.process.ProcessTaskView;
import jakarta.enterprise.inject.Instance;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
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

// Esta clase toca dos features a la vez, asi que lo declara en dos lineas en vez de mezclarlas:
// crear/mantener/activar definiciones es de 003, y fijar la frecuencia con su proximo disparo es de
// 006. Una sola linea con los tres codigos no diria de cual es cada uno.
// @covers spec 003-diseno-y-ejecucion-procesos RF-001, RF-003 (create persiste definicion y tareas;
// setActive habilita la ejecucion)
// @covers spec 006-programacion-procesos RF-001 (schedule_every fija next_run_at, y en blanco lo limpia)
class ProcessCatalogServiceTest {

    private final ProcessDefinitionRepository processDefinitionRepository = mock(ProcessDefinitionRepository.class);
    private final ProcessTaskDefinitionRepository processTaskDefinitionRepository = mock(ProcessTaskDefinitionRepository.class);
    private final SourceDefinitionRepository sourceDefinitionRepository = mock(SourceDefinitionRepository.class);
    private final ReaderDefinitionRepository readerDefinitionRepository = mock(ReaderDefinitionRepository.class);
    private final ProcessDefinitionApiMapper apiMapper = new ProcessDefinitionApiMapper();
    private final TaskTypeRegistry taskTypeRegistry = mock(TaskTypeRegistry.class);

    /**
     * ADR-021: el motor solo DELEGA en los validadores registrados. Este test ya no instancia los
     * del money-path MT101 (su comportamiento se prueba en sus propios tests, junto al vertical):
     * un validador de prueba que registra las invocaciones alcanza y deja al test del motor sin
     * dependencia de ningun vertical.
     */
    private final List<List<ProcessTaskView>> validatedViews = new ArrayList<>();
    private final ProcessDefinitionValidator recordingValidator = validatedViews::add;

    @SuppressWarnings("unchecked")
    private final Instance<ProcessDefinitionValidator> definitionValidators = mock(Instance.class);

    {
        // Un iterador nuevo por invocacion: validateMoneyPath recorre la coleccion cada vez.
        when(definitionValidators.iterator()).thenAnswer(invocation -> List.of(recordingValidator).iterator());
    }

    private final ProcessCatalogService service = new ProcessCatalogService(
            processDefinitionRepository,
            processTaskDefinitionRepository,
            sourceDefinitionRepository,
            readerDefinitionRepository,
            apiMapper,
            taskTypeRegistry,
            definitionValidators);

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
    void createDelegaLaValidacionDePublicacionEnLosValidadoresRegistrados() {
        // ADR-021: el motor no conoce ninguna regla de vertical; solo pasa la vista de tareas a
        // quien se haya registrado por CDI.
        var task = new ProcessTaskRequest(1, TaskType.REST_CALL, null, null, "{\"taskRef\":\"t1\"}");

        service.create(request(false, null, List.of(task)));

        assertEquals(1, validatedViews.size(), "debe invocarse una vez al publicar");
        var view = validatedViews.get(0);
        assertEquals(1, view.size());
        assertEquals(TaskType.REST_CALL, view.get(0).taskType());
        assertEquals(1, view.get(0).taskOrder());
        assertEquals("{\"taskRef\":\"t1\"}", view.get(0).configurationJson());
    }

    @Test
    void createDeUnBorradorNoInvocaLosValidadores() {
        // Contrato del SPI: la validacion de publicacion corre solo cuando el proceso queda RUNNABLE.
        var task = new ProcessTaskRequest(1, TaskType.REST_CALL, null, null, "{}");
        var draft = new ProcessDefinitionRequest("borrador", "desc", false, false, null, "{}", List.of(task));
        when(taskTypeRegistry.isRegistered(TaskType.REST_CALL)).thenReturn(true);

        service.create(draft);

        assertTrue(validatedViews.isEmpty(), "un borrador se guarda sin validar el cableado");
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
