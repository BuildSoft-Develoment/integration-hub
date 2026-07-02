package com.integrationhub.platform.service.plugin;

import java.util.List;

/**
 * Read-only view of a plugin version's canary window: the observed samples and the
 * policy thresholds, plus whether the version would currently be promotable. This is
 * the non-throwing counterpart of {@link PluginPromotionGate#assertPromotable}.
 *
 * <p>{@code trend} is the per-bucket failure ratio across the window (oldest first),
 * for rendering a sparkline of how the ratio evolved.
 */
public record PluginCanaryStatus(
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
