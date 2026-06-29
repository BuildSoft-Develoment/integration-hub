package com.integrationhub.platform.service.plugin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.entity.PluginDescriptor;
import com.integrationhub.platform.repository.PluginDescriptorRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class BackendPluginCatalogServiceTest {

    @Test
    void reloadKeepsInvalidDescriptorsVisibleAsDegradedAfterRegistryReplacement() {
        var repository = mock(PluginDescriptorRepository.class);
        var registry = new RemotePluginRegistry();
        var service = new BackendPluginCatalogService(
                repository,
                new PluginDescriptorCatalogMapper(new ObjectMapper()),
                new PluginDescriptorTrustPolicy(Set.of()),
                registry);

        when(repository.listActive()).thenReturn(List.of(
                descriptor("acme", "http://localhost:9090", true),
                descriptor("unsafe", "https://plugins.example.com:9443", true)));

        var loaded = service.reloadInstalledPlugins();

        assertEquals(1, loaded);
        assertTrue(registry.covers("ACME_DO"));
        assertEquals("Plugin unsafe endpoint origin is not allowlisted", registry.degraded().get("unsafe"));
    }

    private PluginDescriptor descriptor(String id, String endpoint, boolean trusted) {
        var descriptor = new PluginDescriptor();
        descriptor.id = id;
        descriptor.version = "1.0.0";
        descriptor.spiVersion = "1";
        descriptor.providedTypesJson = "[\"" + id.toUpperCase() + "_DO\"]";
        descriptor.transport = "GRPC";
        descriptor.endpoint = endpoint;
        descriptor.trusted = trusted;
        descriptor.active = true;
        descriptor.integrity = "sha256-YWJjZA==";
        descriptor.signature = "dev-key:YWJjZA==";
        return descriptor;
    }
}
