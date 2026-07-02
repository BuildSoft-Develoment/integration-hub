package com.integrationhub.platform.api.response.process;

public record TaskTypeResponse(
        String type,
        String origin,
        String provider,
        String pluginId,
        String pluginVersion,
        String transport,
        String status,
        String reason) {
}
