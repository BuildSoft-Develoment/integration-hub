package com.integrationhub.platform.api.resource.secret;

// @trace ADR-031 D1, QA-006 (la interfaz deja de recomendar un prefijo que este despliegue no resuelve)

import com.integrationhub.platform.api.response.secret.SecretSourceCatalogResponse;
import com.integrationhub.platform.api.response.secret.SecretSourceResponse;
import com.integrationhub.platform.service.secret.SecretSourceCatalogService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import static com.integrationhub.platform.spi.security.PlatformRoles.AUDITOR;
import static com.integrationhub.platform.spi.security.PlatformRoles.INTEGRATION_ADMIN;
import static com.integrationhub.platform.spi.security.PlatformRoles.PLATFORM_ADMIN;

/**
 * Que fuentes de secreto resuelve este despliegue. La UI lo usa para ofrecer el prefijo correcto en
 * los campos de credencial de fuentes, conexiones y tareas, en vez de recomendar siempre
 * {@code ${secret:...}} -- que en la VM no existe y falla en ejecucion (ADR-031, hecho 3).
 *
 * <p><b>No es el endpoint sensible.</b> Devuelve nombres de prefijo, no rutas ni valores: saber que
 * esta maquina resuelve {@code vaultkv} no dice nada de que secretos hay dentro. Enumerar rutas
 * -ADR-031 D5- si es otra cosa, y llevara su propio RBAC y su auditoria.</p>
 */
@Path("/api/secret-sources")
@Produces(MediaType.APPLICATION_JSON)
public class SecretSourceCatalogResource {

    private final SecretSourceCatalogService catalogService;

    public SecretSourceCatalogResource(SecretSourceCatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GET
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, AUDITOR})
    public SecretSourceCatalogResponse list() {
        return new SecretSourceCatalogResponse(catalogService.catalogo().stream()
                .map(fuente -> new SecretSourceResponse(fuente.source(), fuente.enumerable()))
                .toList());
    }
}
