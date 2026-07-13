package com.integrationhub.platform.service.plugin;

import com.integrationhub.platform.spi.config.PluginConfigSchema;

import java.util.Map;
import java.util.Set;

public record PluginDescriptorInstallCommand(
        String id,
        String version,
        String spiVersion,
        Set<String> providedTypes,
        Set<String> providedSourceTypes,
        Set<String> providedReaderTypes,
        String transport,
        String endpoint,
        boolean trusted,
        boolean active,
        String integrity,
        String signature,
        String marketplaceUrl,
        String channel,
        String pinnedVersion,
        boolean pinned,
        /** Config-schema por tipo aportado (task/source/reader) que el instalador declara. Opcional. */
        Map<String, PluginConfigSchema> configSchemas) {
}
