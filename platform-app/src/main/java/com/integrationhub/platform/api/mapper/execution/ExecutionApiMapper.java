package com.integrationhub.platform.api.mapper.execution;

import com.integrationhub.platform.api.response.execution.AuditEventResponse;
import com.integrationhub.platform.api.response.execution.ProcessExecutionResponse;
import com.integrationhub.platform.api.response.execution.ProcessExecutionStartResponse;
import com.integrationhub.platform.api.response.execution.ProcessTaskExecutionResponse;
import com.integrationhub.platform.api.response.execution.ProcessedSourceFileResponse;
import com.integrationhub.platform.entity.AuditEvent;
import com.integrationhub.platform.entity.ProcessExecution;
import com.integrationhub.platform.entity.ProcessTaskExecution;
import java.util.List;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ExecutionApiMapper {

    public ProcessExecutionStartResponse toStartResponse(ProcessExecution execution) {
        return new ProcessExecutionStartResponse(
                execution.id,
                execution.status.name(),
                execution.startedAt,
                execution.finishedAt,
                execution.sourceExecutionId,
                execution.triggerSource,
                execution.details
        );
    }

    public ProcessExecutionResponse toResponse(ProcessExecution execution) {
        return new ProcessExecutionResponse(
                execution.id,
                execution.processDefinition.id,
                execution.processDefinition.name,
                execution.status.name(),
                execution.startedAt,
                execution.finishedAt,
                execution.sourceExecutionId,
                execution.triggerSource,
                execution.details
        );
    }

    public ProcessTaskExecutionResponse toResponse(ProcessTaskExecution taskExecution,
                                                   String taskPayloadJson,
                                                   List<ProcessedSourceFileResponse> processedFiles) {
        return new ProcessTaskExecutionResponse(
                taskExecution.id,
                taskExecution.processExecution.id,
                taskExecution.taskDefinition.id,
                taskExecution.taskDefinition.taskOrder,
                taskExecution.taskDefinition.taskType.name(),
                taskExecution.status.name(),
                taskExecution.executedAt,
                taskExecution.startedAt,
                taskExecution.finishedAt,
                taskExecution.details,
                taskPayloadJson,
                processedFiles
        );
    }

    public AuditEventResponse toResponse(AuditEvent auditEvent, List<ProcessedSourceFileResponse> processedFiles) {
        var processExecutionId = auditEvent.processExecution != null ? auditEvent.processExecution.id : null;
        var taskDefinitionId = auditEvent.taskDefinition != null ? auditEvent.taskDefinition.id : null;
        var taskType = auditEvent.taskDefinition != null && auditEvent.taskDefinition.taskType != null
                ? auditEvent.taskDefinition.taskType.name()
                : null;
        var processDefinitionId = auditEvent.processExecution != null && auditEvent.processExecution.processDefinition != null
                ? auditEvent.processExecution.processDefinition.id
                : null;
        var sourceExecutionId = auditEvent.processExecution != null ? auditEvent.processExecution.sourceExecutionId : null;
        var triggerSource = auditEvent.processExecution != null ? auditEvent.processExecution.triggerSource : null;

        return new AuditEventResponse(
                auditEvent.id,
                processExecutionId,
                processDefinitionId,
                sourceExecutionId,
                triggerSource,
                taskDefinitionId,
                taskType,
                auditEvent.eventType,
                auditEvent.status,
                auditEvent.message,
                auditEvent.payloadJson,
                auditEvent.createdAt,
                processedFiles
        );
    }
}
