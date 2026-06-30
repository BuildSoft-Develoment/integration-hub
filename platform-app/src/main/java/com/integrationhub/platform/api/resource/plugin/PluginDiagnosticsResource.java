package com.integrationhub.platform.api.resource.plugin;

import com.integrationhub.platform.api.request.plugin.PluginInstallRequest;
import com.integrationhub.platform.api.response.plugin.BackendPluginDescriptorResponse;
import com.integrationhub.platform.api.response.plugin.BackendPluginDiagnosticsResponse;
import com.integrationhub.platform.service.plugin.BackendPluginAdminService;
import com.integrationhub.platform.service.plugin.RemotePluginDescriptor;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import static com.integrationhub.platform.api.security.PlatformRoles.AUDITOR;
import static com.integrationhub.platform.api.security.PlatformRoles.INTEGRATION_ADMIN;
import static com.integrationhub.platform.api.security.PlatformRoles.PLATFORM_ADMIN;

@Path("/api/plugins")
@Produces(MediaType.APPLICATION_JSON)
public class PluginDiagnosticsResource {

    private final RemotePluginRegistry remotePlugins;
    private final BackendPluginAdminService adminService;

    public PluginDiagnosticsResource(
            RemotePluginRegistry remotePlugins,
            BackendPluginAdminService adminService) {
        this.remotePlugins = remotePlugins;
        this.adminService = adminService;
    }

    @GET
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, AUDITOR})
    public BackendPluginDiagnosticsResponse diagnostics() {
        return currentDiagnostics();
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
    @Path("/{id}/activate")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN})
    public BackendPluginDiagnosticsResponse activate(@PathParam("id") String id) {
        if (!adminService.activate(id)) {
            throw new NotFoundException("Plugin " + id + " not found");
        }
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

    private BackendPluginDiagnosticsResponse currentDiagnostics() {
        var degraded = remotePlugins.degraded();
        return new BackendPluginDiagnosticsResponse(
                remotePlugins.descriptors().stream()
                        .map(descriptor -> toResponse(descriptor, degraded))
                        .toList(),
                degraded
        );
    }

    private BackendPluginDescriptorResponse toResponse(
            RemotePluginDescriptor descriptor,
            Map<String, String> degraded) {
        var reason = degraded.get(descriptor.id());
        return new BackendPluginDescriptorResponse(
                descriptor.id(),
                descriptor.version(),
                descriptor.spiVersion(),
                sortedTypes(descriptor),
                descriptor.transport(),
                descriptor.trusted(),
                status(descriptor, reason),
                reason
        );
    }

    private List<String> sortedTypes(RemotePluginDescriptor descriptor) {
        var types = new ArrayList<>(descriptor.providedTypes());
        types.sort(Comparator.naturalOrder());
        return types;
    }

    private String status(RemotePluginDescriptor descriptor, String degradedReason) {
        if (degradedReason != null) {
            return "DEGRADED";
        }
        return descriptor.trusted() ? "ACTIVE" : "UNTRUSTED";
    }
}
