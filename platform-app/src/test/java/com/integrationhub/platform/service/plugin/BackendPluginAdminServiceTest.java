package com.integrationhub.platform.service.plugin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.entity.PluginDescriptor;
import com.integrationhub.platform.entity.PluginDescriptorVersion;
import com.integrationhub.platform.repository.PluginDescriptorRepository;
import com.integrationhub.platform.repository.PluginDescriptorVersionRepository;
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
        assertEquals("[\"REMOTE_FS\"]", installed.providedSourceTypesJson);
        assertEquals("[\"REMOTE_CSV\"]", installed.providedReaderTypesJson);
        assertEquals("stable", installed.channel);
        assertEquals("1.0.0", installed.pinnedVersion);
        assertTrue(installed.pinned);
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
    void installPersistsVersionWithoutReplacingExistingActiveProjectionWhenInactive() {
        var repository = mock(PluginDescriptorRepository.class);
        var versionRepository = mock(PluginDescriptorVersionRepository.class);
        var catalog = mock(BackendPluginCatalogService.class);
        var existing = new PluginDescriptor();
        existing.id = "acme";
        existing.version = "1.0.0";
        existing.active = true;
        var service = service(repository, versionRepository, catalog);
        when(repository.findByIdOptional("acme")).thenReturn(Optional.of(existing));
        when(repository.findById("acme")).thenReturn(existing);
        when(versionRepository.findByIdOptional("acme@1.0.0")).thenReturn(Optional.empty());

        var installed = service.install(command("acme", false));

        assertEquals(existing, installed);
        assertEquals("1.0.0", existing.version);
        assertTrue(existing.active);
        verify(versionRepository).persist(any(PluginDescriptorVersion.class));
        verify(repository, never()).persist(any(PluginDescriptor.class));
        verify(catalog).reloadInstalledPlugins();
    }

    @Test
    void activateVersionProjectsStoredVersionAndReloadsCatalog() {
        var repository = mock(PluginDescriptorRepository.class);
        var versionRepository = mock(PluginDescriptorVersionRepository.class);
        var catalog = mock(BackendPluginCatalogService.class);
        var service = service(repository, versionRepository, catalog);
        var version = version("acme", "1.1.0", "ACME_NEXT");
        when(versionRepository.findVersion("acme", "1.1.0")).thenReturn(Optional.of(version));
        when(repository.findByIdOptional("acme")).thenReturn(Optional.empty());

        var activated = service.activateVersion("acme", "1.1.0");

        assertTrue(activated);
        verify(repository).persist(any(PluginDescriptor.class));
        verify(catalog).reloadInstalledPlugins();
    }

    @Test
    void activateVersionRequiresPromotionGate() {
        var repository = mock(PluginDescriptorRepository.class);
        var versionRepository = mock(PluginDescriptorVersionRepository.class);
        var catalog = mock(BackendPluginCatalogService.class);
        var service = service(repository, versionRepository, catalog, (pluginId, version) -> {
            throw new IllegalStateException("canary samples are not healthy");
        });
        var version = version("acme", "1.1.0", "ACME_NEXT");
        when(versionRepository.findVersion("acme", "1.1.0")).thenReturn(Optional.of(version));

        assertThrows(IllegalStateException.class, () -> service.activateVersion("acme", "1.1.0"));

        verify(repository, never()).persist(any(PluginDescriptor.class));
        verify(catalog, never()).reloadInstalledPlugins();
    }

    @Test
    void installFromMarketplaceSelectsPinnedVersionAndPersistsDescriptor() {
        var repository = mock(PluginDescriptorRepository.class);
        var catalog = mock(BackendPluginCatalogService.class);
        var service = service(repository, catalog, catalogUrl -> new PluginMarketplaceCatalog(java.util.List.of(
                new PluginMarketplaceCatalog.PluginMarketplaceEntry(
                        "acme",
                        "1.0.0",
                        "1",
                        Set.of("ACME_OLD"),
                        Set.of(),
                        Set.of(),
                        "KAFKA",
                        null,
                        false,
                        null,
                        null,
                        null,
                        "stable",
                        null,
                        false),
                new PluginMarketplaceCatalog.PluginMarketplaceEntry(
                        "acme",
                        "1.1.0",
                        "1",
                        Set.of("ACME_DO"),
                        Set.of("REMOTE_FS"),
                        Set.of("REMOTE_CSV"),
                        "KAFKA",
                        null,
                        false,
                        null,
                        null,
                        null,
                        "stable",
                        null,
                        false))));
        when(repository.findByIdOptional("acme")).thenReturn(Optional.empty());

        var installed = service.installFromMarketplace(new PluginMarketplaceInstallCommand(
                "https://plugins.example.com/catalog.json",
                "acme",
                "1.1.0",
                "stable",
                true));

        assertEquals("1.1.0", installed.version);
        assertEquals("[\"ACME_DO\"]", installed.providedTypesJson);
        assertEquals("https://plugins.example.com/catalog.json", installed.marketplaceUrl);
        assertEquals("stable", installed.channel);
        assertEquals("1.1.0", installed.pinnedVersion);
        assertTrue(installed.pinned);
        verify(repository).persist(any(PluginDescriptor.class));
        verify(catalog).reloadInstalledPlugins();
    }

    @Test
    void previewFromMarketplaceSelectsHighestCompatibleVersionWithoutPersisting() {
        var repository = mock(PluginDescriptorRepository.class);
        var catalog = mock(BackendPluginCatalogService.class);
        var service = service(repository, catalog, catalogUrl -> new PluginMarketplaceCatalog(java.util.List.of(
                new PluginMarketplaceCatalog.PluginMarketplaceEntry(
                        "acme",
                        "1.0.0",
                        "1",
                        Set.of("ACME_OLD"),
                        Set.of(),
                        Set.of(),
                        "KAFKA",
                        null,
                        false,
                        null,
                        null,
                        null,
                        "stable",
                        null,
                        false),
                new PluginMarketplaceCatalog.PluginMarketplaceEntry(
                        "acme",
                        "1.2.0",
                        "1",
                        Set.of("ACME_DO"),
                        Set.of("REMOTE_FS"),
                        Set.of("REMOTE_CSV"),
                        "KAFKA",
                        null,
                        false,
                        null,
                        null,
                        null,
                        "stable",
                        null,
                        false))));

        var preview = service.previewFromMarketplace(new PluginMarketplaceInstallCommand(
                "https://plugins.example.com/catalog.json",
                "acme",
                null,
                "stable",
                false));

        assertEquals("acme", preview.id());
        assertEquals("1.2.0", preview.version());
        assertEquals(Set.of("ACME_DO"), preview.providedTypes());
        assertEquals(Set.of("REMOTE_FS"), preview.providedSourceTypes());
        assertEquals(Set.of("REMOTE_CSV"), preview.providedReaderTypes());
        assertFalse(preview.pinned());
        verify(repository, never()).persist(any(PluginDescriptor.class));
        verify(catalog, never()).reloadInstalledPlugins();
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
                Set.of(),
                Set.of(),
                "KAFKA",
                null,
                false,
                true,
                null,
                null,
                null,
                null,
                null,
                false,
                java.util.Map.of())));

        verify(repository, never()).persist(any(PluginDescriptor.class));
        verify(catalog, never()).reloadInstalledPlugins();
    }

    private BackendPluginAdminService service(
            PluginDescriptorRepository repository,
            BackendPluginCatalogService catalog) {
        var objectMapper = new ObjectMapper();
        return new BackendPluginAdminService(
                repository,
                null,
                catalog,
                new PluginDescriptorCatalogMapper(objectMapper),
                new PluginDescriptorTrustPolicy(Set.of()),
                objectMapper,
                catalogUrl -> {
                    throw new IllegalStateException("Plugin marketplace catalog client is not configured");
                },
                allowPromotion());
    }

    private BackendPluginAdminService service(
            PluginDescriptorRepository repository,
            PluginDescriptorVersionRepository versionRepository,
            BackendPluginCatalogService catalog) {
        var objectMapper = new ObjectMapper();
        return service(repository, versionRepository, catalog, allowPromotion());
    }

    private BackendPluginAdminService service(
            PluginDescriptorRepository repository,
            PluginDescriptorVersionRepository versionRepository,
            BackendPluginCatalogService catalog,
            PluginPromotionGate promotionGate) {
        var objectMapper = new ObjectMapper();
        return new BackendPluginAdminService(
                repository,
                versionRepository,
                catalog,
                new PluginDescriptorCatalogMapper(objectMapper),
                new PluginDescriptorTrustPolicy(Set.of()),
                objectMapper,
                catalogUrl -> {
                    throw new IllegalStateException("Plugin marketplace catalog client is not configured");
                },
                promotionGate);
    }

    private BackendPluginAdminService service(
            PluginDescriptorRepository repository,
            BackendPluginCatalogService catalog,
            PluginMarketplaceCatalogClient marketplaceCatalogClient) {
        var objectMapper = new ObjectMapper();
        return new BackendPluginAdminService(
                repository,
                null,
                catalog,
                new PluginDescriptorCatalogMapper(objectMapper),
                new PluginDescriptorTrustPolicy(Set.of()),
                objectMapper,
                marketplaceCatalogClient,
                allowPromotion());
    }

    private PluginPromotionGate allowPromotion() {
        return (pluginId, version) -> {
        };
    }

    private PluginDescriptorInstallCommand command(String id, boolean active) {
        return new PluginDescriptorInstallCommand(
                id,
                "1.0.0",
                "1",
                Set.of(" ACME_DO "),
                Set.of(" REMOTE_FS "),
                Set.of(" REMOTE_CSV "),
                "kafka",
                null,
                false,
                active,
                null,
                null,
                "https://plugins.example.com/catalog/acme.json",
                "stable",
                "1.0.0",
                true,
                java.util.Map.of());
    }

    private PluginDescriptorVersion version(String pluginId, String version, String taskType) {
        var descriptor = new PluginDescriptorVersion();
        descriptor.descriptorKey = PluginDescriptorVersion.key(pluginId, version);
        descriptor.pluginId = pluginId;
        descriptor.version = version;
        descriptor.spiVersion = "1";
        descriptor.providedTypesJson = "[\"" + taskType + "\"]";
        descriptor.providedSourceTypesJson = "[]";
        descriptor.providedReaderTypesJson = "[]";
        descriptor.transport = "KAFKA";
        descriptor.trusted = false;
        descriptor.channel = "stable";
        return descriptor;
    }
}
