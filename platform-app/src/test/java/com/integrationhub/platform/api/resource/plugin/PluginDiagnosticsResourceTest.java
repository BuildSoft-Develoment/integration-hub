package com.integrationhub.platform.api.resource.plugin;

import com.integrationhub.platform.service.plugin.RemotePluginDescriptor;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import com.integrationhub.platform.service.plugin.BackendPluginAdminService;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PluginDiagnosticsResourceTest {

    @Test
    void returnsInstalledBackendPluginsWithStatus() {
        var registry = new RemotePluginRegistry();
        registry.register(new RemotePluginDescriptor("acme", "1.0.0", "1", Set.of("ACME_DO"), "GRPC", true));
        var resource = new PluginDiagnosticsResource(registry, mock(BackendPluginAdminService.class));

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
        var resource = new PluginDiagnosticsResource(registry, mock(BackendPluginAdminService.class));

        var diagnostics = resource.diagnostics();

        assertEquals("DEGRADED", diagnostics.installed().getFirst().status());
        assertEquals("invocacion fallida", diagnostics.installed().getFirst().degradedReason());
        assertEquals("invocacion fallida", diagnostics.degraded().get("acme"));
    }

    @Test
    void reloadDelegatesToAdminServiceAndReturnsDiagnostics() {
        var registry = new RemotePluginRegistry();
        var admin = mock(BackendPluginAdminService.class);
        var resource = new PluginDiagnosticsResource(registry, admin);

        var diagnostics = resource.reload();

        verify(admin).reload();
        assertEquals(0, diagnostics.installed().size());
    }

    @Test
    void deactivateDelegatesToAdminServiceAndReturnsDiagnostics() {
        var registry = new RemotePluginRegistry();
        var admin = mock(BackendPluginAdminService.class);
        when(admin.deactivate("acme")).thenReturn(true);
        var resource = new PluginDiagnosticsResource(registry, admin);

        var diagnostics = resource.deactivate("acme");

        verify(admin).deactivate("acme");
        assertEquals(0, diagnostics.installed().size());
    }

    @Test
    void deactivateReturnsNotFoundWhenDescriptorDoesNotExist() {
        var registry = new RemotePluginRegistry();
        var admin = mock(BackendPluginAdminService.class);
        var resource = new PluginDiagnosticsResource(registry, admin);

        assertThrows(jakarta.ws.rs.NotFoundException.class, () -> resource.deactivate("missing"));
    }
}
