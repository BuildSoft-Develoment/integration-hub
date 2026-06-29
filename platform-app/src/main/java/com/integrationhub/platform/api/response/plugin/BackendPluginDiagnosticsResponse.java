package com.integrationhub.platform.api.response.plugin;

import java.util.List;
import java.util.Map;

public record BackendPluginDiagnosticsResponse(
        List<BackendPluginDescriptorResponse> installed,
        Map<String, String> degraded) {
}
