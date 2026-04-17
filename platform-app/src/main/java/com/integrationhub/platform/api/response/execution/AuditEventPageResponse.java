package com.integrationhub.platform.api.response.execution;

import java.util.List;

public record AuditEventPageResponse(
        long total,
        List<AuditEventResponse> items,
        List<String> eventTypeOptions
) {
}
