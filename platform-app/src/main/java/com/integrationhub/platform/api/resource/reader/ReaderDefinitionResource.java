package com.integrationhub.platform.api.resource.reader;

// @trace RF-001, RF-005 (reingenieria: clase que implementa el/los RF en produccion)

import com.integrationhub.platform.api.mapper.reader.ReaderApiMapper;
import com.integrationhub.platform.api.request.reader.ReaderDefinitionRequest;
import com.integrationhub.platform.api.response.reader.ReaderDefinitionResponse;
import com.integrationhub.platform.service.reader.ReaderCatalogService;
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
    private final ReaderApiMapper readerApiMapper;

    public ReaderDefinitionResource(ReaderCatalogService readerCatalogService, ReaderApiMapper readerApiMapper) {
        this.readerCatalogService = readerCatalogService;
        this.readerApiMapper = readerApiMapper;
    }

    @GET
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
    public List<ReaderDefinitionResponse> list() {
        return readerCatalogService.listAll().stream()
                .map(readerApiMapper::toResponse)
                .toList();
    }

    @POST
    @RolesAllowed({"platform-admin", "integration-admin"})
    public ReaderDefinitionResponse create(ReaderDefinitionRequest request) {
        return readerApiMapper.toResponse(
                readerCatalogService.create(request.name(), request.readerType(), request.active(), request.configurationJson())
        );
    }

    @PUT
    @Path("/{readerDefinitionId}")
    @RolesAllowed({"platform-admin", "integration-admin"})
    public ReaderDefinitionResponse update(@PathParam("readerDefinitionId") Long readerDefinitionId, ReaderDefinitionRequest request) {
        return readerApiMapper.toResponse(
                readerCatalogService.update(readerDefinitionId, request.name(), request.readerType(), request.active(), request.configurationJson())
        );
    }

    @POST
    @Path("/{readerDefinitionId}/activation/{active}")
    @RolesAllowed({"platform-admin", "integration-admin"})
    public ReaderDefinitionResponse setActive(@PathParam("readerDefinitionId") Long readerDefinitionId, @PathParam("active") boolean active) {
        return readerApiMapper.toResponse(readerCatalogService.setActive(readerDefinitionId, active));
    }
}
