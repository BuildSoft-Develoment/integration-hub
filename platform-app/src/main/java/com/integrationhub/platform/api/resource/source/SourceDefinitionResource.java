package com.integrationhub.platform.api.resource.source;

import com.integrationhub.platform.api.mapper.source.SourceApiMapper;
import com.integrationhub.platform.api.request.source.SourceDefinitionRequest;
import com.integrationhub.platform.api.response.source.SourceDefinitionResponse;
import com.integrationhub.platform.api.response.source.SourceTestResponse;
import com.integrationhub.platform.service.source.SourceCatalogService;
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
    private final SourceApiMapper sourceApiMapper;

    public SourceDefinitionResource(SourceCatalogService sourceCatalogService, SourceApiMapper sourceApiMapper) {
        this.sourceCatalogService = sourceCatalogService;
        this.sourceApiMapper = sourceApiMapper;
    }

    @GET
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
    public List<SourceDefinitionResponse> list() {
        return sourceCatalogService.listAll().stream()
                .map(sourceApiMapper::toResponse)
                .toList();
    }

    @POST
    @RolesAllowed({"platform-admin", "integration-admin"})
    public SourceDefinitionResponse create(SourceDefinitionRequest request) {
        return sourceApiMapper.toResponse(
                sourceCatalogService.create(request.name(), request.sourceType(), request.active(), request.configurationJson())
        );
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
    public SourceDefinitionResponse update(@PathParam("sourceDefinitionId") Long sourceDefinitionId, SourceDefinitionRequest request) {
        return sourceApiMapper.toResponse(
                sourceCatalogService.update(sourceDefinitionId, request.name(), request.sourceType(), request.active(), request.configurationJson())
        );
    }

    @POST
    @Path("/{sourceDefinitionId}/activation/{active}")
    @RolesAllowed({"platform-admin", "integration-admin"})
    public SourceDefinitionResponse setActive(@PathParam("sourceDefinitionId") Long sourceDefinitionId, @PathParam("active") boolean active) {
        return sourceApiMapper.toResponse(sourceCatalogService.setActive(sourceDefinitionId, active));
    }
}
