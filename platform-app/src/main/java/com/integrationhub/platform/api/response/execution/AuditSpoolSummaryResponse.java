package com.integrationhub.platform.api.response.execution;

import java.time.LocalDateTime;

public record AuditSpoolSummaryResponse(
        long pending,
        long inFlight,
        long sent,
        long dead,
        LocalDateTime oldestPendingCreatedAt
) {
}
