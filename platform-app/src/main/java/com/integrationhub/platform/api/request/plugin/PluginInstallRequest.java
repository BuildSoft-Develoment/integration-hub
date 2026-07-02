package com.integrationhub.platform.api.request.plugin;

import com.integrationhub.platform.service.plugin.PluginDescriptorInstallCommand;

import java.util.Set;

public record PluginInstallRequest(
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
        boolean pinned) {

    public PluginDescriptorInstallCommand toCommand() {
        return new PluginDescriptorInstallCommand(
                id,
                version,
                spiVersion,
                providedTypes,
                providedSourceTypes,
                providedReaderTypes,
                transport,
                endpoint,
                trusted,
                active,
                integrity,
                signature,
                marketplaceUrl,
                channel,
                pinnedVersion,
                pinned);
    }
}
