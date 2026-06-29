package com.integrationhub.platform.api.resource.plugin;

import com.integrationhub.platform.api.response.plugin.BackendPluginDescriptorResponse;
import com.integrationhub.platform.api.response.plugin.BackendPluginDiagnosticsResponse;
import com.integrationhub.platform.service.plugin.RemotePluginDescriptor;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
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

    public PluginDiagnosticsResource(RemotePluginRegistry remotePlugins) {
        this.remotePlugins = remotePlugins;
    }

    @GET
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, AUDITOR})
    public BackendPluginDiagnosticsResponse diagnostics() {
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
