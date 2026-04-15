package com.integrationhub.platform.api;

import com.integrationhub.platform.service.SystemThemeSettingService;
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
    public SystemThemeSettingView get() {
        return systemThemeSettingService.get();
    }

    @PUT
    @RolesAllowed({"platform-admin", "integration-admin"})
    public SystemThemeSettingView update(SystemThemeSettingRequest request) {
        return systemThemeSettingService.update(request);
    }
}
