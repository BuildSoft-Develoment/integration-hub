package com.integrationhub.platform.api.resource.branding;

import com.integrationhub.platform.service.system.SystemThemeSettingService;
import jakarta.annotation.security.PermitAll;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.OPTIONS;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

/**
 * Branding publico (sin auth) para pintar pantallas pre-auth (login de Keycloak). Devuelve solo
 * datos visibles (nombre/marca/logo/color) desde {@code SystemThemeSetting}, para que el theme de
 * login refleje en runtime lo que el admin configura en preferencias, sin tocar archivos ni redeploy.
 *
 * <p>Se sirve con {@code Access-Control-Allow-Origin: *} porque lo consume el login de Keycloak
 * (otro origen). Es un GET simple de datos no sensibles, asi que el wildcard es aceptable.</p>
 */
@Path("/api/branding")
@Produces(MediaType.APPLICATION_JSON)
public class BrandingResource {

    private final SystemThemeSettingService systemThemeSettingService;

    public BrandingResource(SystemThemeSettingService systemThemeSettingService) {
        this.systemThemeSettingService = systemThemeSettingService;
    }

    @GET
    @PermitAll
    public Response get() {
        return Response.ok(systemThemeSettingService.branding())
                .header("Access-Control-Allow-Origin", "*")
                .header("Cache-Control", "no-store")
                .build();
    }

    /** Preflight CORS (por si el navegador lo emite). */
    @OPTIONS
    @PermitAll
    public Response preflight() {
        return Response.noContent()
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "GET, OPTIONS")
                .header("Access-Control-Allow-Headers", "content-type")
                .build();
    }
}
