package com.integrationhub.platform.api.response.reader;

public record ReaderTypeResponse(
        String type,
        String origin,
        String provider,
        String pluginId,
        String pluginVersion,
        String transport,
        String status,
        String reason) {
}
