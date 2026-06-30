package com.integrationhub.platform.api.resource.process;

import com.integrationhub.platform.api.response.process.TaskTypeCatalogResponse;
import com.integrationhub.platform.api.response.process.TaskTypeResponse;
import com.integrationhub.platform.service.execution.TaskTypeCatalogEntry;
import com.integrationhub.platform.service.execution.TaskTypeCatalogService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import static com.integrationhub.platform.api.security.PlatformRoles.AUDITOR;
import static com.integrationhub.platform.api.security.PlatformRoles.INTEGRATION_ADMIN;
import static com.integrationhub.platform.api.security.PlatformRoles.PLATFORM_ADMIN;

@Path("/api/task-types")
@Produces(MediaType.APPLICATION_JSON)
public class TaskTypeCatalogResource {

    private final TaskTypeCatalogService catalogService;

    public TaskTypeCatalogResource(TaskTypeCatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GET
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, AUDITOR})
    public TaskTypeCatalogResponse list() {
        return new TaskTypeCatalogResponse(catalogService.catalog().stream()
                .map(this::toResponse)
                .toList());
    }

    private TaskTypeResponse toResponse(TaskTypeCatalogEntry entry) {
        return new TaskTypeResponse(
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
