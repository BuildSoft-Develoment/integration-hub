package com.integrationhub.platform.service.plugin;

public record PluginMarketplaceInstallCommand(
        String catalogUrl,
        String pluginId,
        String pinnedVersion,
        String channel,
        boolean active) {
}
