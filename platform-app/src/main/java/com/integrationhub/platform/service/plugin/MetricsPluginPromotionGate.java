package com.integrationhub.platform.service.plugin;

import com.integrationhub.platform.repository.PluginInvocationMetricRepository;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.LocalDateTime;

@ApplicationScoped
public class MetricsPluginPromotionGate implements PluginPromotionGate {

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
}
