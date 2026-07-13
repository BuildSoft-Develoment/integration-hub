package com.integrationhub.platform.api.response.source;

public record SourceTypeResponse(
        String type,
        String origin,
        String provider,
        String pluginId,
        String pluginVersion,
        String transport,
        String status,
        String reason) {
}
