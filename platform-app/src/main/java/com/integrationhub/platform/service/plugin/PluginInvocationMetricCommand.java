package com.integrationhub.platform.service.plugin;

import java.time.LocalDateTime;

public record PluginInvocationMetricCommand(
        String pluginId,
        String version,
        String taskType,
        String transport,
        boolean success,
        String outcome,
        long durationMs,
        String errorMessage,
        LocalDateTime recordedAt) {
}
