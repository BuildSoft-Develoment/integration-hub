package com.integrationhub.platform.api.resource.system;

// @trace RF-002 (reingenieria: clase que implementa el/los RF en produccion)

import com.integrationhub.platform.api.request.system.SystemThemeSettingRequest;
import com.integrationhub.platform.api.response.system.SystemThemeSettingResponse;
import com.integrationhub.platform.service.system.SystemThemeSettingService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/api/system/theme")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SystemThemeSettingResource {

    private final SystemThemeSettingService systemThemeSettingService;

    public SystemThemeSettingResource(SystemThemeSettingService systemThemeSettingService) {
        this.systemThemeSettingService = systemThemeSettingService;
    }

    @GET
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
    public SystemThemeSettingResponse get() {
        return systemThemeSettingService.get();
    }

    @PUT
    @RolesAllowed({"platform-admin", "integration-admin"})
    public SystemThemeSettingResponse update(SystemThemeSettingRequest request) {
        return systemThemeSettingService.update(request);
    }
}
