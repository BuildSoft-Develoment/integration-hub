package com.integrationhub.platform.api;

import com.integrationhub.platform.api.dto.ProcessDefinitionView;
import com.integrationhub.platform.service.ProcessCatalogService;
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

@Path("/api/process-definitions")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProcessDefinitionResource {

    private final ProcessCatalogService processCatalogService;

    public ProcessDefinitionResource(ProcessCatalogService processCatalogService) {
        this.processCatalogService = processCatalogService;
    }

    @GET
    @RolesAllowed({"platform-admin", "integration-admin", "operator", "auditor"})
    public List<ProcessDefinitionView> list() {
        return processCatalogService.listAll();
    }

    @POST
    @RolesAllowed({"platform-admin", "integration-admin"})
    public ProcessDefinitionView create(ProcessDefinitionRequest request) {
        return processCatalogService.create(request);
    }

    @PUT
    @Path("/{processDefinitionId}")
    @RolesAllowed({"platform-admin", "integration-admin"})
    public ProcessDefinitionView update(@PathParam("processDefinitionId") Long processDefinitionId, ProcessDefinitionRequest request) {
        return processCatalogService.update(processDefinitionId, request);
    }

    @POST
    @Path("/{processDefinitionId}/activation/{active}")
    @RolesAllowed({"platform-admin", "integration-admin"})
    public ProcessDefinitionView setActive(@PathParam("processDefinitionId") Long processDefinitionId, @PathParam("active") boolean active) {
        return processCatalogService.setActive(processDefinitionId, active);
    }
}