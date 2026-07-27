package com.integrationhub.platform.api.resource.process;

// @trace RF-001 (reingenieria: clase que implementa el/los RF en produccion)

import com.integrationhub.platform.api.request.process.ProcessDefinitionRequest;
import com.integrationhub.platform.api.response.process.ProcessDefinitionResponse;
import com.integrationhub.platform.service.process.ProcessCatalogService;
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

import static com.integrationhub.platform.spi.security.PlatformRoles.AUDITOR;
import static com.integrationhub.platform.spi.security.PlatformRoles.INTEGRATION_ADMIN;
import static com.integrationhub.platform.spi.security.PlatformRoles.OPERATOR;
import static com.integrationhub.platform.spi.security.PlatformRoles.PAYMENTS_OPERATOR;
import static com.integrationhub.platform.spi.security.PlatformRoles.PLATFORM_ADMIN;

@Path("/api/process-definitions")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProcessDefinitionResource {

    private final ProcessCatalogService processCatalogService;

    public ProcessDefinitionResource(ProcessCatalogService processCatalogService) {
        this.processCatalogService = processCatalogService;
    }

    @GET
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR, AUDITOR})
    public List<ProcessDefinitionResponse> list() {
        return processCatalogService.listAll();
    }

    @POST
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN})
    public ProcessDefinitionResponse create(ProcessDefinitionRequest request) {
        try {
            return processCatalogService.create(request);
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    @PUT
    @Path("/{processDefinitionId}")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN})
    public ProcessDefinitionResponse update(@PathParam("processDefinitionId") Long processDefinitionId, ProcessDefinitionRequest request) {
        try {
            return processCatalogService.update(processDefinitionId, request);
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    @POST
    @Path("/{processDefinitionId}/activation/{active}")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN})
    public ProcessDefinitionResponse setActive(@PathParam("processDefinitionId") Long processDefinitionId, @PathParam("active") boolean active) {
        try {
            return processCatalogService.setActive(processDefinitionId, active);
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }
}
