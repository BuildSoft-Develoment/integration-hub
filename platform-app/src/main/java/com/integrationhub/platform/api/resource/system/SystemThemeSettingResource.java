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
import static com.integrationhub.platform.api.security.PlatformRoles.OPERATOR;
import static com.integrationhub.platform.api.security.PlatformRoles.PAYMENTS_OPERATOR;
import static com.integrationhub.platform.api.security.PlatformRoles.PLATFORM_ADMIN;

@Path("/api/system/theme")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SystemThemeSettingResource {

    private final SystemThemeSettingService systemThemeSettingService;

    public SystemThemeSettingResource(SystemThemeSettingService systemThemeSettingService) {
        this.systemThemeSettingService = systemThemeSettingService;
    }

    // El tema es una config de display singleton que la UI consulta al cargar para CUALQUIER usuario
    // (app-preferences.facade). Lectura por el read-set operativo estandar (como el resto de GETs y como el
    // hermano /api/branding que es PermitAll); antes restringia a admin/auditor y los demas roles (operator,
    // payments-operator, maker/checker) recibian 403 y no se les aplicaba el tema. La escritura (PUT) sigue admin-only.
    @GET
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR, AUDITOR})
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
