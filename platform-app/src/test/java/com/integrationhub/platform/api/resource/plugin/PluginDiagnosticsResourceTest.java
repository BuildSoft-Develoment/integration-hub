package com.integrationhub.platform.api.resource.plugin;

import com.integrationhub.platform.service.plugin.RemotePluginDescriptor;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PluginDiagnosticsResourceTest {

    @Test
    void returnsInstalledBackendPluginsWithStatus() {
        var registry = new RemotePluginRegistry();
        registry.register(new RemotePluginDescriptor("acme", "1.0.0", "1", Set.of("ACME_DO"), "GRPC", true));
        var resource = new PluginDiagnosticsResource(registry);

        var diagnostics = resource.diagnostics();

        assertEquals(1, diagnostics.installed().size());
        assertEquals("acme", diagnostics.installed().getFirst().id());
        assertEquals("ACTIVE", diagnostics.installed().getFirst().status());
    }

    @Test
    void surfacesDegradedBackendPlugins() {
        var registry = new RemotePluginRegistry();
        registry.register(new RemotePluginDescriptor("acme", "1.0.0", "1", Set.of("ACME_DO"), "GRPC", true));
        registry.markDegraded("acme", "invocacion fallida");
        var resource = new PluginDiagnosticsResource(registry);

        var diagnostics = resource.diagnostics();

        assertEquals("DEGRADED", diagnostics.installed().getFirst().status());
        assertEquals("invocacion fallida", diagnostics.installed().getFirst().degradedReason());
        assertEquals("invocacion fallida", diagnostics.degraded().get("acme"));
    }
}
