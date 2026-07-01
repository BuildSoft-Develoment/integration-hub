package com.integrationhub.platform.repository;

import com.integrationhub.platform.entity.PluginInvocationMetric;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.LocalDateTime;

@ApplicationScoped
public class PluginInvocationMetricRepository implements PanacheRepositoryBase<PluginInvocationMetric, Long> {

    public PluginMetricSummary summarize(String pluginId, String version, LocalDateTime since) {
        var total = count("pluginId = ?1 and version = ?2 and recordedAt >= ?3", pluginId, version, since);
        var failures = count("pluginId = ?1 and version = ?2 and recordedAt >= ?3 and success = false",
                pluginId, version, since);
        return new PluginMetricSummary(total, failures);
    }

    public record PluginMetricSummary(long total, long failures) {
        public double failureRatio() {
            return total == 0 ? 0.0 : (double) failures / (double) total;
        }
    }
}
