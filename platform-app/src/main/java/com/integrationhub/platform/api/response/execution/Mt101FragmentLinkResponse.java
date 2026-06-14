package com.integrationhub.platform.api.response.execution;

import java.time.LocalDateTime;

public record Mt101FragmentLinkResponse(
        String fragmentSetId,
        Long processExecutionId,
        Long taskDefinitionId,
        String sourceTable,
        long sourceRowFrom,
        long sourceRowTo,
        int fragmentIndex,
        int fragmentTotal,
        String sendersReference,
        String status,
        String errorMessage,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
