package com.integrationhub.platform.api.response.plugin;

/**
 * Read-only canary metrics for a plugin version, exposed to admin/auditor dashboards.
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
        String blockReason) {
}
