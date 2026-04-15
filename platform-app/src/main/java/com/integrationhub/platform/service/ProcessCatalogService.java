package com.integrationhub.platform.service;

import com.integrationhub.platform.api.ProcessDefinitionRequest;
import com.integrationhub.platform.api.ProcessTaskRequest;
import com.integrationhub.platform.api.dto.DefinitionRefView;
import com.integrationhub.platform.api.dto.ProcessDefinitionView;
import com.integrationhub.platform.api.dto.ProcessTaskDefinitionView;
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

@ApplicationScoped
public class ProcessCatalogService {

    private final ProcessDefinitionRepository processDefinitionRepository;
    private final ProcessTaskDefinitionRepository processTaskDefinitionRepository;
    private final SourceDefinitionRepository sourceDefinitionRepository;
    private final ReaderDefinitionRepository readerDefinitionRepository;

    public ProcessCatalogService(
            ProcessDefinitionRepository processDefinitionRepository,
            ProcessTaskDefinitionRepository processTaskDefinitionRepository,
            SourceDefinitionRepository sourceDefinitionRepository,
            ReaderDefinitionRepository readerDefinitionRepository
    ) {
        this.processDefinitionRepository = processDefinitionRepository;
        this.processTaskDefinitionRepository = processTaskDefinitionRepository;
        this.sourceDefinitionRepository = sourceDefinitionRepository;
        this.readerDefinitionRepository = readerDefinitionRepository;
    }

    @Transactional
    public ProcessDefinitionView create(ProcessDefinitionRequest request) {
        var definition = new ProcessDefinition();
        applyDefinition(definition, request);
        processDefinitionRepository.persist(definition);
        definition.tasks = replaceTasks(definition, request.tasks());
        return toView(definition);
    }

    @Transactional
    public ProcessDefinitionView update(Long processDefinitionId, ProcessDefinitionRequest request) {
        var definition = processDefinitionRepository.findRequired(processDefinitionId);
        applyDefinition(definition, request);
        processTaskDefinitionRepository.deactivateByProcessDefinition(definition);
        definition.tasks = replaceTasks(definition, request.tasks());
        return toView(definition);
    }

    @Transactional
    public ProcessDefinitionView setActive(Long processDefinitionId, boolean active) {
        var definition = processDefinitionRepository.findRequired(processDefinitionId);
        definition.active = active;
        if (!active) {
            definition.nextRunAt = null;
        } else if (definition.scheduled && definition.scheduleEvery != null && definition.nextRunAt == null) {
            definition.nextRunAt = LocalDateTime.now();
        }
        return toView(definition);
    }

    @Transactional
    public List<ProcessDefinitionView> listAll() {
        return processDefinitionRepository.listAllOrdered().stream()
                .map(this::toView)
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

            if (taskRequest.taskType() == TaskType.FILE_READ
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

    private ProcessDefinitionView toView(ProcessDefinition definition) {
        var tasks = definition.tasks == null
                ? List.<ProcessTaskDefinitionView>of()
                : definition.tasks.stream()
                .filter(task -> task.active)
                .sorted(java.util.Comparator.comparing(task -> task.taskOrder))
                .map(this::toTaskView)
                .toList();
        return new ProcessDefinitionView(
                definition.id,
                definition.name,
                definition.description,
                definition.active,
                definition.scheduled,
                definition.scheduleEvery,
                definition.nextRunAt,
                definition.lastRunAt,
                definition.flowLayoutJson,
                tasks
        );
    }

    private ProcessTaskDefinitionView toTaskView(ProcessTaskDefinition task) {
        return new ProcessTaskDefinitionView(
                task.id,
                task.taskOrder,
                task.taskType,
                task.active,
                task.configurationJson,
                task.sourceDefinition == null ? null : new DefinitionRefView(task.sourceDefinition.id, task.sourceDefinition.name),
                task.readerDefinition == null ? null : new DefinitionRefView(task.readerDefinition.id, task.readerDefinition.name)
        );
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}

