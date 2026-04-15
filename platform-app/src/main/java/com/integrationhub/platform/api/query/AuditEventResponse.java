package com.integrationhub.platform.api.query;

import java.time.LocalDateTime;
import java.util.List;

public record AuditEventResponse(
        Long id,
        Long processExecutionId,
        Long processDefinitionId,
        Long sourceExecutionId,
        String triggerSource,
        Long taskDefinitionId,
        String taskType,
        String eventType,
        String status,
        String message,
        String payloadJson,
        LocalDateTime createdAt,
        List<ProcessedSourceFileResponse> processedFiles
) {
}
