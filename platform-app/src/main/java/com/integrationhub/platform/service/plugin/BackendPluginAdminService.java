package com.integrationhub.platform.service.plugin;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.entity.PluginDescriptor;
import com.integrationhub.platform.entity.PluginDescriptorVersion;
import com.integrationhub.platform.repository.PluginDescriptorRepository;
import com.integrationhub.platform.repository.PluginDescriptorVersionRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
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
    private final PluginDescriptorVersionRepository versionRepository;
    private final BackendPluginCatalogService catalogService;
    private final PluginDescriptorCatalogMapper mapper;
    private final PluginDescriptorTrustPolicy trustPolicy;
    private final ObjectMapper objectMapper;
    private final PluginMarketplaceCatalogClient marketplaceCatalogClient;
    private final PluginPromotionGate promotionGate;

    @Inject
    public BackendPluginAdminService(
            PluginDescriptorRepository repository,
            PluginDescriptorVersionRepository versionRepository,
            BackendPluginCatalogService catalogService,
            PluginDescriptorCatalogMapper mapper,
            PluginDescriptorTrustPolicy trustPolicy,
            ObjectMapper objectMapper,
            PluginMarketplaceCatalogClient marketplaceCatalogClient,
            PluginPromotionGate promotionGate) {
        this.repository = repository;
        this.versionRepository = versionRepository;
        this.catalogService = catalogService;
        this.mapper = mapper;
        this.trustPolicy = trustPolicy;
        this.objectMapper = objectMapper;
        this.marketplaceCatalogClient = marketplaceCatalogClient;
        this.promotionGate = promotionGate;
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
        ensurePromotableWhenActive(candidate);

        var now = LocalDateTime.now();
        persistVersion(candidate, now);
        if (!candidate.active && repository.findByIdOptional(candidate.id).isPresent()) {
            catalogService.reloadInstalledPlugins();
            return repository.findById(candidate.id);
        }
        if (!candidate.active && repository.findByIdOptional(candidate.id).isEmpty()) {
            var descriptor = projectDescriptor(candidate, now);
            catalogService.reloadInstalledPlugins();
            return descriptor;
        }
        var descriptor = projectDescriptor(candidate, now);
        catalogService.reloadInstalledPlugins();
        return descriptor;
    }

    private PluginDescriptor projectDescriptor(PluginDescriptor candidate, LocalDateTime now) {
        var existing = repository.findByIdOptional(candidate.id);
        var descriptor = existing.orElseGet(PluginDescriptor::new);
        descriptor.id = candidate.id;
        if (descriptor.installedAt == null) {
            descriptor.installedAt = now;
        }
        descriptor.version = candidate.version;
        descriptor.spiVersion = candidate.spiVersion;
        descriptor.providedTypesJson = candidate.providedTypesJson;
        descriptor.providedSourceTypesJson = candidate.providedSourceTypesJson;
        descriptor.providedReaderTypesJson = candidate.providedReaderTypesJson;
        descriptor.transport = candidate.transport;
        descriptor.endpoint = candidate.endpoint;
        descriptor.trusted = candidate.trusted;
        descriptor.active = candidate.active;
        descriptor.integrity = candidate.integrity;
        descriptor.signature = candidate.signature;
        descriptor.marketplaceUrl = candidate.marketplaceUrl;
        descriptor.channel = candidate.channel;
        descriptor.pinnedVersion = candidate.pinnedVersion;
        descriptor.pinned = candidate.pinned;
        descriptor.updatedAt = now;
        if (existing.isEmpty()) {
            repository.persist(descriptor);
        }
        return descriptor;
    }

    @Transactional
    public PluginDescriptor installFromMarketplace(PluginMarketplaceInstallCommand command) {
        return install(resolveMarketplaceInstallCommand(command));
    }

    public RemotePluginDescriptor previewFromMarketplace(PluginMarketplaceInstallCommand command) {
        var candidate = toDescriptor(resolveMarketplaceInstallCommand(command));
        trustPolicy.validate(candidate);
        return mapper.toRemoteDescriptor(candidate);
    }

    private PluginDescriptorInstallCommand resolveMarketplaceInstallCommand(PluginMarketplaceInstallCommand command) {
        if (command == null) {
            throw new IllegalArgumentException("Plugin marketplace install command is required");
        }
        var catalogUrl = trimToNull(command.catalogUrl());
        if (catalogUrl == null) {
            throw new IllegalArgumentException("Plugin marketplace catalogUrl is required");
        }
        var catalog = marketplaceCatalogClient.fetch(catalogUrl);
        var entry = catalog.select(command);
        return entry.toInstallCommand(command, catalogUrl);
    }

    @Transactional
    public boolean activate(String pluginId) {
        return setActive(pluginId, true);
    }

    @Transactional
    public boolean activateVersion(String pluginId, String version) {
        if (versionRepository == null) {
            return false;
        }
        var installed = versionRepository.findVersion(pluginId, version);
        if (installed.isEmpty()) {
            return false;
        }
        var candidate = toDescriptor(installed.get());
        candidate.active = true;
        trustPolicy.validate(candidate);
        mapper.toRemoteDescriptor(candidate);
        promotionGate.assertPromotable(candidate.id, candidate.version);
        projectDescriptor(candidate, LocalDateTime.now());
        catalogService.reloadInstalledPlugins();
        return true;
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
        if (active) {
            promotionGate.assertPromotable(descriptor.get().id, descriptor.get().version);
        }
        descriptor.get().active = active;
        descriptor.get().updatedAt = LocalDateTime.now();
        catalogService.reloadInstalledPlugins();
        return true;
    }

    private void ensurePromotableWhenActive(PluginDescriptor candidate) {
        if (candidate.active) {
            promotionGate.assertPromotable(candidate.id, candidate.version);
        }
    }

    public java.util.List<PluginDescriptorVersion> listVersions() {
        return versionRepository == null ? java.util.List.of() : versionRepository.listVersions();
    }

    private PluginDescriptor toDescriptor(PluginDescriptorInstallCommand command) {
        if (command == null) {
            throw new IllegalArgumentException("Plugin install command is required");
        }
        var descriptor = new PluginDescriptor();
        descriptor.id = trimToNull(command.id());
        descriptor.version = trimToNull(command.version());
        descriptor.spiVersion = trimToNull(command.spiVersion());
        descriptor.providedTypesJson = providedTypesJson(command.providedTypes(), "task");
        descriptor.providedSourceTypesJson = providedTypesJson(command.providedSourceTypes(), "source");
        descriptor.providedReaderTypesJson = providedTypesJson(command.providedReaderTypes(), "reader");
        descriptor.transport = normalizeTransport(command.transport());
        descriptor.endpoint = trimToNull(command.endpoint());
        descriptor.trusted = command.trusted();
        descriptor.active = command.active();
        descriptor.integrity = trimToNull(command.integrity());
        descriptor.signature = trimToNull(command.signature());
        descriptor.marketplaceUrl = trimToNull(command.marketplaceUrl());
        descriptor.channel = trimToNull(command.channel());
        descriptor.pinnedVersion = trimToNull(command.pinnedVersion());
        descriptor.pinned = command.pinned();
        return descriptor;
    }

    private PluginDescriptor toDescriptor(PluginDescriptorVersion version) {
        var descriptor = new PluginDescriptor();
        descriptor.id = version.pluginId;
        descriptor.version = version.version;
        descriptor.spiVersion = version.spiVersion;
        descriptor.providedTypesJson = version.providedTypesJson;
        descriptor.providedSourceTypesJson = version.providedSourceTypesJson;
        descriptor.providedReaderTypesJson = version.providedReaderTypesJson;
        descriptor.transport = version.transport;
        descriptor.endpoint = version.endpoint;
        descriptor.trusted = version.trusted;
        descriptor.active = false;
        descriptor.integrity = version.integrity;
        descriptor.signature = version.signature;
        descriptor.marketplaceUrl = version.marketplaceUrl;
        descriptor.channel = version.channel;
        descriptor.pinnedVersion = version.pinnedVersion;
        descriptor.pinned = version.pinned;
        descriptor.installedAt = version.installedAt;
        descriptor.updatedAt = version.updatedAt;
        return descriptor;
    }

    private void persistVersion(PluginDescriptor descriptor, LocalDateTime now) {
        if (versionRepository == null) {
            return;
        }
        var key = PluginDescriptorVersion.key(descriptor.id, descriptor.version);
        var existing = versionRepository.findByIdOptional(key);
        var version = existing.orElseGet(PluginDescriptorVersion::new);
        version.descriptorKey = key;
        version.pluginId = descriptor.id;
        version.version = descriptor.version;
        if (version.installedAt == null) {
            version.installedAt = now;
        }
        version.spiVersion = descriptor.spiVersion;
        version.providedTypesJson = descriptor.providedTypesJson;
        version.providedSourceTypesJson = descriptor.providedSourceTypesJson;
        version.providedReaderTypesJson = descriptor.providedReaderTypesJson;
        version.transport = descriptor.transport;
        version.endpoint = descriptor.endpoint;
        version.trusted = descriptor.trusted;
        version.integrity = descriptor.integrity;
        version.signature = descriptor.signature;
        version.marketplaceUrl = descriptor.marketplaceUrl;
        version.channel = descriptor.channel;
        version.pinnedVersion = descriptor.pinnedVersion;
        version.pinned = descriptor.pinned;
        version.updatedAt = now;
        if (existing.isEmpty()) {
            versionRepository.persist(version);
        }
    }

    private String providedTypesJson(java.util.Set<String> providedTypes, String capabilityName) {
        var normalized = new LinkedHashSet<String>();
        if (providedTypes != null) {
            for (var type : providedTypes) {
                if (type != null && !type.isBlank()) {
                    normalized.add(type.trim());
                }
            }
        }
        try {
            return objectMapper.writeValueAsString(normalized);
        } catch (JsonProcessingException error) {
            throw new IllegalArgumentException("Plugin " + capabilityName + " types cannot be serialized", error);
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
