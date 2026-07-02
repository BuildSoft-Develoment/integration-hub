package com.integrationhub.platform.api.resource.process;

import com.integrationhub.platform.api.mapper.execution.ExecutionApiMapper;
import com.integrationhub.platform.api.request.process.ProcessExecutionRequest;
import com.integrationhub.platform.api.response.execution.ProcessExecutionStartResponse;
import com.integrationhub.platform.service.execution.ProcessExecutionCommandService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.Map;

import static com.integrationhub.platform.api.security.PlatformRoles.INTEGRATION_ADMIN;
import static com.integrationhub.platform.api.security.PlatformRoles.OPERATOR;
import static com.integrationhub.platform.api.security.PlatformRoles.PAYMENTS_OPERATOR;
import static com.integrationhub.platform.api.security.PlatformRoles.PLATFORM_ADMIN;

@Path("/api/process-executions")
@Produces(MediaType.APPLICATION_JSON)
public class ProcessExecutionResource {

    private final ProcessExecutionCommandService processExecutionCommandService;
    private final ExecutionApiMapper executionApiMapper;

    public ProcessExecutionResource(ProcessExecutionCommandService processExecutionCommandService,
                                    ExecutionApiMapper executionApiMapper) {
        this.processExecutionCommandService = processExecutionCommandService;
        this.executionApiMapper = executionApiMapper;
    }

    @POST
    @Path("/{processDefinitionId}")
    // payments-operator (spec 008 RF-019): permitido ejecutar procesos pero NO editar
    // catalogos. La restriccion de edicion se aplica por @RolesAllowed faltando en los
    // resources de catalogo (ProcessDefinition, Source, Reader, Connection); aqui basta
    // sumar el rol a la lista de roles habilitados para POST de ejecucion.
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR})
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
                processExecutionCommandService.startAsync(processDefinitionId, executionVariables, selectedFiles, sourceExecutionId, triggerSource)
        );
    }
}
