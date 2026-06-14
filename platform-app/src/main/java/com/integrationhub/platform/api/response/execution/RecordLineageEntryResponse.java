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
        String standard,
        String messageType,
        String sourceFileName,
        String sourceFileHash,
        Long recordNumber,
        String businessKey,
        String businessKeyHash,
        String paymentReference,
        String transactionReference,
        String uetr,
        Long archiveId,
        String gatewayReference,
        LocalDateTime eventTs) {
}
