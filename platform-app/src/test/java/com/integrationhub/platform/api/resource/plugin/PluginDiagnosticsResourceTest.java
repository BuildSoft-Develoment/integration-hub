package com.integrationhub.platform.api.resource.plugin;

import com.integrationhub.platform.api.request.plugin.PluginCanaryMetricRequest;
import com.integrationhub.platform.api.request.plugin.PluginInstallRequest;
import com.integrationhub.platform.api.request.plugin.PluginMarketplaceInstallRequest;
import com.integrationhub.platform.entity.PluginDescriptorVersion;
import com.integrationhub.platform.service.plugin.MetricsPluginPromotionGate;
import com.integrationhub.platform.service.plugin.PluginCanaryStatus;
import com.integrationhub.platform.service.plugin.PluginRuntimeMetricsRecorder;
import com.integrationhub.platform.service.plugin.RemotePluginDescriptor;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import com.integrationhub.platform.service.plugin.BackendPluginAdminService;
import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.List;

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
        var resource = resource(registry, mock(BackendPluginAdminService.class));

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
        var resource = resource(registry, mock(BackendPluginAdminService.class));

        var diagnostics = resource.diagnostics();

        assertEquals("DEGRADED", diagnostics.installed().getFirst().status());
        assertEquals("invocacion fallida", diagnostics.installed().getFirst().degradedReason());
        assertEquals("invocacion fallida", diagnostics.degraded().get("acme"));
    }

    @Test
    void reloadDelegatesToAdminServiceAndReturnsDiagnostics() {
        var registry = new RemotePluginRegistry();
        var admin = mock(BackendPluginAdminService.class);
        var resource = resource(registry, admin);

        var diagnostics = resource.reload();

        verify(admin).reload();
        assertEquals(0, diagnostics.installed().size());
    }

    @Test
    void installDelegatesToAdminServiceAndReturnsDiagnostics() {
        var registry = new RemotePluginRegistry();
        var admin = mock(BackendPluginAdminService.class);
        var resource = resource(registry, admin);
        var request = new PluginInstallRequest(
                "acme",
                "1.0.0",
                "1",
                Set.of("ACME_DO"),
                Set.of("REMOTE_FS"),
                Set.of("REMOTE_CSV"),
                "KAFKA",
                null,
                false,
                true,
                null,
                null,
                "https://plugins.example.com/catalog/acme.json",
                "stable",
                "1.0.0",
                true);

        var diagnostics = resource.install(request);

        verify(admin).install(request.toCommand());
        assertEquals(0, diagnostics.installed().size());
    }

    @Test
    void deactivateDelegatesToAdminServiceAndReturnsDiagnostics() {
        var registry = new RemotePluginRegistry();
        var admin = mock(BackendPluginAdminService.class);
        when(admin.deactivate("acme")).thenReturn(true);
        var resource = resource(registry, admin);

        var diagnostics = resource.deactivate("acme");

        verify(admin).deactivate("acme");
        assertEquals(0, diagnostics.installed().size());
    }

    @Test
    void marketplaceInstallDelegatesToAdminServiceAndReturnsDiagnostics() {
        var registry = new RemotePluginRegistry();
        var admin = mock(BackendPluginAdminService.class);
        var resource = resource(registry, admin);
        var request = new PluginMarketplaceInstallRequest(
                "https://plugins.example.com/catalog.json",
                "acme",
                "1.0.0",
                "stable",
                true);

        var diagnostics = resource.installFromMarketplace(request);

        verify(admin).installFromMarketplace(request.toCommand());
        assertEquals(0, diagnostics.installed().size());
    }

    @Test
    void marketplacePreviewDelegatesToAdminServiceAndReturnsDescriptor() {
        var registry = new RemotePluginRegistry();
        var admin = mock(BackendPluginAdminService.class);
        var resource = resource(registry, admin);
        var request = new PluginMarketplaceInstallRequest(
                "https://plugins.example.com/catalog.json",
                "acme",
                null,
                "stable",
                false);
        when(admin.previewFromMarketplace(request.toCommand())).thenReturn(new RemotePluginDescriptor(
                "acme",
                "1.2.0",
                "1",
                Set.of("ACME_DO"),
                Set.of("REMOTE_FS"),
                Set.of("REMOTE_CSV"),
                "KAFKA",
                null,
                false,
                "https://plugins.example.com/catalog.json",
                "stable",
                null,
                false));

        var preview = resource.previewFromMarketplace(request);

        verify(admin).previewFromMarketplace(request.toCommand());
        assertEquals("acme", preview.id());
        assertEquals("1.2.0", preview.version());
        assertEquals(List.of("ACME_DO"), preview.providedTypes());
        assertEquals(List.of("REMOTE_FS"), preview.providedSourceTypes());
        assertEquals("UNTRUSTED", preview.status());
    }

    @Test
    void activateDelegatesToAdminServiceAndReturnsDiagnostics() {
        var registry = new RemotePluginRegistry();
        var admin = mock(BackendPluginAdminService.class);
        when(admin.activate("acme")).thenReturn(true);
        var resource = resource(registry, admin);

        var diagnostics = resource.activate("acme");

        verify(admin).activate("acme");
        assertEquals(0, diagnostics.installed().size());
    }

    @Test
    void activateVersionDelegatesToAdminServiceAndReturnsDiagnostics() {
        var registry = new RemotePluginRegistry();
        var admin = mock(BackendPluginAdminService.class);
        when(admin.activateVersion("acme", "1.1.0")).thenReturn(true);
        var resource = resource(registry, admin);

        var diagnostics = resource.activateVersion("acme", "1.1.0");

        verify(admin).activateVersion("acme", "1.1.0");
        assertEquals(0, diagnostics.installed().size());
    }

    @Test
    void diagnosticsIncludesInstalledVersions() {
        var registry = new RemotePluginRegistry();
        var admin = mock(BackendPluginAdminService.class);
        var version = new PluginDescriptorVersion();
        version.pluginId = "acme";
        version.version = "1.0.0";
        version.spiVersion = "1";
        version.providedTypesJson = "[\"ACME_DO\"]";
        version.providedSourceTypesJson = "[]";
        version.providedReaderTypesJson = "[]";
        version.transport = "KAFKA";
        when(admin.listVersions()).thenReturn(List.of(version));
        var resource = resource(registry, admin);

        var diagnostics = resource.diagnostics();

        assertEquals(1, diagnostics.versions().size());
        assertEquals("acme", diagnostics.versions().getFirst().id());
    }

    @Test
    void deactivateReturnsNotFoundWhenDescriptorDoesNotExist() {
        var registry = new RemotePluginRegistry();
        var admin = mock(BackendPluginAdminService.class);
        var resource = resource(registry, admin);

        assertThrows(jakarta.ws.rs.NotFoundException.class, () -> resource.deactivate("missing"));
    }

    @Test
    void activateReturnsNotFoundWhenDescriptorDoesNotExist() {
        var registry = new RemotePluginRegistry();
        var admin = mock(BackendPluginAdminService.class);
        var resource = resource(registry, admin);

        assertThrows(jakarta.ws.rs.NotFoundException.class, () -> resource.activate("missing"));
    }

    @Test
    void recordCanaryMetricDelegatesToMetricsRecorder() {
        var registry = new RemotePluginRegistry();
        var admin = mock(BackendPluginAdminService.class);
        var recorder = mock(PluginRuntimeMetricsRecorder.class);
        var resource = new PluginDiagnosticsResource(
                registry, admin, recorder, mock(MetricsPluginPromotionGate.class));
        var request = new PluginCanaryMetricRequest("ACME_DO", "KAFKA", true, "SUCCESS", 25, null);

        var diagnostics = resource.recordCanaryMetric("acme", "1.1.0", request);

        verify(recorder).record(request.toCommand("acme", "1.1.0"));
        assertEquals(0, diagnostics.installed().size());
    }

    @Test
    void canaryMetricsEvaluatesEachInstalledVersion() {
        var registry = new RemotePluginRegistry();
        var admin = mock(BackendPluginAdminService.class);
        var version = new PluginDescriptorVersion();
        version.pluginId = "acme";
        version.version = "2.0.0";
        when(admin.listVersions()).thenReturn(List.of(version));
        var gate = mock(MetricsPluginPromotionGate.class);
        when(gate.evaluate("acme", "2.0.0")).thenReturn(new PluginCanaryStatus(
                "acme", "2.0.0", 5, 1, 0.2, 24, 3, 0.0, false, "FAILURE_RATIO_EXCEEDED",
                List.of(0.0, 0.5, 0.2)));
        var resource = new PluginDiagnosticsResource(
                registry, admin, mock(PluginRuntimeMetricsRecorder.class), gate);

        var metrics = resource.canaryMetrics();

        verify(gate).evaluate("acme", "2.0.0");
        assertEquals(1, metrics.size());
        assertEquals("acme", metrics.getFirst().pluginId());
        assertEquals("2.0.0", metrics.getFirst().version());
        assertEquals(5, metrics.getFirst().totalSamples());
        assertEquals(1, metrics.getFirst().failures());
        assertEquals(false, metrics.getFirst().promotable());
        assertEquals("FAILURE_RATIO_EXCEEDED", metrics.getFirst().blockReason());
        assertEquals(List.of(0.0, 0.5, 0.2), metrics.getFirst().trend());
    }

    private PluginDiagnosticsResource resource(RemotePluginRegistry registry, BackendPluginAdminService admin) {
        return new PluginDiagnosticsResource(
                registry, admin, mock(PluginRuntimeMetricsRecorder.class), mock(MetricsPluginPromotionGate.class));
    }
}
