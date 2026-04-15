package com.integrationhub.platform.api;

import com.integrationhub.platform.api.dto.ConnectionColumnView;
import com.integrationhub.platform.api.dto.ConnectionRoutineParameterView;
import com.integrationhub.platform.api.dto.ConnectionRoutineView;
import com.integrationhub.platform.api.dto.ConnectionSchemaView;
import com.integrationhub.platform.api.dto.ConnectionTableView;
import com.integrationhub.platform.entity.ConnectionDefinition;
import com.integrationhub.platform.service.ConnectionCatalogService;
import com.integrationhub.platform.service.ConnectionMetadataService;
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

    public ConnectionDefinitionResource(ConnectionCatalogService connectionCatalogService,
                                        ConnectionMetadataService connectionMetadataService) {
        this.connectionCatalogService = connectionCatalogService;
        this.connectionMetadataService = connectionMetadataService;
    }

    @GET
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
    public List<ConnectionDefinition> list() {
        return connectionCatalogService.listAll();
    }

    @POST
    @RolesAllowed({"platform-admin", "integration-admin"})
    public ConnectionDefinition create(ConnectionDefinitionRequest request) {
        return connectionCatalogService.create(request.name(), request.connectionType(), request.active(), request.configurationJson());
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
    public ConnectionDefinition update(@PathParam("connectionDefinitionId") Long connectionDefinitionId,
                                       ConnectionDefinitionRequest request) {
        return connectionCatalogService.update(connectionDefinitionId, request.name(), request.connectionType(), request.active(), request.configurationJson());
    }

    @POST
    @Path("/{connectionDefinitionId}/activation/{active}")
    @RolesAllowed({"platform-admin", "integration-admin"})
    public ConnectionDefinition setActive(@PathParam("connectionDefinitionId") Long connectionDefinitionId,
                                          @PathParam("active") boolean active) {
        return connectionCatalogService.setActive(connectionDefinitionId, active);
    }

    @GET
    @Path("/{connectionDefinitionId}/jdbc-metadata/schemas")
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
    public List<ConnectionSchemaView> listSchemas(@PathParam("connectionDefinitionId") Long connectionDefinitionId) {
        return connectionMetadataService.listSchemas(connectionDefinitionId);
    }

    @GET
    @Path("/{connectionDefinitionId}/jdbc-metadata/tables")
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
    public List<ConnectionTableView> listTables(@PathParam("connectionDefinitionId") Long connectionDefinitionId,
                                                @QueryParam("schema") String schema,
                                                @QueryParam("q") String query) {
        return connectionMetadataService.listTables(connectionDefinitionId, schema, query);
    }

    @GET
    @Path("/{connectionDefinitionId}/jdbc-metadata/columns")
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
    public List<ConnectionColumnView> listColumns(@PathParam("connectionDefinitionId") Long connectionDefinitionId,
                                                  @QueryParam("schema") String schema,
                                                  @QueryParam("table") String table) {
        return connectionMetadataService.listColumns(connectionDefinitionId, schema, table);
    }

    @GET
    @Path("/{connectionDefinitionId}/jdbc-metadata/procedures")
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
    public List<ConnectionRoutineView> listProcedures(@PathParam("connectionDefinitionId") Long connectionDefinitionId,
                                                      @QueryParam("schema") String schema,
                                                      @QueryParam("q") String query) {
        return connectionMetadataService.listProcedures(connectionDefinitionId, schema, query);
    }

    @GET
    @Path("/{connectionDefinitionId}/jdbc-metadata/procedure-parameters")
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
    public List<ConnectionRoutineParameterView> listProcedureParameters(@PathParam("connectionDefinitionId") Long connectionDefinitionId,
                                                                        @QueryParam("schema") String schema,
                                                                        @QueryParam("procedure") String procedure) {
        return connectionMetadataService.listProcedureParameters(connectionDefinitionId, schema, procedure);
    }

    @GET
    @Path("/{connectionDefinitionId}/jdbc-metadata/functions")
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
    public List<ConnectionRoutineView> listFunctions(@PathParam("connectionDefinitionId") Long connectionDefinitionId,
                                                     @QueryParam("schema") String schema,
                                                     @QueryParam("q") String query) {
        return connectionMetadataService.listFunctions(connectionDefinitionId, schema, query);
    }

    @GET
    @Path("/{connectionDefinitionId}/jdbc-metadata/function-parameters")
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
    public List<ConnectionRoutineParameterView> listFunctionParameters(@PathParam("connectionDefinitionId") Long connectionDefinitionId,
                                                                       @QueryParam("schema") String schema,
                                                                       @QueryParam("function") String function) {
        return connectionMetadataService.listFunctionParameters(connectionDefinitionId, schema, function);
    }
}

