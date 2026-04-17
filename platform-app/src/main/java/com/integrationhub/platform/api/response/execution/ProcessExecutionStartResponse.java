package com.integrationhub.platform.api.response.execution;

import java.time.LocalDateTime;

public record ProcessExecutionStartResponse(
        Long id,
        String status,
        LocalDateTime startedAt,
        LocalDateTime finishedAt,
        Long sourceExecutionId,
        String triggerSource,
        String details
) {
}
