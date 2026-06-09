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

    public ProcessCatalogService(
            ProcessDefinitionRepository processDefinitionRepository,
            ProcessTaskDefinitionRepository processTaskDefinitionRepository,
            SourceDefinitionRepository sourceDefinitionRepository,
            ReaderDefinitionRepository readerDefinitionRepository,
            ProcessDefinitionApiMapper processDefinitionApiMapper
    ) {
        this.processDefinitionRepository = processDefinitionRepository;
        this.processTaskDefinitionRepository = processTaskDefinitionRepository;
        this.sourceDefinitionRepository = sourceDefinitionRepository;
        this.readerDefinitionRepository = readerDefinitionRepository;
        this.processDefinitionApiMapper = processDefinitionApiMapper;
    }

    @Transactional
    public ProcessDefinitionResponse create(ProcessDefinitionRequest request) {
        var definition = new ProcessDefinition();
        applyDefinition(definition, request);
        processDefinitionRepository.persist(definition);
        definition.tasks = replaceTasks(definition, request.tasks());
        return processDefinitionApiMapper.toResponse(definition);
    }

    @Transactional
    public ProcessDefinitionResponse update(Long processDefinitionId, ProcessDefinitionRequest request) {
        var definition = processDefinitionRepository.findRequired(processDefinitionId);
        applyDefinition(definition, request);
        processTaskDefinitionRepository.deactivateByProcessDefinition(definition);
        definition.tasks = replaceTasks(definition, request.tasks());
        return processDefinitionApiMapper.toResponse(definition);
    }

    @Transactional
    public ProcessDefinitionResponse setActive(Long processDefinitionId, boolean active) {
        var definition = processDefinitionRepository.findRequired(processDefinitionId);
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
            var task = new ProcessTaskDefinition();
            task.processDefinition = definition;
            task.taskOrder = taskRequest.taskOrder();
            task.taskType = taskRequest.taskType();
            task.active = true;
            task.configurationJson = taskRequest.configurationJson();

            if (TaskType.FILE_READ.equals(taskRequest.taskType())
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
}

