package com.integrationhub.platform.service.plugin;

import com.integrationhub.platform.repository.PluginInvocationMetricRepository;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class MetricsPluginPromotionGate implements PluginPromotionGate {

    private static final int TREND_BUCKETS = 12;

    private final PluginInvocationMetricRepository repository;
    private final int minSamples;
    private final double maxFailureRatio;
    private final int windowHours;

    public MetricsPluginPromotionGate(
            PluginInvocationMetricRepository repository,
            @ConfigProperty(name = "integrationhub.plugins.canary.min-samples", defaultValue = "3") int minSamples,
            @ConfigProperty(name = "integrationhub.plugins.canary.max-failure-ratio", defaultValue = "0.0")
            double maxFailureRatio,
            @ConfigProperty(name = "integrationhub.plugins.canary.window-hours", defaultValue = "24") int windowHours) {
        this.repository = repository;
        this.minSamples = Math.max(1, minSamples);
        this.maxFailureRatio = Math.max(0.0, maxFailureRatio);
        this.windowHours = Math.max(1, windowHours);
    }

    @Override
    public void assertPromotable(String pluginId, String version) {
        if (pluginId == null || pluginId.isBlank() || version == null || version.isBlank()) {
            throw new IllegalArgumentException("Plugin promotion requires pluginId and version");
        }
        var since = LocalDateTime.now().minusHours(windowHours);
        var summary = repository.summarize(pluginId.trim(), version.trim(), since);
        if (summary.total() < minSamples) {
            throw new IllegalStateException("Plugin " + pluginId + "@" + version
                    + " requires at least " + minSamples + " canary sample(s); observed "
                    + summary.total());
        }
        if (summary.failureRatio() > maxFailureRatio) {
            throw new IllegalStateException("Plugin " + pluginId + "@" + version
                    + " canary failure ratio " + summary.failureRatio()
                    + " exceeds " + maxFailureRatio);
        }
    }

    /**
     * Non-throwing evaluation of a plugin version's canary window, for read-only
     * dashboards. Returns the observed samples, the policy thresholds and whether the
     * version would currently pass {@link #assertPromotable}.
     */
    public PluginCanaryStatus evaluate(String pluginId, String version) {
        if (pluginId == null || pluginId.isBlank() || version == null || version.isBlank()) {
            throw new IllegalArgumentException("Canary evaluation requires pluginId and version");
        }
        var id = pluginId.trim();
        var ver = version.trim();
        var now = LocalDateTime.now();
        var since = now.minusHours(windowHours);
        var summary = repository.summarize(id, ver, since);
        boolean enoughSamples = summary.total() >= minSamples;
        boolean withinFailureRatio = summary.failureRatio() <= maxFailureRatio;
        boolean promotable = enoughSamples && withinFailureRatio;
        String blockReason = null;
        if (!enoughSamples) {
            blockReason = "INSUFFICIENT_SAMPLES";
        } else if (!withinFailureRatio) {
            blockReason = "FAILURE_RATIO_EXCEEDED";
        }
        return new PluginCanaryStatus(
                id,
                ver,
                summary.total(),
                summary.failures(),
                summary.failureRatio(),
                windowHours,
                minSamples,
                maxFailureRatio,
                promotable,
                blockReason,
                trend(id, ver, since, now));
    }

    /**
     * Failure ratio per equal-width time bucket across the window (oldest first), for a
     * sparkline of how the canary ratio evolved. Empty buckets report a ratio of 0.
     */
    private List<Double> trend(String pluginId, String version, LocalDateTime start, LocalDateTime end) {
        var series = new ArrayList<Double>(TREND_BUCKETS);
        long windowSeconds = Math.max(1, Duration.between(start, end).getSeconds());
        for (int i = 0; i < TREND_BUCKETS; i++) {
            var from = start.plusSeconds(windowSeconds * i / TREND_BUCKETS);
            var to = i == TREND_BUCKETS - 1 ? end : start.plusSeconds(windowSeconds * (i + 1) / TREND_BUCKETS);
            series.add(repository.summarizeBetween(pluginId, version, from, to).failureRatio());
        }
        return series;
    }
}
