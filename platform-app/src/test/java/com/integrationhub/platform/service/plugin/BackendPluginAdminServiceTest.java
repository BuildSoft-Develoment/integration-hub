package com.integrationhub.platform.service.plugin;

import com.integrationhub.platform.entity.PluginDescriptor;
import com.integrationhub.platform.repository.PluginDescriptorRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BackendPluginAdminServiceTest {

    @Test
    void reloadDelegatesToCatalogService() {
        var repository = mock(PluginDescriptorRepository.class);
        var catalog = mock(BackendPluginCatalogService.class);
        var service = new BackendPluginAdminService(repository, catalog);

        service.reload();

        verify(catalog).reloadInstalledPlugins();
    }

    @Test
    void deactivateMarksDescriptorInactiveAndReloadsCatalog() {
        var repository = mock(PluginDescriptorRepository.class);
        var catalog = mock(BackendPluginCatalogService.class);
        var descriptor = new PluginDescriptor();
        descriptor.id = "acme";
        descriptor.active = true;
        var service = new BackendPluginAdminService(repository, catalog);
        when(repository.findByIdOptional("acme")).thenReturn(Optional.of(descriptor));

        var deactivated = service.deactivate("acme");

        assertTrue(deactivated);
        assertFalse(descriptor.active);
        assertNotNull(descriptor.updatedAt);
        verify(catalog).reloadInstalledPlugins();
    }

    @Test
    void deactivateDoesNotReloadWhenDescriptorDoesNotExist() {
        var repository = mock(PluginDescriptorRepository.class);
        var catalog = mock(BackendPluginCatalogService.class);
        var service = new BackendPluginAdminService(repository, catalog);
        when(repository.findByIdOptional("missing")).thenReturn(Optional.empty());

        var deactivated = service.deactivate("missing");

        assertFalse(deactivated);
        verify(catalog, never()).reloadInstalledPlugins();
    }
}
