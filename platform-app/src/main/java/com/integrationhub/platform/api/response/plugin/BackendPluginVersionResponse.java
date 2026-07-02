package com.integrationhub.platform.api.response.plugin;

import java.util.List;

public record BackendPluginVersionResponse(
        String id,
        String version,
        String spiVersion,
        List<String> providedTypes,
        List<String> providedSourceTypes,
        List<String> providedReaderTypes,
        String transport,
        boolean trusted,
        boolean active,
        String marketplaceUrl,
        String channel,
        String pinnedVersion,
        boolean pinned,
        Integer canaryWeight) {
}
