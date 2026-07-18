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
        // 003: no dejamos que la excepcion del provider (mensaje tecnico en ingles) escape como HTTP 500.
        // La atrapamos, la clasificamos en un codigo estable y el frontend muestra un texto localizado.
        try {
            sourceProviderRegistry.resolve(normalizedType).selectFiles(configuration);
            return new SourceTestResponse(true, "Source configuration validated successfully", "OK");
        } catch (RuntimeException e) {
            return new SourceTestResponse(false, e.getMessage(), classifyTestFailure(e));
        }
    }

    /** 003: clasifica el fallo de "Probar fuente" en un codigo estable que el frontend traduce. */
    private static String classifyTestFailure(Throwable error) {
        for (Throwable cause = error; cause != null; cause = cause.getCause()) {
            if (cause instanceof java.nio.file.NoSuchFileException) {
                return "PATH_NOT_FOUND";
            }
            if (cause instanceof java.net.UnknownHostException || cause instanceof java.net.ConnectException) {
                return "CONNECTION_FAILED";
            }
            String message = cause.getMessage() == null ? "" : cause.getMessage().toLowerCase(java.util.Locale.ROOT);
            if (message.contains("does not exist") || message.contains("no such file")
                    || message.contains("not found") || message.contains("must be a directory")) {
                return "PATH_NOT_FOUND";
            }
            if (message.contains("no files match") || message.contains("expected exactly one")
                    || message.contains("match selector")) {
                return "NO_MATCH";
            }
            if (message.contains("auth") || message.contains("password") || message.contains("credential")) {
                return "AUTH_FAILED";
            }
            if (message.contains("connect") || message.contains("timed out") || message.contains("timeout")
                    || message.contains("unreachable")) {
                return "CONNECTION_FAILED";
            }
        }
        return "GENERIC";
    }

    private void apply(SourceDefinition definition, String name, String sourceType, boolean active, String configurationJson) {
        definition.name = requireName(name);
        definition.sourceType = requireType(sourceType, "Source type is required");
        definition.active = active;
        definition.configurationJson = configurationJson;
    }

    private static String requireName(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Source name is required");
        }
        return value.trim();
    }

    private static String requireType(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim().toUpperCase(java.util.Locale.ROOT);
    }
}
