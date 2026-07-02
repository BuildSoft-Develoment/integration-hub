package com.integrationhub.platform.api.response.execution;

import java.time.LocalDateTime;

public record AuditSpoolEntryResponse(
        Long id,
        String eventId,
        String traceId,
        String topic,
        String partitionKey,
        String spoolStatus,
        int attempts,
        String lastError,
        LocalDateTime createdAt,
        LocalDateTime sentAt,
        String lockedBy,
        LocalDateTime lockedAt,
        LocalDateTime nextAttemptAt,
        LocalDateTime deadAt,
        String deadReason
) {
}
