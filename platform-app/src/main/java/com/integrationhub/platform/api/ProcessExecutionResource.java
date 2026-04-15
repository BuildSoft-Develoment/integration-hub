package com.integrationhub.platform.api;

import com.integrationhub.platform.entity.ProcessExecution;
import com.integrationhub.platform.service.ProcessExecutionService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.Map;

@Path("/api/process-executions")
@Produces(MediaType.APPLICATION_JSON)
public class ProcessExecutionResource {

    private final ProcessExecutionService processExecutionService;

    public ProcessExecutionResource(ProcessExecutionService processExecutionService) {
        this.processExecutionService = processExecutionService;
    }

    @POST
    @Path("/{processDefinitionId}")
    @RolesAllowed({"platform-admin", "integration-admin", "operator"})
    public ProcessExecution execute(@PathParam("processDefinitionId") Long processDefinitionId, ProcessExecutionRequest request) {
        Map<String, String> executionVariables = request == null || request.executionVariables() == null
                ? Map.of()
                : request.executionVariables();
        var selectedFiles = request == null || request.selectedFiles() == null
                ? java.util.List.<String>of()
                : request.selectedFiles();
        var sourceExecutionId = request == null ? null : request.sourceExecutionId();
        var triggerSource = selectedFiles.isEmpty() ? "MANUAL" : "MANUAL_RETRY_FAILED";
        return processExecutionService.execute(processDefinitionId, executionVariables, selectedFiles, sourceExecutionId, triggerSource);
    }
}
