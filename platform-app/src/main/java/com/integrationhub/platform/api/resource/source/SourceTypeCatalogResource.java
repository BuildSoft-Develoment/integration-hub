package com.integrationhub.platform.api.resource.source;

import com.integrationhub.platform.api.response.source.SourceTypeCatalogResponse;
import com.integrationhub.platform.api.response.source.SourceTypeResponse;
import com.integrationhub.platform.service.source.SourceTypeCatalogEntry;
import com.integrationhub.platform.service.source.SourceTypeCatalogService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import static com.integrationhub.platform.api.security.PlatformRoles.AUDITOR;
import static com.integrationhub.platform.api.security.PlatformRoles.INTEGRATION_ADMIN;
import static com.integrationhub.platform.api.security.PlatformRoles.PLATFORM_ADMIN;

/**
 * Catalogo de source types (locales + remotos de plugin) con su estado. Espejo de
 * {@code ReaderTypeCatalogResource}. La UI lo usa para poblar el selector de tipos de source
 * con los tipos aportados por plugins backend y decidir habilitados vs no-confiables.
 */
@Path("/api/source-types")
@Produces(MediaType.APPLICATION_JSON)
public class SourceTypeCatalogResource {

    private final SourceTypeCatalogService catalogService;

    public SourceTypeCatalogResource(SourceTypeCatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GET
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, AUDITOR})
    public SourceTypeCatalogResponse list() {
        return new SourceTypeCatalogResponse(catalogService.catalog().stream()
                .map(this::toResponse)
                .toList());
    }

    private SourceTypeResponse toResponse(SourceTypeCatalogEntry entry) {
        return new SourceTypeResponse(
                entry.type(),
                entry.origin(),
                entry.provider(),
                entry.pluginId(),
                entry.pluginVersion(),
                entry.transport(),
                entry.status(),
                entry.reason());
    }
}
