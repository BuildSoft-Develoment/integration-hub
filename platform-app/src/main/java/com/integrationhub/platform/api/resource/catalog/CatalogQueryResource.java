package com.integrationhub.platform.api.resource.catalog;

import com.integrationhub.platform.api.mapper.connection.ConnectionApiMapper;
import com.integrationhub.platform.api.mapper.reader.ReaderApiMapper;
import com.integrationhub.platform.api.mapper.source.SourceApiMapper;
import com.integrationhub.platform.api.response.common.PageResponse;
import com.integrationhub.platform.api.response.connection.ConnectionDefinitionResponse;
import com.integrationhub.platform.api.response.process.ProcessDefinitionResponse;
import com.integrationhub.platform.api.response.process.ProcessScheduleResponse;
import com.integrationhub.platform.api.response.reader.ReaderDefinitionResponse;
import com.integrationhub.platform.api.response.source.SourceDefinitionResponse;
import com.integrationhub.platform.service.catalog.CatalogQueryService;
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
    private final ConnectionApiMapper connectionApiMapper;
    private final ReaderApiMapper readerApiMapper;
    private final SourceApiMapper sourceApiMapper;

    public CatalogQueryResource(CatalogQueryService catalogQueryService,
                                ConnectionApiMapper connectionApiMapper,
                                ReaderApiMapper readerApiMapper,
                                SourceApiMapper sourceApiMapper) {
        this.catalogQueryService = catalogQueryService;
        this.connectionApiMapper = connectionApiMapper;
        this.readerApiMapper = readerApiMapper;
        this.sourceApiMapper = sourceApiMapper;
    }

    @GET
    @Path("/source-definitions")
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
    public PageResponse<SourceDefinitionResponse> listSources(
            @QueryParam("q") String queryText,
            @QueryParam("type") String sourceType,
            @QueryParam("status") String status,
            @DefaultValue("0") @QueryParam("page") int page,
            @DefaultValue("8") @QueryParam("size") int size
    ) {
        return mapPage(catalogQueryService.listSources(queryText, sourceType, status, page, size), sourceApiMapper::toResponse);
    }

    @GET
    @Path("/reader-definitions")
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
    public PageResponse<ReaderDefinitionResponse> listReaders(
            @QueryParam("q") String queryText,
            @QueryParam("type") String readerType,
            @QueryParam("status") String status,
            @DefaultValue("0") @QueryParam("page") int page,
            @DefaultValue("8") @QueryParam("size") int size
    ) {
        return mapPage(catalogQueryService.listReaders(queryText, readerType, status, page, size), readerApiMapper::toResponse);
    }

    @GET
    @Path("/connection-definitions")
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
    public PageResponse<ConnectionDefinitionResponse> listConnections(
            @QueryParam("q") String queryText,
            @QueryParam("type") String connectionType,
            @QueryParam("status") String status,
            @DefaultValue("0") @QueryParam("page") int page,
            @DefaultValue("8") @QueryParam("size") int size
    ) {
        return mapPage(catalogQueryService.listConnections(queryText, connectionType, status, page, size), connectionApiMapper::toResponse);
    }

    @GET
    @Path("/process-definitions")
    @RolesAllowed({"platform-admin", "integration-admin", "operator", "auditor"})
    public PageResponse<ProcessDefinitionResponse> listProcesses(
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
    public PageResponse<ProcessScheduleResponse> listSchedules(
            @QueryParam("q") String queryText,
            @QueryParam("mode") String mode,
            @QueryParam("status") String status,
            @DefaultValue("0") @QueryParam("page") int page,
            @DefaultValue("8") @QueryParam("size") int size
    ) {
        return catalogQueryService.listSchedules(queryText, mode, status, page, size);
    }

    private <T, R> PageResponse<R> mapPage(PageResponse<T> page, java.util.function.Function<T, R> mapper) {
        return new PageResponse<>(
                page.total(),
                page.items().stream().map(mapper).toList()
        );
    }
}
