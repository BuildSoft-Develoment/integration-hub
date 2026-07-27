package com.integrationhub.platform.api.resource.plugin;

import com.integrationhub.platform.api.request.plugin.PluginCanaryMetricRequest;
import com.integrationhub.platform.api.request.plugin.PluginCanaryWeightRequest;
import com.integrationhub.platform.api.request.plugin.PluginInstallRequest;
import com.integrationhub.platform.api.request.plugin.PluginMarketplaceInstallRequest;
import com.integrationhub.platform.api.response.plugin.BackendPluginDescriptorResponse;
import com.integrationhub.platform.api.response.plugin.BackendPluginDiagnosticsResponse;
import com.integrationhub.platform.api.response.plugin.BackendPluginVersionResponse;
import com.integrationhub.platform.api.response.plugin.PluginCanaryMetricsResponse;
import com.integrationhub.platform.api.response.plugin.PluginCanaryRouteResponse;
import com.integrationhub.platform.entity.PluginDescriptorVersion;
import com.integrationhub.platform.service.plugin.BackendPluginAdminService;
import com.integrationhub.platform.service.plugin.CanaryRolloutSelector;
import com.integrationhub.platform.service.plugin.MetricsPluginPromotionGate;
import com.integrationhub.platform.service.plugin.PluginRuntimeMetricsRecorder;
import com.integrationhub.platform.service.plugin.RemotePluginDescriptor;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import static com.integrationhub.platform.spi.security.PlatformRoles.AUDITOR;
import static com.integrationhub.platform.spi.security.PlatformRoles.INTEGRATION_ADMIN;
import static com.integrationhub.platform.spi.security.PlatformRoles.PLATFORM_ADMIN;

@Path("/api/plugins")
@Produces(MediaType.APPLICATION_JSON)
public class PluginDiagnosticsResource {

    private final RemotePluginRegistry remotePlugins;
    private final BackendPluginAdminService adminService;
    private final PluginRuntimeMetricsRecorder metricsRecorder;
    private final MetricsPluginPromotionGate promotionGate;
    private final CanaryRolloutSelector rolloutSelector;

    public PluginDiagnosticsResource(
            RemotePluginRegistry remotePlugins,
            BackendPluginAdminService adminService,
            PluginRuntimeMetricsRecorder metricsRecorder,
            MetricsPluginPromotionGate promotionGate,
            CanaryRolloutSelector rolloutSelector) {
        this.remotePlugins = remotePlugins;
        this.adminService = adminService;
        this.metricsRecorder = metricsRecorder;
        this.promotionGate = promotionGate;
        this.rolloutSelector = rolloutSelector;
    }

