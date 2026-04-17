package com.integrationhub.platform.api.response.execution;

import java.time.LocalDateTime;
import java.util.List;

public record ProcessTaskExecutionResponse(
        Long id,
        Long processExecutionId,
        Long taskDefinitionId,
        Integer taskOrder,
        String taskType,
        String status,
        LocalDateTime executedAt,
        LocalDateTime startedAt,
        LocalDateTime finishedAt,
        String details,
        String payloadJson,
        List<ProcessedSourceFileResponse> processedFiles
) {
}
