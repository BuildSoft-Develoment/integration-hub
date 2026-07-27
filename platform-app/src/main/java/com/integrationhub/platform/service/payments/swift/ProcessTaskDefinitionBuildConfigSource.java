package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.vertical.swift.mt101.service.Mt101BuildConfigSource;

import com.integrationhub.platform.repository.ProcessTaskDefinitionRepository;
import com.integrationhub.platform.spi.engine.ConfigurationMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.Map;

/** Lee el config del build desde {@code process_task_definition.configuration_json}. */
@ApplicationScoped
public class ProcessTaskDefinitionBuildConfigSource implements Mt101BuildConfigSource {

    private final ProcessTaskDefinitionRepository taskDefinitionRepository;
    private final ConfigurationMapper jsonConfigurationMapper;

    public ProcessTaskDefinitionBuildConfigSource(ProcessTaskDefinitionRepository taskDefinitionRepository,
                                                  ConfigurationMapper jsonConfigurationMapper) {
        this.taskDefinitionRepository = taskDefinitionRepository;
        this.jsonConfigurationMapper = jsonConfigurationMapper;
    }

    @Override
    @Transactional
    public Map<String, Object> buildConfig(long taskDefinitionId) {
        var definition = taskDefinitionRepository.findRequired(taskDefinitionId);
        return jsonConfigurationMapper.toMap(definition.configurationJson);
    }
}
