package com.integrationhub.platform.service.plugin;

import com.integrationhub.platform.entity.PluginDescriptor;
import com.integrationhub.platform.repository.PluginDescriptorRepository;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.util.ArrayList;
import java.util.LinkedHashMap;

@ApplicationScoped
public class BackendPluginCatalogService {

    private static final Logger LOG = Logger.getLogger(BackendPluginCatalogService.class);

    private final PluginDescriptorRepository repository;
    private final PluginDescriptorCatalogMapper mapper;
    private final PluginDescriptorTrustPolicy trustPolicy;
    private final RemotePluginRegistry registry;

    public BackendPluginCatalogService(PluginDescriptorRepository repository,
                                       PluginDescriptorCatalogMapper mapper,
                                       PluginDescriptorTrustPolicy trustPolicy,
                                       RemotePluginRegistry registry) {
        this.repository = repository;
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
        try {
            registry.replaceDescriptors(descriptors);
        } catch (IllegalArgumentException error) {
            registry.markDegraded("catalog", error.getMessage());
            LOG.warnf(error, "Backend plugin catalog ignored because it is inconsistent");
            return 0;
        }
        degraded.forEach(registry::markDegraded);
        LOG.infof("Backend plugin descriptors loaded: %d", descriptors.size());
        return descriptors.size();
    }

    private static String degradedId(PluginDescriptor descriptor) {
        if (descriptor == null || descriptor.id == null || descriptor.id.isBlank()) {
            return "unknown";
        }
        return descriptor.id;
    }
}
