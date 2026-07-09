package com.integrationhub.platform.service.process;

import com.integrationhub.platform.api.mapper.process.ProcessDefinitionApiMapper;
import com.integrationhub.platform.api.request.process.ProcessDefinitionRequest;
import com.integrationhub.platform.api.request.process.ProcessTaskRequest;
import com.integrationhub.platform.api.response.process.ProcessDefinitionResponse;
import com.integrationhub.platform.domain.TaskType;
import com.integrationhub.platform.entity.ProcessDefinition;
import com.integrationhub.platform.entity.ProcessTaskDefinition;
import com.integrationhub.platform.repository.ProcessDefinitionRepository;
import com.integrationhub.platform.repository.ProcessTaskDefinitionRepository;
import com.integrationhub.platform.repository.ReaderDefinitionRepository;
import com.integrationhub.platform.repository.SourceDefinitionRepository;
import com.integrationhub.platform.service.execution.TaskTypeRegistry;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// @trace RF-001 (reingenieria: clase que implementa el/los RF en produccion)
@ApplicationScoped
public class ProcessCatalogService {

    private final ProcessDefinitionRepository processDefinitionRepository;
    private final ProcessTaskDefinitionRepository processTaskDefinitionRepository;
    private final SourceDefinitionRepository sourceDefinitionRepository;
    private final ReaderDefinitionRepository readerDefinitionRepository;
    private final ProcessDefinitionApiMapper processDefinitionApiMapper;
    private final TaskTypeRegistry taskTypeRegistry;
    private final Mt101PayResolutionValidator payResolutionValidator;

    public ProcessCatalogService(
            ProcessDefinitionRepository processDefinitionRepository,
            ProcessTaskDefinitionRepository processTaskDefinitionRepository,
            SourceDefinitionRepository sourceDefinitionRepository,
            ReaderDefinitionRepository readerDefinitionRepository,
            ProcessDefinitionApiMapper processDefinitionApiMapper,
            TaskTypeRegistry taskTypeRegistry,
            Mt101PayResolutionValidator payResolutionValidator
    ) {
        this.processDefinitionRepository = processDefinitionRepository;
        this.processTaskDefinitionRepository = processTaskDefinitionRepository;
        this.sourceDefinitionRepository = sourceDefinitionRepository;
        this.readerDefinitionRepository = readerDefinitionRepository;
        this.processDefinitionApiMapper = processDefinitionApiMapper;
        this.taskTypeRegistry = taskTypeRegistry;
        this.payResolutionValidator = payResolutionValidator;
    }

    @Transactional
    public ProcessDefinitionResponse create(ProcessDefinitionRequest request) {
        // G2: solo un proceso RUNNABLE (active) exige el cableado money-path; un borrador (inactive) se guarda libre.
        if (request.active()) {
            payResolutionValidator.validate(toTaskViews(request.tasks()));
        }
        var definition = new ProcessDefinition();
        applyDefinition(definition, request);
        processDefinitionRepository.persist(definition);
        definition.tasks = replaceTasks(definition, request.tasks());
        return processDefinitionApiMapper.toResponse(definition);
    }

    @Transactional
    public ProcessDefinitionResponse update(Long processDefinitionId, ProcessDefinitionRequest request) {
        if (request.active()) {
            payResolutionValidator.validate(toTaskViews(request.tasks()));
        }
        var definition = processDefinitionRepository.findRequired(processDefinitionId);
        applyDefinition(definition, request);
        processTaskDefinitionRepository.deactivateByProcessDefinition(definition);
        definition.tasks = replaceTasks(definition, request.tasks());
        return processDefinitionApiMapper.toResponse(definition);
    }