    @GET
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, AUDITOR})
    public BackendPluginDiagnosticsResponse diagnostics() {
        return currentDiagnostics();
    }

    @GET
    @Path("/canary/metrics")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, AUDITOR})
    public List<PluginCanaryMetricsResponse> canaryMetrics() {
        return versions().stream()
                .map(version -> toCanaryResponse(promotionGate.evaluate(version.pluginId, version.version)))
                .sorted(Comparator.comparing(PluginCanaryMetricsResponse::pluginId)
                        .thenComparing(PluginCanaryMetricsResponse::version))
                .toList();
    }

    @POST
    @Path("/reload")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN})
    public BackendPluginDiagnosticsResponse reload() {
        adminService.reload();
        return currentDiagnostics();
    }

    @POST
    @Path("/install")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN})
    public BackendPluginDiagnosticsResponse install(PluginInstallRequest request) {
        adminService.install(request.toCommand());
        return currentDiagnostics();
    }

    @POST
    @Path("/marketplace/install")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN})
    public BackendPluginDiagnosticsResponse installFromMarketplace(PluginMarketplaceInstallRequest request) {
        adminService.installFromMarketplace(request.toCommand());
        return currentDiagnostics();
    }

    @POST
    @Path("/marketplace/preview")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN})
    public BackendPluginDescriptorResponse previewFromMarketplace(PluginMarketplaceInstallRequest request) {
        return toResponse(adminService.previewFromMarketplace(request.toCommand()), Map.of());
    }

    @POST
    @Path("/{id}/activate")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN})
    public BackendPluginDiagnosticsResponse activate(@PathParam("id") String id) {
        if (!adminService.activate(id)) {
            throw new NotFoundException("Plugin " + id + " not found");
        }
        return currentDiagnostics();
    }

    @POST
    @Path("/{id}/versions/{version}/activate")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN})
    public BackendPluginDiagnosticsResponse activateVersion(
            @PathParam("id") String id,
            @PathParam("version") String version) {
        if (!adminService.activateVersion(id, version)) {
            throw new NotFoundException("Plugin " + id + " version " + version + " not found");
        }
        return currentDiagnostics();
    }

    @POST
    @Path("/{id}/versions/{version}/canary-weight")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN})
    public BackendPluginDiagnosticsResponse setCanaryWeight(
            @PathParam("id") String id,
            @PathParam("version") String version,
            PluginCanaryWeightRequest request) {
        var weight = request == null ? null : request.weight();
        if (!adminService.setCanaryWeight(id, version, weight)) {
            throw new NotFoundException("Plugin " + id + " version " + version + " not found");
        }
        return currentDiagnostics();
    }

    @GET
    @Path("/{id}/canary/route")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, AUDITOR})
    public PluginCanaryRouteResponse canaryRoute(
            @PathParam("id") String id,
            @QueryParam("key") String key) {
        var canary = versions().stream()
                .filter(version -> id.equals(version.pluginId)
                        && version.channel != null
                        && version.channel.toLowerCase().contains("canary"))
                .findFirst();
        var stableVersion = remotePlugins.descriptors().stream()
                .filter(descriptor -> descriptor.id().equals(id))
                .map(RemotePluginDescriptor::version)
                .findFirst()
                .orElse(null);
        if (canary.isEmpty()) {
            return new PluginCanaryRouteResponse(id, key, false, stableVersion);
        }
        var toCanary = rolloutSelector.routesToCanary(canary.get().canaryWeight, key);
        return new PluginCanaryRouteResponse(
                id, key, toCanary, toCanary ? canary.get().version : stableVersion);
    }

    @POST
    @Path("/{id}/versions/{version}/canary/metrics")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN})
    public BackendPluginDiagnosticsResponse recordCanaryMetric(
            @PathParam("id") String id,
            @PathParam("version") String version,
            PluginCanaryMetricRequest request) {
        metricsRecorder.record(request.toCommand(id, version));
        return currentDiagnostics();
    }

    @POST
    @Path("/{id}/deactivate")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN})
    public BackendPluginDiagnosticsResponse deactivate(@PathParam("id") String id) {
        if (!adminService.deactivate(id)) {
            throw new NotFoundException("Plugin " + id + " not found");
        }
        return currentDiagnostics();
    }

    /** Uninstall real de un plugin backend: borra descriptor + versiones (deactivate solo apaga). */
    @DELETE
    @Path("/{id}")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN})
    public BackendPluginDiagnosticsResponse uninstall(@PathParam("id") String id) {
        if (!adminService.uninstall(id)) {
            throw new NotFoundException("Plugin " + id + " not found");
        }
        return currentDiagnostics();
    }

    private BackendPluginDiagnosticsResponse currentDiagnostics() {
        var degraded = remotePlugins.degraded();
        return new BackendPluginDiagnosticsResponse(
                remotePlugins.descriptors().stream()
                        .map(descriptor -> toResponse(descriptor, degraded))
                        .toList(),
                versions().stream()
                        .map(this::toVersionResponse)
                        .toList(),
                degraded
        );
    }

    private PluginCanaryMetricsResponse toCanaryResponse(
            com.integrationhub.platform.service.plugin.PluginCanaryStatus status) {
        return new PluginCanaryMetricsResponse(
                status.pluginId(),
                status.version(),
                status.totalSamples(),
                status.failures(),
                status.failureRatio(),
                status.windowHours(),
                status.minSamples(),
                status.maxFailureRatio(),
                status.promotable(),
                status.blockReason(),
                status.trend());
    }

    private List<PluginDescriptorVersion> versions() {
        var versions = adminService.listVersions();
        return versions == null ? List.of() : versions;
    }

    private BackendPluginDescriptorResponse toResponse(
            RemotePluginDescriptor descriptor,
            Map<String, String> degraded) {
        var reason = degraded.get(descriptor.id());
        return new BackendPluginDescriptorResponse(
                descriptor.id(),
                descriptor.version(),
                descriptor.spiVersion(),
                sorted(descriptor.providedTypes()),
                sorted(descriptor.providedSourceTypes()),
                sorted(descriptor.providedReaderTypes()),
                descriptor.transport(),
                descriptor.trusted(),
                status(descriptor, reason),
                reason,
                descriptor.marketplaceUrl(),
                descriptor.channel(),
                descriptor.pinnedVersion(),
                descriptor.pinned()
        );
    }

    private List<String> sorted(java.util.Collection<String> rawTypes) {
        var types = new ArrayList<>(rawTypes);
        types.sort(Comparator.naturalOrder());
        return types;
    }

    private String status(RemotePluginDescriptor descriptor, String degradedReason) {
        if (degradedReason != null) {
            return "DEGRADED";
        }
        return descriptor.trusted() ? "ACTIVE" : "UNTRUSTED";
    }

    private BackendPluginVersionResponse toVersionResponse(PluginDescriptorVersion version) {
        return new BackendPluginVersionResponse(
                version.pluginId,
                version.version,
                version.spiVersion,
                parse(version.providedTypesJson),
                parse(version.providedSourceTypesJson),
                parse(version.providedReaderTypesJson),
                version.transport,
                version.trusted,
                isActive(version),
                version.marketplaceUrl,
                version.channel,
                version.pinnedVersion,
                version.pinned,
                version.canaryWeight
        );
    }

    private boolean isActive(PluginDescriptorVersion version) {
        return remotePlugins.descriptors().stream()
                .anyMatch(descriptor -> descriptor.id().equals(version.pluginId)
                        && descriptor.version().equals(version.version));
    }

    private List<String> parse(String rawJson) {
        if (rawJson == null || rawJson.isBlank() || "[]".equals(rawJson.trim())) {
            return List.of();
        }
        try {
            var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            var types = mapper.readValue(rawJson, new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {
            });
            return sorted(types);
        } catch (com.fasterxml.jackson.core.JsonProcessingException ignored) {
            return List.of();
        }
    }
}
