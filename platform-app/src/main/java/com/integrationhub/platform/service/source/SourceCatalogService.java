package com.integrationhub.platform.service.source;

// @trace spec 001-catalogo-fuentes RF-001, RF-002 (reingenieria: clase que implementa el/los RF en produccion)

import com.integrationhub.platform.api.response.source.SourceTestResponse;
import com.integrationhub.platform.entity.SourceDefinition;
import com.integrationhub.platform.repository.SourceDefinitionRepository;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.Map;

@ApplicationScoped
public class SourceCatalogService {

    private final SourceDefinitionRepository sourceDefinitionRepository;
    private final SourceProviderRegistry sourceProviderRegistry;
    private final JsonConfigurationMapper jsonConfigurationMapper;
    private final SourceCredentialPolicy credentialPolicy;

    @Inject
    public SourceCatalogService(SourceDefinitionRepository sourceDefinitionRepository,
                                SourceProviderRegistry sourceProviderRegistry,
                                JsonConfigurationMapper jsonConfigurationMapper,
                                SourceCredentialPolicy credentialPolicy) {
        this.sourceDefinitionRepository = sourceDefinitionRepository;
        this.sourceProviderRegistry = sourceProviderRegistry;
        this.jsonConfigurationMapper = jsonConfigurationMapper;
        this.credentialPolicy = credentialPolicy;
    }

    /**
     * La politica se DERIVA del registry, que es de donde saca los campos de credencial de cada tipo.
     * No es un colaborador opcional ni admite null: sin ella no habria control de QA-006, y un
     * constructor que lo permitiera dejaria abierta la puerta a construir el servicio sin proteccion.
     */
    public SourceCatalogService(SourceDefinitionRepository sourceDefinitionRepository,
                                SourceProviderRegistry sourceProviderRegistry,
                                JsonConfigurationMapper jsonConfigurationMapper) {
        this(sourceDefinitionRepository, sourceProviderRegistry, jsonConfigurationMapper,
                new SourceCredentialPolicy(sourceProviderRegistry));
    }

    @Transactional
    public SourceDefinition create(String name, String sourceType, boolean active, String configurationJson, String direction, boolean moneyCritical) {
        var definition = new SourceDefinition();
        apply(definition, name, sourceType, active, configurationJson, direction, moneyCritical);
        sourceDefinitionRepository.persist(definition);
        return definition;
    }

    @Transactional
    public SourceDefinition update(Long sourceDefinitionId, String name, String sourceType, boolean active, String configurationJson, String direction, boolean moneyCritical) {
        var definition = sourceDefinitionRepository.findRequired(sourceDefinitionId);
        apply(definition, name, sourceType, active, configurationJson, direction, moneyCritical);
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

    private void apply(SourceDefinition definition, String name, String sourceType, boolean active, String configurationJson, String direction, boolean moneyCritical) {
        definition.name = requireName(name);
        definition.sourceType = requireType(sourceType, "Source type is required");
        definition.active = active;
        requireCredentialsAsReferences(definition.sourceType, configurationJson);
        definition.configurationJson = configurationJson;
        definition.direction = normalizeDirection(direction);
        // ADR-021 (E): marcar como banco una fuente de LECTURA no significa nada —nadie entrega ahi— y
        // dejaria una marca que sugiere una proteccion inexistente. Se normaliza a false en vez de
        // rechazar: es una combinacion sin sentido, no un intento de hacer algo peligroso.
        definition.moneyCritical = moneyCritical && !"INPUT".equals(definition.direction);
    }

    /**
     * QA-006: ninguna credencial se persiste en claro. Rechaza (400), no avisa.
     *
     * <p>Hasta ahora esto solo lo comprobaba el formulario de Angular, asi que un POST directo a la
     * API guardaba el secreto igual. Se valida aqui porque este es el unico punto por el que pasa
     * TODO lo que se persiste, venga de donde venga.</p>
     *
     * <p>Se parsea con {@code toMapUnresolved}: {@code toMap} sustituiria los {@code ${secret:...}}
     * por su valor real y entonces TODA credencial pareceria texto plano -el control rechazaria
     * justo las configuraciones correctas-.</p>
     */
    private void requireCredentialsAsReferences(String sourceType, String configurationJson) {
        if (configurationJson == null || configurationJson.isBlank()) {
            return;
        }
        Map<String, Object> configuration;
        try {
            configuration = jsonConfigurationMapper.toMapUnresolved(configurationJson);
        } catch (IllegalArgumentException e) {
            // Fail-closed: si no se puede leer, no se puede afirmar que no haya secretos dentro.
            throw new IllegalArgumentException("Source configuration is not valid JSON", e);
        }
        var enClaro = credentialPolicy.plaintextCredentials(sourceType, configuration);
        if (!enClaro.isEmpty()) {
            throw new IllegalArgumentException(
                    "QA-006: credentials must be stored as ${secret:...} references, never in plain text. "
                            + "Plain-text credential field(s) in " + sourceType + ": " + String.join(", ", enClaro));
        }
    }

    /** ADR-016: INPUT (default) / OUTPUT / BOTH. null/blank/desconocido -> INPUT (compat + fail-safe). */
    private static String normalizeDirection(String direction) {
        if (direction == null) {
            return "INPUT";
        }
        var normalized = direction.trim().toUpperCase(java.util.Locale.ROOT);
        return switch (normalized) {
            case "OUTPUT", "BOTH" -> normalized;
            default -> "INPUT";
        };
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
