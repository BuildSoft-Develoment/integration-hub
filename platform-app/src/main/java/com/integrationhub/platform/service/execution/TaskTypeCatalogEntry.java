package com.integrationhub.platform.service.execution;

public record TaskTypeCatalogEntry(
        String type,
        String origin,
        String provider,
        String pluginId,
        String pluginVersion,
        String transport,
        String status,
        String reason) {
}
