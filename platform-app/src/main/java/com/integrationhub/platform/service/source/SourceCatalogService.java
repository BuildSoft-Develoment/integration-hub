package com.integrationhub.platform.service.source;

// @trace RF-001, RF-002 (reingenieria: clase que implementa el/los RF en produccion)

import com.integrationhub.platform.api.response.source.SourceTestResponse;
import com.integrationhub.platform.entity.SourceDefinition;
import com.integrationhub.platform.repository.SourceDefinitionRepository;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class SourceCatalogService {

    private final SourceDefinitionRepository sourceDefinitionRepository;
    private final SourceProviderRegistry sourceProviderRegistry;
    private final JsonConfigurationMapper jsonConfigurationMapper;

    @Inject
    public SourceCatalogService(SourceDefinitionRepository sourceDefinitionRepository,
                                SourceProviderRegistry sourceProviderRegistry,
                                JsonConfigurationMapper jsonConfigurationMapper) {
        this.sourceDefinitionRepository = sourceDefinitionRepository;
        this.sourceProviderRegistry = sourceProviderRegistry;
        this.jsonConfigurationMapper = jsonConfigurationMapper;
    }

    @Transactional
    public SourceDefinition create(String name, String sourceType, boolean active, String configurationJson) {
        var definition = new SourceDefinition();
        apply(definition, name, sourceType, active, configurationJson);
        sourceDefinitionRepository.persist(definition);
        return definition;
    }

    @Transactional
    public SourceDefinition update(Long sourceDefinitionId, String name, String sourceType, boolean active, String configurationJson) {
        var definition = sourceDefinitionRepository.findRequired(sourceDefinitionId);
        apply(definition, name, sourceType, active, configurationJson);
        return definition;
    }

    @Transactional
    public SourceDefinition setActive(Long sourceDefinitionId, boolean active) {
        var definition = sourceDefinitionRepository.findRequired(sourceDefinitionId);
        definition.active = active;
        return definition;
    }

    public List<SourceDefinition> listAll() {
        return sourceDefinitionRepository.listAllOrdered();
    }

    public SourceTestResponse test(String name, String sourceType, String configurationJson) {
        var normalizedType = requireType(sourceType, "Source type is required");
        var configuration = jsonConfigurationMapper.toMap(configurationJson);
        sourceProviderRegistry.resolve(normalizedType).selectFiles(configuration);
        return new SourceTestResponse(true, "Source configuration validated successfully");
    }

    private void apply(SourceDefinition definition, String name, String sourceType, boolean active, String configurationJson) {
        definition.name = name;
        definition.sourceType = requireType(sourceType, "Source type is required");
        definition.active = active;
        definition.configurationJson = configurationJson;
    }

    private static String requireType(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim().toUpperCase(java.util.Locale.ROOT);
    }
}
