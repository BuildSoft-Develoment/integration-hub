package com.integrationhub.platform.service.plugin;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Set;
import java.util.List;

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

    @Test
    void listsDescriptorsAndAvailableTypesForDiagnostics() {
        registry.register(descriptor());

        assertEquals("acme", registry.descriptors().getFirst().id());
        assertEquals(Set.of("ACME_DO", "ACME_CHECK"), Set.copyOf(registry.availableTaskTypes()));
    }

    @Test
    void rejectsDuplicateTaskTypesAcrossPlugins() {
        registry.register(descriptor());
        var duplicate = new RemotePluginDescriptor("other", "1.0.0", "1", Set.of("acme_do"), "GRPC", true);

        assertThrows(IllegalArgumentException.class, () -> registry.register(duplicate));
    }

    @Test
    void replaceDescriptorsKeepsPreviousStateWhenCatalogHasDuplicates() {
        registry.register(descriptor());
        var replacement = new RemotePluginDescriptor("replacement", "1.0.0", "1", Set.of("NEW_TYPE"), "GRPC", true);
        var duplicate = new RemotePluginDescriptor("duplicate", "1.0.0", "1", Set.of("new_type"), "GRPC", true);

        assertThrows(IllegalArgumentException.class,
                () -> registry.replaceDescriptors(List.of(replacement, duplicate)));

        assertTrue(registry.covers("ACME_DO"));
        assertFalse(registry.covers("NEW_TYPE"));
    }
}
