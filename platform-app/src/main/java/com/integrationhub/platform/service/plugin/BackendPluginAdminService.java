package com.integrationhub.platform.service.plugin;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.entity.PluginDescriptor;
import com.integrationhub.platform.repository.PluginDescriptorRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;

/**
 * Operaciones administrativas sobre el catalogo persistente de plugins backend.
 *
 * <p>Cubre instalacion declarativa, recarga, activacion y rollback sin acoplar la
 * API al storage interno.</p>
 */
@ApplicationScoped
public class BackendPluginAdminService {

    private final PluginDescriptorRepository repository;
    private final BackendPluginCatalogService catalogService;
    private final PluginDescriptorCatalogMapper mapper;
    private final PluginDescriptorTrustPolicy trustPolicy;
    private final ObjectMapper objectMapper;

    public BackendPluginAdminService(
            PluginDescriptorRepository repository,
            BackendPluginCatalogService catalogService,
            PluginDescriptorCatalogMapper mapper,
            PluginDescriptorTrustPolicy trustPolicy,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.catalogService = catalogService;
        this.mapper = mapper;
        this.trustPolicy = trustPolicy;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public int reload() {
        return catalogService.reloadInstalledPlugins();
    }

    @Transactional
    public PluginDescriptor install(PluginDescriptorInstallCommand command) {
        var candidate = toDescriptor(command);
        trustPolicy.validate(candidate);
        mapper.toRemoteDescriptor(candidate);

        var now = LocalDateTime.now();
        var descriptor = repository.findByIdOptional(candidate.id).orElseGet(() -> {
            var created = new PluginDescriptor();
            created.id = candidate.id;
            created.installedAt = now;
            repository.persist(created);
            return created;
        });
        descriptor.version = candidate.version;
        descriptor.spiVersion = candidate.spiVersion;
        descriptor.providedTypesJson = candidate.providedTypesJson;
        descriptor.transport = candidate.transport;
        descriptor.endpoint = candidate.endpoint;
        descriptor.trusted = candidate.trusted;
        descriptor.active = candidate.active;
        descriptor.integrity = candidate.integrity;
        descriptor.signature = candidate.signature;
        descriptor.updatedAt = now;
        catalogService.reloadInstalledPlugins();
        return descriptor;
    }

    @Transactional
    public boolean activate(String pluginId) {
        return setActive(pluginId, true);
    }

    @Transactional
    public boolean deactivate(String pluginId) {
        return setActive(pluginId, false);
    }

    private boolean setActive(String pluginId, boolean active) {
        if (pluginId == null || pluginId.isBlank()) {
            return false;
        }
        var descriptor = repository.findByIdOptional(pluginId.trim());
        if (descriptor.isEmpty()) {
            return false;
        }
        descriptor.get().active = active;
        descriptor.get().updatedAt = LocalDateTime.now();
        catalogService.reloadInstalledPlugins();
        return true;
    }

    private PluginDescriptor toDescriptor(PluginDescriptorInstallCommand command) {
        if (command == null) {
            throw new IllegalArgumentException("Plugin install command is required");
        }
        var descriptor = new PluginDescriptor();
        descriptor.id = trimToNull(command.id());
        descriptor.version = trimToNull(command.version());
        descriptor.spiVersion = trimToNull(command.spiVersion());
        descriptor.providedTypesJson = providedTypesJson(command);
        descriptor.transport = normalizeTransport(command.transport());
        descriptor.endpoint = trimToNull(command.endpoint());
        descriptor.trusted = command.trusted();
        descriptor.active = command.active();
        descriptor.integrity = trimToNull(command.integrity());
        descriptor.signature = trimToNull(command.signature());
        return descriptor;
    }

    private String providedTypesJson(PluginDescriptorInstallCommand command) {
        var normalized = new LinkedHashSet<String>();
        if (command.providedTypes() != null) {
            for (var type : command.providedTypes()) {
                if (type != null && !type.isBlank()) {
                    normalized.add(type.trim());
                }
            }
        }
        try {
            return objectMapper.writeValueAsString(normalized);
        } catch (JsonProcessingException error) {
            throw new IllegalArgumentException("Plugin provided types cannot be serialized", error);
        }
    }

    private static String normalizeTransport(String value) {
        var normalized = trimToNull(value);
        return normalized == null ? null : normalized.toUpperCase(java.util.Locale.ROOT);
    }

    private static String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
