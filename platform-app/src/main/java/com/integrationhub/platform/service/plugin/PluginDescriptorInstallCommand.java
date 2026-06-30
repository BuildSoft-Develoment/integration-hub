package com.integrationhub.platform.service.plugin;

import java.util.Set;

public record PluginDescriptorInstallCommand(
        String id,
        String version,
        String spiVersion,
        Set<String> providedTypes,
        String transport,
        String endpoint,
        boolean trusted,
        boolean active,
        String integrity,
        String signature) {
}
