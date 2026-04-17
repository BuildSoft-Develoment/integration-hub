package com.integrationhub.platform.api.response.execution;

public record OverviewMetricResponse(
        String label,
        long total,
        long active
) {
}
