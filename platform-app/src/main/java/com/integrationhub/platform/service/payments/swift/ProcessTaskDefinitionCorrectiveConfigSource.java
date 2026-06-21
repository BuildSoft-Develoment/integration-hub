package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.platform.repository.ProcessTaskDefinitionRepository;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.Map;

/**
 * B2': lee el config de VALIDATE/ARCHIVE/PAY desde {@code process_task_definition},
 * resolviendo la tarea hermana del mismo proceso que la tarea de build.
 */
@ApplicationScoped
public class ProcessTaskDefinitionCorrectiveConfigSource implements Mt101CorrectiveTaskConfigSource {

    private final ProcessTaskDefinitionRepository taskDefinitionRepository;
    private final JsonConfigurationMapper jsonConfigurationMapper;

    public ProcessTaskDefinitionCorrectiveConfigSource(ProcessTaskDefinitionRepository taskDefinitionRepository,
                                                       JsonConfigurationMapper jsonConfigurationMapper) {
        this.taskDefinitionRepository = taskDefinitionRepository;
        this.jsonConfigurationMapper = jsonConfigurationMapper;
    }

    @Override
    @Transactional
    public Map<String, Object> taskConfig(long buildTaskDefinitionId, String taskType) {
        var buildTask = taskDefinitionRepository.findRequired(buildTaskDefinitionId);
        var siblings = taskDefinitionRepository.listActiveByProcessAndType(buildTask.processDefinition, taskType);
        if (siblings.isEmpty()) {
            return null;
        }
        if (siblings.size() > 1) {
            throw new IllegalStateException("Process " + buildTask.processDefinition.id
                    + " has " + siblings.size() + " active " + taskType
                    + " tasks; corrective lifecycle requires an unambiguous task definition");
        }
        return jsonConfigurationMapper.toMap(siblings.get(0).configurationJson);
    }
}
