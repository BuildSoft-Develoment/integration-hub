package com.integrationhub.platform.service.plugin;

public interface PluginPromotionGate {

    void assertPromotable(String pluginId, String version);
}