    @Transactional
    public ProcessDefinitionResponse setActive(Long processDefinitionId, boolean active) {
        var definition = processDefinitionRepository.findRequired(processDefinitionId);
        // G2: activar es publicar; se valida el cableado money-path sobre las tareas activas persistidas.
        if (active) {
            payResolutionValidator.validate(toTaskViewsFromEntities(definition.tasks));
        }
        definition.active = active;
        if (!active) {
            definition.nextRunAt = null;
        } else if (definition.scheduled && definition.scheduleEvery != null && definition.nextRunAt == null) {
            definition.nextRunAt = LocalDateTime.now();
        }
        return processDefinitionApiMapper.toResponse(definition);
    }

    @Transactional
    public List<ProcessDefinitionResponse> listAll() {
        return processDefinitionRepository.listAllOrdered().stream()
                .map(processDefinitionApiMapper::toResponse)
                .toList();
    }

    private void applyDefinition(ProcessDefinition definition, ProcessDefinitionRequest request) {
        var wasScheduled = definition.scheduled;
        var previousScheduleEvery = definition.scheduleEvery;

        definition.name = request.name();
        definition.description = request.description();
        definition.active = request.active();
        definition.scheduled = request.scheduled();
        definition.scheduleEvery = blankToNull(request.scheduleEvery());
        definition.flowLayoutJson = blankToNull(request.flowLayoutJson());

        if (!definition.scheduled || definition.scheduleEvery == null || !definition.active) {
            definition.nextRunAt = null;
        } else if (!wasScheduled || !definition.scheduleEvery.equals(previousScheduleEvery) || definition.nextRunAt == null) {
            definition.nextRunAt = LocalDateTime.now();
        }
    }

    private List<ProcessTaskDefinition> replaceTasks(ProcessDefinition definition, List<ProcessTaskRequest> taskRequests) {
        var tasks = new ArrayList<ProcessTaskDefinition>();
        for (var taskRequest : taskRequests) {
            var requestedType = blankToNull(taskRequest.taskType());
            if (requestedType == null || !taskTypeRegistry.isRegistered(requestedType)) {
                throw new IllegalArgumentException("Unsupported taskType: " + taskRequest.taskType());
            }
            var task = new ProcessTaskDefinition();
            task.processDefinition = definition;
            task.taskOrder = taskRequest.taskOrder();
            task.taskType = requestedType;
            task.active = true;
            task.configurationJson = taskRequest.configurationJson();

            if (TaskType.FILE_READ.equalsIgnoreCase(requestedType)
                    && (taskRequest.sourceDefinitionId() == null || taskRequest.readerDefinitionId() == null)) {
                throw new IllegalArgumentException("FILE_READ task requires sourceDefinitionId and readerDefinitionId");
            }

            if (taskRequest.sourceDefinitionId() != null) {
                task.sourceDefinition = sourceDefinitionRepository.findRequired(taskRequest.sourceDefinitionId());
            }
            if (taskRequest.readerDefinitionId() != null) {
                task.readerDefinition = readerDefinitionRepository.findRequired(taskRequest.readerDefinitionId());
            }
            processTaskDefinitionRepository.persist(task);
            tasks.add(task);
        }
        return tasks;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    /** G2: vista de tareas desde el request (create/update). */
    private List<Mt101PayResolutionValidator.TaskView> toTaskViews(List<ProcessTaskRequest> requests) {
        if (requests == null) {
            return List.of();
        }
        return requests.stream()
                .map(r -> new Mt101PayResolutionValidator.TaskView(r.taskType(), r.taskOrder(), r.configurationJson()))
                .toList();
    }

    /** G2: vista de tareas ACTIVAS persistidas (setActive) — ignora las desactivadas por un update previo. */
    private List<Mt101PayResolutionValidator.TaskView> toTaskViewsFromEntities(List<ProcessTaskDefinition> tasks) {
        if (tasks == null) {
            return List.of();
        }
        return tasks.stream()
                .filter(t -> t.active)
                .map(t -> new Mt101PayResolutionValidator.TaskView(t.taskType, t.taskOrder, t.configurationJson))
                .toList();
    }
}
