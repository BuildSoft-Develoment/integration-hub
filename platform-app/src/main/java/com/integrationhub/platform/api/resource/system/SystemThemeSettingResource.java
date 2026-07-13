package com.integrationhub.platform.api.resource.system;

// @trace RF-002 (reingenieria: clase que implementa el/los RF en produccion)

import com.integrationhub.platform.api.request.system.SystemThemeSettingRequest;
import com.integrationhub.platform.api.response.system.SystemThemeSettingResponse;
import com.integrationhub.platform.service.system.SystemThemeSettingService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import static com.integrationhub.platform.api.security.PlatformRoles.AUDITOR;
import static com.integrationhub.platform.api.security.PlatformRoles.INTEGRATION_ADMIN;
import static com.integrationhub.platform.api.security.PlatformRoles.PLATFORM_ADMIN;

@Path("/api/system/theme")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SystemThemeSettingResource {

    private final SystemThemeSettingService systemThemeSettingService;

    public SystemThemeSettingResource(SystemThemeSettingService systemThemeSettingService) {
        this.systemThemeSettingService = systemThemeSettingService;
    }

    @GET
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, AUDITOR})
    public SystemThemeSettingResponse get() {
        return systemThemeSettingService.get();
    }

    @PUT
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN})
    public SystemThemeSettingResponse update(SystemThemeSettingRequest request) {
        try {
            return systemThemeSettingService.update(request);
        } catch (IllegalArgumentException invalid) {
            // Config invalida (p.ej. logo con data-URI/tamano no permitido) -> 400, no 500.
            throw new BadRequestException(invalid.getMessage(), invalid);
        }
    }
}
