package com.integrationhub.platform.repository;

import com.integrationhub.platform.entity.PluginDescriptorVersion;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class PluginDescriptorVersionRepository implements PanacheRepositoryBase<PluginDescriptorVersion, String> {

    public Optional<PluginDescriptorVersion> findVersion(String pluginId, String version) {
        if (pluginId == null || pluginId.isBlank() || version == null || version.isBlank()) {
            return Optional.empty();
        }
        return findByIdOptional(PluginDescriptorVersion.key(pluginId, version));
    }

    public List<PluginDescriptorVersion> listVersions() {
        return find("order by pluginId asc, version asc").list();
    }

    public List<PluginDescriptorVersion> listVersions(String pluginId) {
        if (pluginId == null || pluginId.isBlank()) {
            return List.of();
        }
        return find("pluginId = ?1 order by version asc", pluginId.trim()).list();
    }
}
