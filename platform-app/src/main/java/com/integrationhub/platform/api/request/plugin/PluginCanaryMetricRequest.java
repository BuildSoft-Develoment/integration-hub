package com.integrationhub.platform.api.request.plugin;

import com.integrationhub.platform.service.plugin.PluginInvocationMetricCommand;

public record PluginCanaryMetricRequest(
        String taskType,
        String transport,
        boolean success,
        String outcome,
        long durationMs,
        String errorMessage) {

    public PluginInvocationMetricCommand toCommand(String pluginId, String version) {
        return new PluginInvocationMetricCommand(
                pluginId,
                version,
                taskType,
                transport,
                success,
                outcome,
                durationMs,
                errorMessage,
                null);
    }
}
