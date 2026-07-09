package com.integrationhub.platform.service.reader;

// @trace RF-002 (reingenieria: clase que implementa el/los RF en produccion)

import com.integrationhub.platform.entity.ReaderDefinition;
import com.integrationhub.platform.repository.ReaderDefinitionRepository;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class ReaderCatalogService {

    private final ReaderDefinitionRepository readerDefinitionRepository;
    private final ReaderProviderRegistry readerProviderRegistry;
    private final JsonConfigurationMapper jsonConfigurationMapper;

    public ReaderCatalogService(ReaderDefinitionRepository readerDefinitionRepository,
                                ReaderProviderRegistry readerProviderRegistry,
                                JsonConfigurationMapper jsonConfigurationMapper) {
        this.readerDefinitionRepository = readerDefinitionRepository;
        this.readerProviderRegistry = readerProviderRegistry;
        this.jsonConfigurationMapper = jsonConfigurationMapper;
    }

    @Transactional
    public ReaderDefinition create(String name, String readerType, boolean active, String configurationJson) {
        var definition = new ReaderDefinition();
        apply(definition, name, readerType, active, configurationJson);
        readerDefinitionRepository.persist(definition);
        return definition;
    }

    @Transactional
    public ReaderDefinition update(Long readerDefinitionId, String name, String readerType, boolean active, String configurationJson) {
        var definition = readerDefinitionRepository.findRequired(readerDefinitionId);
        apply(definition, name, readerType, active, configurationJson);
        return definition;
    }

    @Transactional
    public ReaderDefinition setActive(Long readerDefinitionId, boolean active) {
        var definition = readerDefinitionRepository.findRequired(readerDefinitionId);
        definition.active = active;
        return definition;
    }

    public List<ReaderDefinition> listAll() {
        return readerDefinitionRepository.listAllOrdered();
    }

    private void apply(ReaderDefinition definition, String name, String readerType, boolean active, String configurationJson) {
        definition.name = name;
        definition.readerType = requireType(readerType, "Reader type is required");
        definition.active = active;
        definition.configurationJson = configurationJson;
        // #5: valida la config del reader al CREAR/ACTUALIZAR (falla claro en la consola, no diferido a runtime). El
        // tipo debe existir (resolve falla-fast en tipos no soportados) y cada provider valida solo lo suyo (SRP). Se
        // parsea SIN resolver secretos: aquí solo importa la estructura (p.ej. 'fields'), no los valores de secreto.
        readerProviderRegistry.resolve(definition.readerType)
                .validateConfiguration(jsonConfigurationMapper.toMapUnresolved(configurationJson));
    }

    private static String requireType(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim().toUpperCase(java.util.Locale.ROOT);
    }
}
