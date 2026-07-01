package com.integrationhub.platform.service.plugin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.entity.PluginDescriptor;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PluginDescriptorCatalogMapperTest {

    private final PluginDescriptorCatalogMapper mapper = new PluginDescriptorCatalogMapper(new ObjectMapper());

    @Test
    void mapsPersistedDescriptorToRemoteDescriptor() {
        var persisted = descriptor("[\"ACME_DO\", \" acme_check \"]");

        var remote = mapper.toRemoteDescriptor(persisted);

        assertEquals("acme", remote.id());
        assertEquals("1.0.0", remote.version());
        assertEquals("1", remote.spiVersion());
        assertEquals("GRPC", remote.transport());
        assertEquals("http://localhost:9090", remote.endpoint());
        assertTrue(remote.trusted());
        assertTrue(remote.covers("ACME_DO"));
        assertTrue(remote.covers("ACME_CHECK"));
        assertTrue(remote.coversSource("REMOTE_FS"));
        assertTrue(remote.coversReader("REMOTE_CSV"));
        assertEquals("stable", remote.channel());
        assertEquals("1.0.0", remote.pinnedVersion());
        assertTrue(remote.pinned());
    }

    @Test
    void rejectsInvalidProvidedTypesJson() {
        var persisted = descriptor("{not-json}");

        assertThrows(IllegalArgumentException.class, () -> mapper.toRemoteDescriptor(persisted));
    }

    @Test
    void rejectsEmptyProvidedTypes() {
        var persisted = descriptor("[]");
        persisted.providedSourceTypesJson = "[]";
        persisted.providedReaderTypesJson = "[]";

        assertThrows(IllegalArgumentException.class, () -> mapper.toRemoteDescriptor(persisted));
    }

    private PluginDescriptor descriptor(String providedTypesJson) {
        var descriptor = new PluginDescriptor();
        descriptor.id = "acme";
        descriptor.version = "1.0.0";
        descriptor.spiVersion = "1";
        descriptor.providedTypesJson = providedTypesJson;
        descriptor.providedSourceTypesJson = "[\"REMOTE_FS\"]";
        descriptor.providedReaderTypesJson = "[\"REMOTE_CSV\"]";
        descriptor.transport = "GRPC";
        descriptor.endpoint = "http://localhost:9090";
        descriptor.trusted = true;
        descriptor.active = true;
        descriptor.marketplaceUrl = "https://plugins.example.com/catalog/acme.json";
        descriptor.channel = "stable";
        descriptor.pinnedVersion = "1.0.0";
        descriptor.pinned = true;
        return descriptor;
    }
}
