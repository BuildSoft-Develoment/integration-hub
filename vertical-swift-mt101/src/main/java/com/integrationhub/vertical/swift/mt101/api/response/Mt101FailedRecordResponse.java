package com.integrationhub.vertical.swift.mt101.api.response;

import java.time.LocalDateTime;

/** Fila en cuarentena: la fila exacta del archivo que fallo validacion. */
public record Mt101FailedRecordResponse(
        long id,
        String fragmentSetId,
        String sendersReference,
        String transactionReference,
        String sourceFileHash,
        Long sourceRecordNumber,
        Long stagingId,
        Long sourceTaskDefinitionId,
        String sourceName,
        String ruleCode,
        String ruleSet,
        String severity,
        String message,
        String status,
        LocalDateTime createdAt,
        LocalDateTime resolvedAt
) {
}
