package com.integrationhub.platform.api.resource.reader;

// @trace RF-001, RF-005 (reingenieria: clase que implementa el/los RF en produccion)

import com.integrationhub.platform.api.mapper.reader.ReaderApiMapper;
import com.integrationhub.platform.api.request.reader.ReaderDefinitionRequest;
import com.integrationhub.platform.api.response.reader.ReaderDefinitionResponse;
import com.integrationhub.platform.service.reader.ReaderCatalogService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

import static com.integrationhub.platform.api.security.PlatformRoles.AUDITOR;
import static com.integrationhub.platform.api.security.PlatformRoles.INTEGRATION_ADMIN;
import static com.integrationhub.platform.api.security.PlatformRoles.PLATFORM_ADMIN;

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
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, AUDITOR})
    public List<ReaderDefinitionResponse> list() {
        return readerCatalogService.listAll().stream()
                .map(readerApiMapper::toResponse)
                .toList();
    }

    @POST
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN})
    public ReaderDefinitionResponse create(ReaderDefinitionRequest request) {
        try {
            return readerApiMapper.toResponse(
                    readerCatalogService.create(request.name(), request.readerType(), request.active(), request.configurationJson())
            );
        } catch (IllegalArgumentException error) {
            // #5: config de reader inválida (tipo no soportado o campos faltantes) → 400 claro, no 500.
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    @PUT
    @Path("/{readerDefinitionId}")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN})
    public ReaderDefinitionResponse update(@PathParam("readerDefinitionId") Long readerDefinitionId, ReaderDefinitionRequest request) {
        try {
            return readerApiMapper.toResponse(
                    readerCatalogService.update(readerDefinitionId, request.name(), request.readerType(), request.active(), request.configurationJson())
            );
        } catch (IllegalArgumentException error) {
            // #5: config de reader inválida (tipo no soportado o campos faltantes) → 400 claro, no 500.
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    @POST
    @Path("/{readerDefinitionId}/activation/{active}")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN})
    public ReaderDefinitionResponse setActive(@PathParam("readerDefinitionId") Long readerDefinitionId, @PathParam("active") boolean active) {
        return readerApiMapper.toResponse(readerCatalogService.setActive(readerDefinitionId, active));
    }
}
