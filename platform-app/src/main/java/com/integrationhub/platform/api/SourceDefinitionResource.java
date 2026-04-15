package com.integrationhub.platform.api;

import com.integrationhub.platform.entity.SourceDefinition;
import com.integrationhub.platform.service.SourceCatalogService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/api/source-definitions")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SourceDefinitionResource {

    private final SourceCatalogService sourceCatalogService;

    public SourceDefinitionResource(SourceCatalogService sourceCatalogService) {
        this.sourceCatalogService = sourceCatalogService;
    }

    @GET
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
    public List<SourceDefinition> list() {
        return sourceCatalogService.listAll();
    }

    @POST
    @RolesAllowed({"platform-admin", "integration-admin"})
    public SourceDefinition create(SourceDefinitionRequest request) {
        return sourceCatalogService.create(request.name(), request.sourceType(), request.active(), request.configurationJson());
    }

    @POST
    @Path("/test")
    @RolesAllowed({"platform-admin", "integration-admin"})
    public SourceTestResponse test(SourceDefinitionRequest request) {
        return sourceCatalogService.test(request.name(), request.sourceType(), request.configurationJson());
    }

    @PUT
    @Path("/{sourceDefinitionId}")
    @RolesAllowed({"platform-admin", "integration-admin"})
    public SourceDefinition update(@PathParam("sourceDefinitionId") Long sourceDefinitionId, SourceDefinitionRequest request) {
        return sourceCatalogService.update(sourceDefinitionId, request.name(), request.sourceType(), request.active(), request.configurationJson());
    }

    @POST
    @Path("/{sourceDefinitionId}/activation/{active}")
    @RolesAllowed({"platform-admin", "integration-admin"})
    public SourceDefinition setActive(@PathParam("sourceDefinitionId") Long sourceDefinitionId, @PathParam("active") boolean active) {
        return sourceCatalogService.setActive(sourceDefinitionId, active);
    }
}
