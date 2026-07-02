package com.integrationhub.platform.api.request.plugin;

/** Sets the percentage (0-100) of traffic a canary version should receive. */
public record PluginCanaryWeightRequest(Integer weight) {
}
