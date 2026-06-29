package com.integrationhub.platform.api.response.plugin;

import java.util.List;

public record BackendPluginDescriptorResponse(
        String id,
        String version,
        String spiVersion,
        List<String> providedTypes,
        String transport,
        boolean trusted,
        String status,
        String degradedReason) {
}
