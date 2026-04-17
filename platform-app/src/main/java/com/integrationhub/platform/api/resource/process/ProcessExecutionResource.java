package com.integrationhub.platform.api.resource.process;

import com.integrationhub.platform.api.mapper.execution.ExecutionApiMapper;
import com.integrationhub.platform.api.request.process.ProcessExecutionRequest;
import com.integrationhub.platform.api.response.execution.ProcessExecutionStartResponse;
import com.integrationhub.platform.service.execution.ProcessExecutionService;
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
    private final ExecutionApiMapper executionApiMapper;

    public ProcessExecutionResource(ProcessExecutionService processExecutionService,
                                    ExecutionApiMapper executionApiMapper) {
        this.processExecutionService = processExecutionService;
        this.executionApiMapper = executionApiMapper;
    }

    @POST
    @Path("/{processDefinitionId}")
    @RolesAllowed({"platform-admin", "integration-admin", "operator"})
    public ProcessExecutionStartResponse execute(@PathParam("processDefinitionId") Long processDefinitionId, ProcessExecutionRequest request) {
        Map<String, String> executionVariables = request == null || request.executionVariables() == null
                ? Map.of()
                : request.executionVariables();
        var selectedFiles = request == null || request.selectedFiles() == null
                ? java.util.List.<String>of()
                : request.selectedFiles();
        var sourceExecutionId = request == null ? null : request.sourceExecutionId();
        var triggerSource = selectedFiles.isEmpty() ? "MANUAL" : "MANUAL_RETRY_FAILED";
        return executionApiMapper.toStartResponse(
                processExecutionService.execute(processDefinitionId, executionVariables, selectedFiles, sourceExecutionId, triggerSource)
        );
    }
}
