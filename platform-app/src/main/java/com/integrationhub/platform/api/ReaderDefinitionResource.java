package com.integrationhub.platform.api;

import com.integrationhub.platform.entity.ReaderDefinition;
import com.integrationhub.platform.service.ReaderCatalogService;
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

@Path("/api/reader-definitions")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ReaderDefinitionResource {

    private final ReaderCatalogService readerCatalogService;

    public ReaderDefinitionResource(ReaderCatalogService readerCatalogService) {
        this.readerCatalogService = readerCatalogService;
    }

    @GET
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
    public List<ReaderDefinition> list() {
        return readerCatalogService.listAll();
    }

    @POST
    @RolesAllowed({"platform-admin", "integration-admin"})
    public ReaderDefinition create(ReaderDefinitionRequest request) {
        return readerCatalogService.create(request.name(), request.readerType(), request.active(), request.configurationJson());
    }

    @PUT
    @Path("/{readerDefinitionId}")
    @RolesAllowed({"platform-admin", "integration-admin"})
    public ReaderDefinition update(@PathParam("readerDefinitionId") Long readerDefinitionId, ReaderDefinitionRequest request) {
        return readerCatalogService.update(readerDefinitionId, request.name(), request.readerType(), request.active(), request.configurationJson());
    }

    @POST
    @Path("/{readerDefinitionId}/activation/{active}")
    @RolesAllowed({"platform-admin", "integration-admin"})
    public ReaderDefinition setActive(@PathParam("readerDefinitionId") Long readerDefinitionId, @PathParam("active") boolean active) {
        return readerCatalogService.setActive(readerDefinitionId, active);
    }
}
