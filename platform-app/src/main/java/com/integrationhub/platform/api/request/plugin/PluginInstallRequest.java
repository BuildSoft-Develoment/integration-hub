package com.integrationhub.platform.api.request.plugin;

import com.integrationhub.platform.service.plugin.PluginDescriptorInstallCommand;

import java.util.Set;

public record PluginInstallRequest(
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

    public PluginDescriptorInstallCommand toCommand() {
        return new PluginDescriptorInstallCommand(
                id,
                version,
                spiVersion,
                providedTypes,
                transport,
                endpoint,
                trusted,
                active,
                integrity,
                signature);
    }
}
