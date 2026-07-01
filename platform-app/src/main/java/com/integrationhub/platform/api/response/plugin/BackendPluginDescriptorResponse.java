package com.integrationhub.platform.api.response.plugin;

import java.util.List;

public record BackendPluginDescriptorResponse(
        String id,
        String version,
        String spiVersion,
        List<String> providedTypes,
        List<String> providedSourceTypes,
        List<String> providedReaderTypes,
        String transport,
        boolean trusted,
        String status,
        String degradedReason,
        String marketplaceUrl,
        String channel,
        String pinnedVersion,
        boolean pinned) {
}
