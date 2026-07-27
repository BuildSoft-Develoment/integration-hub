package com.integrationhub.vertical.swift.mt101.api.response;

import java.time.LocalDateTime;

public record Mt101FragmentLinkResponse(
        String fragmentSetId,
        Long processExecutionId,
        Long taskDefinitionId,
        String sourceTable,
        long stagingIdFrom,
        long stagingIdTo,
        Long sourceRecordFrom,
        Long sourceRecordTo,
        String sourceFileHash,
        int fragmentIndex,
        int fragmentTotal,
        String sendersReference,
        String status,
        String errorMessage,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
