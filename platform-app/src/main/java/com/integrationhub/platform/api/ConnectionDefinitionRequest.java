package com.integrationhub.platform.api;
import com.integrationhub.platform.domain.ConnectionType;
public record ConnectionDefinitionRequest(
        String name,
        ConnectionType connectionType,
        boolean active,
        String configurationJson
) {
}