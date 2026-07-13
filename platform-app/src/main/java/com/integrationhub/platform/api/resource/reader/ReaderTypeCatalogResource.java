package com.integrationhub.platform.api.resource.reader;

import com.integrationhub.platform.api.response.reader.ReaderTypeCatalogResponse;
import com.integrationhub.platform.api.response.reader.ReaderTypeResponse;
import com.integrationhub.platform.service.reader.ReaderTypeCatalogEntry;
import com.integrationhub.platform.service.reader.ReaderTypeCatalogService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import static com.integrationhub.platform.api.security.PlatformRoles.AUDITOR;
import static com.integrationhub.platform.api.security.PlatformRoles.INTEGRATION_ADMIN;
import static com.integrationhub.platform.api.security.PlatformRoles.PLATFORM_ADMIN;

/**
 * Catalogo de reader types (locales + remotos de plugin) con su estado. Espejo de
 * {@code TaskTypeCatalogResource}. La UI lo usa para poblar el selector de tipos de reader
 * con los tipos aportados por plugins backend y decidir habilitados vs no-confiables.
 */
@Path("/api/reader-types")
@Produces(MediaType.APPLICATION_JSON)
public class ReaderTypeCatalogResource {

    private final ReaderTypeCatalogService catalogService;

    public ReaderTypeCatalogResource(ReaderTypeCatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GET
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, AUDITOR})
    public ReaderTypeCatalogResponse list() {
        return new ReaderTypeCatalogResponse(catalogService.catalog().stream()
                .map(this::toResponse)
                .toList());
    }

    private ReaderTypeResponse toResponse(ReaderTypeCatalogEntry entry) {
        return new ReaderTypeResponse(
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
