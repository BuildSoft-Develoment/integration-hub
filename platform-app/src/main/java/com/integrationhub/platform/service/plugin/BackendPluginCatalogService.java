package com.integrationhub.platform.service.plugin;

import com.integrationhub.platform.entity.PluginDescriptor;
import com.integrationhub.platform.entity.PluginDescriptorVersion;
import com.integrationhub.platform.repository.PluginDescriptorRepository;
import com.integrationhub.platform.repository.PluginDescriptorVersionRepository;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Locale;

@ApplicationScoped
public class BackendPluginCatalogService {

    private static final Logger LOG = Logger.getLogger(BackendPluginCatalogService.class);

    private final PluginDescriptorRepository repository;
    private final PluginDescriptorVersionRepository versionRepository;
    private final PluginDescriptorCatalogMapper mapper;
    private final PluginDescriptorTrustPolicy trustPolicy;
    private final RemotePluginRegistry registry;

    public BackendPluginCatalogService(PluginDescriptorRepository repository,
                                       PluginDescriptorVersionRepository versionRepository,
                                       PluginDescriptorCatalogMapper mapper,
                                       PluginDescriptorTrustPolicy trustPolicy,
                                       RemotePluginRegistry registry) {
        this.repository = repository;
        this.versionRepository = versionRepository;
        this.mapper = mapper;
        this.trustPolicy = trustPolicy;
        this.registry = registry;
    }

    @Transactional
    void loadCatalogAtStartup(@Observes StartupEvent ignored) {
        reloadInstalledPlugins();
    }

    @Transactional
    public int reloadInstalledPlugins() {
        var descriptors = new ArrayList<RemotePluginDescriptor>();
        var degraded = new LinkedHashMap<String, String>();
        for (var persisted : repository.listActive()) {
            try {
                trustPolicy.validate(persisted);
                descriptors.add(mapper.toRemoteDescriptor(persisted));
            } catch (IllegalArgumentException error) {
                var pluginId = degradedId(persisted);
                degraded.put(pluginId, error.getMessage());
                LOG.warnf(error, "Backend plugin descriptor %s ignored", pluginId);
            }
        }
        var canaries = canaryCandidates();
        try {
            registry.replaceDescriptors(descriptors, canaries);
        } catch (IllegalArgumentException error) {
            registry.markDegraded("catalog", error.getMessage());
            LOG.warnf(error, "Backend plugin catalog ignored because it is inconsistent");
            return 0;
        }
        degraded.forEach(registry::markDegraded);
        LOG.infof("Backend plugin descriptors loaded: %d (canary candidates: %d)",
                descriptors.size(), canaries.size());
        return descriptors.size();
    }

    /** Canary versions (channel 'canary' with a positive rollout weight) as split candidates. */
    private java.util.List<RemotePluginRegistry.CanaryCandidate> canaryCandidates() {
        var candidates = new ArrayList<RemotePluginRegistry.CanaryCandidate>();
        if (versionRepository == null) {
            return candidates;
        }
        for (var version : versionRepository.listVersions()) {
            if (!isCanaryRollout(version)) {
                continue;
            }
            try {
                var descriptor = mapper.toRemoteDescriptor(version);
                candidates.add(new RemotePluginRegistry.CanaryCandidate(descriptor, version.canaryWeight));
            } catch (IllegalArgumentException error) {
                LOG.warnf(error, "Canary version %s@%s ignored", version.pluginId, version.version);
            }
        }
        return candidates;
    }

    private static boolean isCanaryRollout(PluginDescriptorVersion version) {
        return version != null
                && version.channel != null
                && version.channel.toLowerCase(Locale.ROOT).contains("canary")
                && version.canaryWeight != null
                && version.canaryWeight > 0;
    }

    private static String degradedId(PluginDescriptor descriptor) {
        if (descriptor == null || descriptor.id == null || descriptor.id.isBlank()) {
            return "unknown";
        }
        return descriptor.id;
    }
}
