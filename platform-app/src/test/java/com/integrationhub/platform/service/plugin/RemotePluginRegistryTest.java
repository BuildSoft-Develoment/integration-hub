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
        return new RemotePluginDescriptor(
                "acme",
                "1.0.0",
                "1",
                Set.of("ACME_DO", "ACME_CHECK"),
                Set.of("REMOTE_FS"),
                Set.of("REMOTE_CSV"),
                "GRPC",
                null,
                true);
    }

    @Test
    void registersAndResolvesByTypeCaseInsensitive() {
        registry.register(descriptor());

        assertTrue(registry.covers("ACME_DO"));
        assertTrue(registry.covers("acme_check"));
        assertEquals("acme", registry.descriptorFor("ACME_DO").orElseThrow().id());
        assertEquals("acme", registry.descriptorForSource("remote_fs").orElseThrow().id());
        assertEquals("acme", registry.descriptorForReader("remote_csv").orElseThrow().id());
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
        assertEquals(Set.of("REMOTE_FS"), Set.copyOf(registry.availableSourceTypes()));
        assertEquals(Set.of("REMOTE_CSV"), Set.copyOf(registry.availableReaderTypes()));
    }

    @Test
    void rejectsDuplicateTaskTypesAcrossPlugins() {
        registry.register(descriptor());
        var duplicate = new RemotePluginDescriptor("other", "1.0.0", "1", Set.of("acme_do"), "GRPC", true);

        assertThrows(IllegalArgumentException.class, () -> registry.register(duplicate));
    }

    private RemotePluginDescriptor canaryDescriptor() {
        return new RemotePluginDescriptor(
                "acme",
                "2.0.0",
                "1",
                Set.of("ACME_DO", "ACME_CHECK"),
                Set.of("REMOTE_FS"),
                Set.of("REMOTE_CSV"),
                "GRPC",
                null,
                true);
    }

    @Test
    void invocationResolvesStableWhenNoCanaryIsRegistered() {
        registry.replaceDescriptors(List.of(descriptor()));

        for (int i = 0; i < 20; i++) {
            assertEquals("1.0.0", registry.descriptorForInvocation("ACME_DO").orElseThrow().version());
        }
    }

    @Test
    void invocationRoutesAllTrafficToCanaryAtFullWeight() {
        registry.replaceDescriptors(List.of(descriptor()),
                List.of(new RemotePluginRegistry.CanaryCandidate(canaryDescriptor(), 100)));

        // Stable/diagnostic resolution is unchanged; only invocation splits.
        assertEquals("1.0.0", registry.descriptorFor("ACME_DO").orElseThrow().version());
        for (int i = 0; i < 20; i++) {
            assertEquals("2.0.0", registry.descriptorForInvocation("ACME_DO").orElseThrow().version());
            assertEquals("2.0.0", registry.descriptorForSourceInvocation("REMOTE_FS").orElseThrow().version());
            assertEquals("2.0.0", registry.descriptorForReaderInvocation("REMOTE_CSV").orElseThrow().version());
        }
    }

    @Test
    void invocationIgnoresCanaryWithNonPositiveWeight() {
        registry.replaceDescriptors(List.of(descriptor()),
                List.of(new RemotePluginRegistry.CanaryCandidate(canaryDescriptor(), 0)));

        for (int i = 0; i < 20; i++) {
            assertEquals("1.0.0", registry.descriptorForInvocation("ACME_DO").orElseThrow().version());
        }
    }

    @Test
    void invocationSplitsTrafficAtPartialWeight() {
        registry.replaceDescriptors(List.of(descriptor()),
                List.of(new RemotePluginRegistry.CanaryCandidate(canaryDescriptor(), 50)));

        var versionsSeen = new java.util.HashSet<String>();
        for (int i = 0; i < 300; i++) {
            versionsSeen.add(registry.descriptorForInvocation("ACME_DO").orElseThrow().version());
        }
        // Over many draws both the stable and the canary version are exercised.
        assertEquals(Set.of("1.0.0", "2.0.0"), versionsSeen);
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
