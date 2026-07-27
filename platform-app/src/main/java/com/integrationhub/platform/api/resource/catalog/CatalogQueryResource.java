package com.integrationhub.platform.api.resource.catalog;

import com.integrationhub.platform.api.mapper.connection.ConnectionApiMapper;
import com.integrationhub.platform.api.mapper.reader.ReaderApiMapper;
import com.integrationhub.platform.api.mapper.source.SourceApiMapper;
import com.integrationhub.platform.spi.api.PageResponse;
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

import static com.integrationhub.platform.spi.security.PlatformRoles.AUDITOR;
import static com.integrationhub.platform.spi.security.PlatformRoles.INTEGRATION_ADMIN;
import static com.integrationhub.platform.spi.security.PlatformRoles.OPERATOR;
import static com.integrationhub.platform.spi.security.PlatformRoles.PAYMENTS_OPERATOR;
import static com.integrationhub.platform.spi.security.PlatformRoles.PLATFORM_ADMIN;

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
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, AUDITOR})
    public PageResponse<SourceDefinitionResponse> listSources(
            @QueryParam("q") String queryText,
            @QueryParam("type") String sourceType,
            @QueryParam("status") String status,
            @QueryParam("direction") String direction,
            @DefaultValue("0") @QueryParam("page") int page,
            @DefaultValue("8") @QueryParam("size") int size
    ) {
        return mapPage(catalogQueryService.listSources(queryText, sourceType, status, direction, page, size), sourceApiMapper::toResponse);
    }

    @GET
    @Path("/reader-definitions")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, AUDITOR})
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
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, AUDITOR})
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
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR, AUDITOR})
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
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR, AUDITOR})
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
