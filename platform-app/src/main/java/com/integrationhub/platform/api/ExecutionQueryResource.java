package com.integrationhub.platform.api;

import com.integrationhub.platform.api.query.AuditEventPageResponse;
import com.integrationhub.platform.api.query.OverviewSummaryResponse;
import com.integrationhub.platform.api.query.ProcessExecutionResponse;
import com.integrationhub.platform.api.query.ProcessTaskExecutionResponse;
import com.integrationhub.platform.api.query.QueryPageResponse;
import com.integrationhub.platform.service.ExecutionQueryService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

import java.time.LocalDateTime;
import java.util.List;

@Path("/api/query")
@Produces(MediaType.APPLICATION_JSON)
public class ExecutionQueryResource {

    private final ExecutionQueryService executionQueryService;

    public ExecutionQueryResource(ExecutionQueryService executionQueryService) {
        this.executionQueryService = executionQueryService;
    }

    @GET
    @Path("/overview-summary")
    @RolesAllowed({"platform-admin", "integration-admin", "operator", "auditor"})
    public OverviewSummaryResponse overviewSummary() {
        return executionQueryService.overviewSummary();
    }

    @GET
    @Path("/process-executions")
    @RolesAllowed({"platform-admin", "integration-admin", "operator", "auditor"})
    public QueryPageResponse<ProcessExecutionResponse> listExecutions(
            @QueryParam("processDefinitionId") Long processDefinitionId,
            @QueryParam("status") String status,
            @QueryParam("q") String queryText,
            @QueryParam("mode") String mode,
            @DefaultValue("0") @QueryParam("page") int page,
            @DefaultValue("10") @QueryParam("size") int size
    ) {
        return executionQueryService.listExecutions(processDefinitionId, status, queryText, mode, page, size);
    }

    @GET
    @Path("/process-executions/{processExecutionId}")
    @RolesAllowed({"platform-admin", "integration-admin", "operator", "auditor"})
    public ProcessExecutionResponse getExecution(@PathParam("processExecutionId") Long processExecutionId) {
        return executionQueryService.getExecution(processExecutionId);
    }

    @GET
    @Path("/process-executions/{processExecutionId}/children")
    @RolesAllowed({"platform-admin", "integration-admin", "operator", "auditor"})
    public List<ProcessExecutionResponse> listExecutionChildren(@PathParam("processExecutionId") Long processExecutionId) {
        return executionQueryService.getExecutionChildren(processExecutionId);
    }

    @GET
    @Path("/process-executions/{processExecutionId}/tasks")
    @RolesAllowed({"platform-admin", "integration-admin", "operator", "auditor"})
    public List<ProcessTaskExecutionResponse> listTaskExecutions(@PathParam("processExecutionId") Long processExecutionId) {
        return executionQueryService.listTaskExecutions(processExecutionId);
    }

    @GET
    @Path("/audit-events")
    @RolesAllowed({"platform-admin", "integration-admin", "operator", "auditor"})
    public AuditEventPageResponse listAuditEvents(
            @QueryParam("processExecutionId") Long processExecutionId,
            @QueryParam("taskDefinitionId") Long taskDefinitionId,
            @QueryParam("eventType") String eventType,
            @QueryParam("status") String status,
            @QueryParam("q") String queryText,
            @QueryParam("createdFrom") LocalDateTime createdFrom,
            @QueryParam("createdTo") LocalDateTime createdTo,
            @DefaultValue("0") @QueryParam("page") int page,
            @DefaultValue("50") @QueryParam("size") int size
    ) {
        return executionQueryService.listAuditEvents(processExecutionId, taskDefinitionId, eventType, status, queryText, createdFrom, createdTo, page, size);
    }
}
