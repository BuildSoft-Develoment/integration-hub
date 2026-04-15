package com.integrationhub.platform.api;

import com.integrationhub.platform.api.dto.ProcessDefinitionView;
import com.integrationhub.platform.api.dto.ProcessScheduleView;
import com.integrationhub.platform.api.query.QueryPageResponse;
import com.integrationhub.platform.entity.ConnectionDefinition;
import com.integrationhub.platform.entity.ReaderDefinition;
import com.integrationhub.platform.entity.SourceDefinition;
import com.integrationhub.platform.service.CatalogQueryService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

@Path("/api/query")
@Produces(MediaType.APPLICATION_JSON)
public class CatalogQueryResource {

    private final CatalogQueryService catalogQueryService;

    public CatalogQueryResource(CatalogQueryService catalogQueryService) {
        this.catalogQueryService = catalogQueryService;
    }

    @GET
    @Path("/source-definitions")
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
    public QueryPageResponse<SourceDefinition> listSources(
            @QueryParam("q") String queryText,
            @QueryParam("type") String sourceType,
            @QueryParam("status") String status,
            @DefaultValue("0") @QueryParam("page") int page,
            @DefaultValue("8") @QueryParam("size") int size
    ) {
        return catalogQueryService.listSources(queryText, sourceType, status, page, size);
    }

    @GET
    @Path("/reader-definitions")
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
    public QueryPageResponse<ReaderDefinition> listReaders(
            @QueryParam("q") String queryText,
            @QueryParam("type") String readerType,
            @QueryParam("status") String status,
            @DefaultValue("0") @QueryParam("page") int page,
            @DefaultValue("8") @QueryParam("size") int size
    ) {
        return catalogQueryService.listReaders(queryText, readerType, status, page, size);
    }

    @GET
    @Path("/connection-definitions")
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
    public QueryPageResponse<ConnectionDefinition> listConnections(
            @QueryParam("q") String queryText,
            @QueryParam("type") String connectionType,
            @QueryParam("status") String status,
            @DefaultValue("0") @QueryParam("page") int page,
            @DefaultValue("8") @QueryParam("size") int size
    ) {
        return catalogQueryService.listConnections(queryText, connectionType, status, page, size);
    }

    @GET
    @Path("/process-definitions")
    @RolesAllowed({"platform-admin", "integration-admin", "operator", "auditor"})
    public QueryPageResponse<ProcessDefinitionView> listProcesses(
            @QueryParam("q") String queryText,
            @QueryParam("mode") String mode,
            @QueryParam("status") String status,
            @DefaultValue("0") @QueryParam("page") int page,
            @DefaultValue("8") @QueryParam("size") int size
    ) {
        return catalogQueryService.listProcesses(queryText, mode, status, page, size);
    }

    @GET
    @Path("/process-schedules")
    @RolesAllowed({"platform-admin", "integration-admin", "operator", "auditor"})
    public QueryPageResponse<ProcessScheduleView> listSchedules(
            @QueryParam("q") String queryText,
            @QueryParam("mode") String mode,
            @QueryParam("status") String status,
            @DefaultValue("0") @QueryParam("page") int page,
            @DefaultValue("8") @QueryParam("size") int size
    ) {
        return catalogQueryService.listSchedules(queryText, mode, status, page, size);
    }
}
