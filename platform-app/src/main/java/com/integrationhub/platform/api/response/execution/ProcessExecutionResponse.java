package com.integrationhub.platform.api.response.execution;

import java.time.LocalDateTime;

public record ProcessExecutionResponse(
        Long id,
        Long processDefinitionId,
        String processName,
        String status,
        LocalDateTime startedAt,
        LocalDateTime finishedAt,
        Long sourceExecutionId,
        String triggerSource,
        String details
) {
}
