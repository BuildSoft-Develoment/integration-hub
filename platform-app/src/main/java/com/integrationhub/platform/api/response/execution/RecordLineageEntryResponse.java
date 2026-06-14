package com.integrationhub.platform.api.response.execution;

import java.time.LocalDateTime;

/**
 * Una etapa en la linea de tiempo E2E de un registro (BUILT -> VALIDATED ->
 * ARCHIVED -> SENT / REJECTED).
 */
public record RecordLineageEntryResponse(
        String recordId,
        String traceId,
        String stage,
        String status,
        Long processExecutionId,
        Long taskDefinitionId,
        String message,
        String payloadJson,
        LocalDateTime eventTs) {
}
