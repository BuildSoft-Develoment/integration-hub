package com.integrationhub.platform.service.plugin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.entity.PluginDescriptor;
import com.integrationhub.platform.repository.PluginDescriptorRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BackendPluginAdminServiceTest {

    @Test
    void reloadDelegatesToCatalogService() {
        var repository = mock(PluginDescriptorRepository.class);
        var catalog = mock(BackendPluginCatalogService.class);
        var service = service(repository, catalog);

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
        var service = service(repository, catalog);
        when(repository.findByIdOptional("acme")).thenReturn(Optional.of(descriptor));

        var deactivated = service.deactivate("acme");

        assertTrue(deactivated);
        assertFalse(descriptor.active);
        assertNotNull(descriptor.updatedAt);
        verify(catalog).reloadInstalledPlugins();
    }

    @Test
    void activateMarksDescriptorActiveAndReloadsCatalog() {
        var repository = mock(PluginDescriptorRepository.class);
        var catalog = mock(BackendPluginCatalogService.class);
        var descriptor = new PluginDescriptor();
        descriptor.id = "acme";
        descriptor.active = false;
        var service = service(repository, catalog);
        when(repository.findByIdOptional("acme")).thenReturn(Optional.of(descriptor));

        var activated = service.activate("acme");

        assertTrue(activated);
        assertTrue(descriptor.active);
        assertNotNull(descriptor.updatedAt);
        verify(catalog).reloadInstalledPlugins();
    }

    @Test
    void deactivateDoesNotReloadWhenDescriptorDoesNotExist() {
        var repository = mock(PluginDescriptorRepository.class);
        var catalog = mock(BackendPluginCatalogService.class);
        var service = service(repository, catalog);
        when(repository.findByIdOptional("missing")).thenReturn(Optional.empty());

        var deactivated = service.deactivate("missing");

        assertFalse(deactivated);
        verify(catalog, never()).reloadInstalledPlugins();
    }

    @Test
    void activateDoesNotReloadWhenDescriptorDoesNotExist() {
        var repository = mock(PluginDescriptorRepository.class);
        var catalog = mock(BackendPluginCatalogService.class);
        var service = service(repository, catalog);
        when(repository.findByIdOptional("missing")).thenReturn(Optional.empty());

        var activated = service.activate("missing");

        assertFalse(activated);
        verify(catalog, never()).reloadInstalledPlugins();
    }

    @Test
    void installPersistsNewDescriptorAndReloadsCatalog() {
        var repository = mock(PluginDescriptorRepository.class);
        var catalog = mock(BackendPluginCatalogService.class);
        var service = service(repository, catalog);
        when(repository.findByIdOptional("acme")).thenReturn(Optional.empty());

        var installed = service.install(command("acme", true));

        assertEquals("acme", installed.id);
        assertEquals("1.0.0", installed.version);
        assertEquals("[\"ACME_DO\"]", installed.providedTypesJson);
        assertTrue(installed.active);
        assertNotNull(installed.installedAt);
        verify(repository).persist(any(PluginDescriptor.class));
        verify(catalog).reloadInstalledPlugins();
    }

    @Test
    void installUpdatesExistingDescriptorAndReloadsCatalog() {
        var repository = mock(PluginDescriptorRepository.class);
        var catalog = mock(BackendPluginCatalogService.class);
        var existing = new PluginDescriptor();
        existing.id = "acme";
        existing.version = "0.9.0";
        existing.active = false;
        var service = service(repository, catalog);
        when(repository.findByIdOptional("acme")).thenReturn(Optional.of(existing));

        var installed = service.install(command("acme", true));

        assertEquals(existing, installed);
        assertEquals("1.0.0", existing.version);
        assertTrue(existing.active);
        verify(repository, never()).persist(any(PluginDescriptor.class));
        verify(catalog).reloadInstalledPlugins();
    }

    @Test
    void installRejectsDescriptorWithoutProvidedTypes() {
        var repository = mock(PluginDescriptorRepository.class);
        var catalog = mock(BackendPluginCatalogService.class);
        var service = service(repository, catalog);

        assertThrows(IllegalArgumentException.class, () -> service.install(new PluginDescriptorInstallCommand(
                "acme",
                "1.0.0",
                "1",
                Set.of(),
                "KAFKA",
                null,
                false,
                true,
                null,
                null)));

        verify(repository, never()).persist(any(PluginDescriptor.class));
        verify(catalog, never()).reloadInstalledPlugins();
    }

    private BackendPluginAdminService service(
            PluginDescriptorRepository repository,
            BackendPluginCatalogService catalog) {
        var objectMapper = new ObjectMapper();
        return new BackendPluginAdminService(
                repository,
                catalog,
                new PluginDescriptorCatalogMapper(objectMapper),
                new PluginDescriptorTrustPolicy(Set.of()),
                objectMapper);
    }

    private PluginDescriptorInstallCommand command(String id, boolean active) {
        return new PluginDescriptorInstallCommand(
                id,
                "1.0.0",
                "1",
                Set.of(" ACME_DO "),
                "kafka",
                null,
                false,
                active,
                null,
                null);
    }
}
