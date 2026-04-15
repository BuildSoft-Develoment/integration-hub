package com.integrationhub.platform.api.query;

public record OverviewMetricResponse(
        String label,
        long total,
        long active
) {
}