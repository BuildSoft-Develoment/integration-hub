package com.integrationhub.platform.api.resource.connection;

// @trace RF-002 (reingenieria: clase que implementa el/los RF en produccion)

import com.integrationhub.platform.api.mapper.connection.ConnectionApiMapper;
import com.integrationhub.platform.api.request.connection.ConnectionDefinitionRequest;
import com.integrationhub.platform.api.response.connection.ConnectionColumnResponse;
import com.integrationhub.platform.api.response.connection.ConnectionDefinitionResponse;
import com.integrationhub.platform.api.response.connection.ConnectionRoutineParameterResponse;
import com.integrationhub.platform.api.response.connection.ConnectionRoutineResponse;
import com.integrationhub.platform.api.response.connection.ConnectionSchemaResponse;
import com.integrationhub.platform.api.response.connection.ConnectionTableResponse;
import com.integrationhub.platform.api.response.connection.ConnectionTestResponse;
import com.integrationhub.platform.service.connection.ConnectionCatalogService;
import com.integrationhub.platform.service.connection.ConnectionMetadataService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/api/connection-definitions")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ConnectionDefinitionResource {

    private final ConnectionCatalogService connectionCatalogService;
    private final ConnectionMetadataService connectionMetadataService;
    private final ConnectionApiMapper connectionApiMapper;

    public ConnectionDefinitionResource(ConnectionCatalogService connectionCatalogService,
                                        ConnectionMetadataService connectionMetadataService,
                                        ConnectionApiMapper connectionApiMapper) {
        this.connectionCatalogService = connectionCatalogService;
        this.connectionMetadataService = connectionMetadataService;
        this.connectionApiMapper = connectionApiMapper;
    }

    @GET
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
    public List<ConnectionDefinitionResponse> list() {
        return connectionCatalogService.listAll().stream()
                .map(connectionApiMapper::toResponse)
                .toList();
    }

    @POST
    @RolesAllowed({"platform-admin", "integration-admin"})
    public ConnectionDefinitionResponse create(ConnectionDefinitionRequest request) {
        return connectionApiMapper.toResponse(
                connectionCatalogService.create(request.name(), request.connectionType(), request.active(), request.configurationJson())
        );
    }

    @POST
    @Path("/test")
    @RolesAllowed({"platform-admin", "integration-admin"})
    public ConnectionTestResponse test(ConnectionDefinitionRequest request) {
        return connectionCatalogService.test(request.name(), request.connectionType(), request.configurationJson());
    }

    @PUT
    @Path("/{connectionDefinitionId}")
    @RolesAllowed({"platform-admin", "integration-admin"})
    public ConnectionDefinitionResponse update(@PathParam("connectionDefinitionId") Long connectionDefinitionId,
                                               ConnectionDefinitionRequest request) {
        return connectionApiMapper.toResponse(
                connectionCatalogService.update(connectionDefinitionId, request.name(), request.connectionType(), request.active(), request.configurationJson())
        );
    }

    @POST
    @Path("/{connectionDefinitionId}/activation/{active}")
    @RolesAllowed({"platform-admin", "integration-admin"})
    public ConnectionDefinitionResponse setActive(@PathParam("connectionDefinitionId") Long connectionDefinitionId,
                                                  @PathParam("active") boolean active) {
        return connectionApiMapper.toResponse(connectionCatalogService.setActive(connectionDefinitionId, active));
    }

    @GET
    @Path("/{connectionDefinitionId}/jdbc-metadata/schemas")
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
    public List<ConnectionSchemaResponse> listSchemas(@PathParam("connectionDefinitionId") Long connectionDefinitionId) {
        return connectionMetadataService.listSchemas(connectionDefinitionId);
    }

    @GET
    @Path("/{connectionDefinitionId}/jdbc-metadata/tables")
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
    public List<ConnectionTableResponse> listTables(@PathParam("connectionDefinitionId") Long connectionDefinitionId,
                                                    @QueryParam("schema") String schema,
                                                    @QueryParam("q") String query) {
        return connectionMetadataService.listTables(connectionDefinitionId, schema, query);
    }

    @GET
    @Path("/{connectionDefinitionId}/jdbc-metadata/columns")
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
    public List<ConnectionColumnResponse> listColumns(@PathParam("connectionDefinitionId") Long connectionDefinitionId,
                                                      @QueryParam("schema") String schema,
                                                      @QueryParam("table") String table) {
        return connectionMetadataService.listColumns(connectionDefinitionId, schema, table);
    }

    @GET
    @Path("/{connectionDefinitionId}/jdbc-metadata/procedures")
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
    public List<ConnectionRoutineResponse> listProcedures(@PathParam("connectionDefinitionId") Long connectionDefinitionId,
                                                          @QueryParam("schema") String schema,
                                                          @QueryParam("q") String query) {
        return connectionMetadataService.listProcedures(connectionDefinitionId, schema, query);
    }

    @GET
    @Path("/{connectionDefinitionId}/jdbc-metadata/procedure-parameters")
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
    public List<ConnectionRoutineParameterResponse> listProcedureParameters(@PathParam("connectionDefinitionId") Long connectionDefinitionId,
                                                                            @QueryParam("schema") String schema,
                                                                            @QueryParam("procedure") String procedure) {
        return connectionMetadataService.listProcedureParameters(connectionDefinitionId, schema, procedure);
    }

    @GET
    @Path("/{connectionDefinitionId}/jdbc-metadata/functions")
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
    public List<ConnectionRoutineResponse> listFunctions(@PathParam("connectionDefinitionId") Long connectionDefinitionId,
                                                         @QueryParam("schema") String schema,
                                                         @QueryParam("q") String query) {
        return connectionMetadataService.listFunctions(connectionDefinitionId, schema, query);
    }

    @GET
    @Path("/{connectionDefinitionId}/jdbc-metadata/function-parameters")
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
    public List<ConnectionRoutineParameterResponse> listFunctionParameters(@PathParam("connectionDefinitionId") Long connectionDefinitionId,
                                                                           @QueryParam("schema") String schema,
                                                                           @QueryParam("function") String function) {
        return connectionMetadataService.listFunctionParameters(connectionDefinitionId, schema, function);
    }
}

