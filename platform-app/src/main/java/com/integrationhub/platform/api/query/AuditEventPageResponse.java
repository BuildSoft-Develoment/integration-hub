package com.integrationhub.platform.api.query;

import java.util.List;

public record AuditEventPageResponse(
        long total,
        List<AuditEventResponse> items,
        List<String> eventTypeOptions
) {
}
