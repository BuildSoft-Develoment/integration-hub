package com.integrationhub.platform.service.plugin;

import com.integrationhub.platform.repository.PluginDescriptorRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;

/**
 * Operaciones administrativas sobre el catalogo persistente de plugins backend.
 *
 * <p>El flujo de instalacion completo queda pendiente; esta base cubre recarga y
 * rollback declarativo sin acoplar la API al storage interno.</p>
 */
@ApplicationScoped
public class BackendPluginAdminService {

    private final PluginDescriptorRepository repository;
    private final BackendPluginCatalogService catalogService;

    public BackendPluginAdminService(
            PluginDescriptorRepository repository,
            BackendPluginCatalogService catalogService) {
        this.repository = repository;
        this.catalogService = catalogService;
    }

    @Transactional
    public int reload() {
        return catalogService.reloadInstalledPlugins();
    }

    @Transactional
    public boolean deactivate(String pluginId) {
        if (pluginId == null || pluginId.isBlank()) {
            return false;
        }
        var descriptor = repository.findByIdOptional(pluginId.trim());
        if (descriptor.isEmpty()) {
            return false;
        }
        descriptor.get().active = false;
        descriptor.get().updatedAt = LocalDateTime.now();
        catalogService.reloadInstalledPlugins();
        return true;
    }
}
