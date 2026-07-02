package com.integrationhub.platform.service.plugin;

import com.integrationhub.platform.entity.PluginInvocationMetric;
import com.integrationhub.platform.repository.PluginInvocationMetricRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;

@ApplicationScoped
public class PluginRuntimeMetricsRecorder {

    private final PluginInvocationMetricRepository repository;

    public PluginRuntimeMetricsRecorder(PluginInvocationMetricRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void record(PluginInvocationMetricCommand command) {
        if (command == null) {
            throw new IllegalArgumentException("Plugin invocation metric is required");
        }
        var metric = new PluginInvocationMetric();
        metric.pluginId = text(command.pluginId(), "pluginId");
        metric.version = text(command.version(), "version");
        metric.taskType = trimToNull(command.taskType());
        metric.transport = trimToNull(command.transport());
        metric.success = command.success();
        metric.outcome = text(command.outcome(), "outcome");
        metric.durationMs = Math.max(0L, command.durationMs());
        metric.errorMessage = trimToNull(command.errorMessage());
        metric.recordedAt = command.recordedAt() == null ? LocalDateTime.now() : command.recordedAt();
        repository.persist(metric);
    }

    private static String text(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Plugin invocation metric " + field + " is required");
        }
        return value.trim();
    }

    private static String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
