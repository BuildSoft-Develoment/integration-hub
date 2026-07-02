package com.integrationhub.platform.api.resource.execution;

// @trace RF-001, RF-004 (reingenieria: clase que implementa el/los RF en produccion)

import com.integrationhub.platform.api.response.common.PageResponse;
import com.integrationhub.platform.api.response.execution.AuditEventPageResponse;
import com.integrationhub.platform.api.response.execution.OverviewSummaryResponse;
import com.integrationhub.platform.api.response.execution.ProcessExecutionResponse;
import com.integrationhub.platform.api.response.execution.ProcessTaskExecutionResponse;
import com.integrationhub.platform.service.execution.ExecutionQueryService;
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

import static com.integrationhub.platform.api.security.PlatformRoles.AUDITOR;
import static com.integrationhub.platform.api.security.PlatformRoles.INTEGRATION_ADMIN;
import static com.integrationhub.platform.api.security.PlatformRoles.OPERATOR;
import static com.integrationhub.platform.api.security.PlatformRoles.PAYMENTS_OPERATOR;
import static com.integrationhub.platform.api.security.PlatformRoles.PLATFORM_ADMIN;

@Path("/api/query")
@Produces(MediaType.APPLICATION_JSON)
public class ExecutionQueryResource {

    private final ExecutionQueryService executionQueryService;

    public ExecutionQueryResource(ExecutionQueryService executionQueryService) {
        this.executionQueryService = executionQueryService;
    }

    @GET
    @Path("/overview-summary")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR, AUDITOR})
    public OverviewSummaryResponse overviewSummary() {
        return executionQueryService.overviewSummary();
    }

    @GET
    @Path("/process-executions")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR, AUDITOR})
    public PageResponse<ProcessExecutionResponse> listExecutions(
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
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR, AUDITOR})
    public ProcessExecutionResponse getExecution(@PathParam("processExecutionId") Long processExecutionId) {
        return executionQueryService.getExecution(processExecutionId);
    }

    @GET
    @Path("/process-executions/{processExecutionId}/children")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR, AUDITOR})
    public List<ProcessExecutionResponse> listExecutionChildren(@PathParam("processExecutionId") Long processExecutionId) {
        return executionQueryService.getExecutionChildren(processExecutionId);
    }

    @GET
    @Path("/process-executions/{processExecutionId}/tasks")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR, AUDITOR})
    public List<ProcessTaskExecutionResponse> listTaskExecutions(@PathParam("processExecutionId") Long processExecutionId) {
        return executionQueryService.listTaskExecutions(processExecutionId);
    }

    @GET
    @Path("/audit-events")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR, AUDITOR})
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
