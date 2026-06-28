package com.integrationhub.platform.service.plugin;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Set;

import org.junit.jupiter.api.Test;

class RemotePluginRegistryTest {

    private final RemotePluginRegistry registry = new RemotePluginRegistry();

    private RemotePluginDescriptor descriptor() {
        return new RemotePluginDescriptor("acme", "1.0.0", "1", Set.of("ACME_DO", "ACME_CHECK"), "GRPC", true);
    }

    @Test
    void registersAndResolvesByTypeCaseInsensitive() {
        registry.register(descriptor());

        assertTrue(registry.covers("ACME_DO"));
        assertTrue(registry.covers("acme_check"));
        assertEquals("acme", registry.descriptorFor("ACME_DO").orElseThrow().id());
    }

    @Test
    void doesNotCoverUnknownTypes() {
        registry.register(descriptor());

        assertFalse(registry.covers("DB_WRITE"));
        assertFalse(registry.covers(null));
        assertTrue(registry.descriptorFor("UNKNOWN").isEmpty());
    }

    @Test
    void surfacesDegradedPlugins() {
        registry.markDegraded("acme", "invocacion fallida: boom");

        assertEquals("invocacion fallida: boom", registry.degraded().get("acme"));
    }
}
