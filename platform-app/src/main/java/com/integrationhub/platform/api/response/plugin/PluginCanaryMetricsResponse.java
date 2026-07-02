package com.integrationhub.platform.api.response.plugin;

import java.util.List;

/**
 * Read-only canary metrics for a plugin version, exposed to admin/auditor dashboards.
 * {@code trend} is the per-bucket failure ratio across the window (oldest first).
 */
public record PluginCanaryMetricsResponse(
        String pluginId,
        String version,
        long totalSamples,
        long failures,
        double failureRatio,
        int windowHours,
        int minSamples,
        double maxFailureRatio,
        boolean promotable,
        String blockReason,
        List<Double> trend) {
}
