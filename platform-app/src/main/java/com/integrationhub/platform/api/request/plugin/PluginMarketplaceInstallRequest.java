package com.integrationhub.platform.api.request.plugin;

import com.integrationhub.platform.service.plugin.PluginMarketplaceInstallCommand;

public record PluginMarketplaceInstallRequest(
        String catalogUrl,
        String pluginId,
        String pinnedVersion,
        String channel,
        boolean active) {

    public PluginMarketplaceInstallCommand toCommand() {
        return new PluginMarketplaceInstallCommand(catalogUrl, pluginId, pinnedVersion, channel, active);
    }
}
