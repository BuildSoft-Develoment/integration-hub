package com.integrationhub.platform.api.response.plugin;

/**
 * The canary routing decision for a given segment key: whether it routes to the canary
 * version and which version would ultimately handle it.
 */
public record PluginCanaryRouteResponse(
        String pluginId,
        String routingKey,
        boolean routesToCanary,
        String version) {
}
