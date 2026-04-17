package com.integrationhub.platform.api.response.connection;

import com.integrationhub.platform.domain.ConnectionType;

public record ConnectionDefinitionResponse(
        Long id,
        String name,
        ConnectionType connectionType,
        boolean active,
        String configurationJson
) {
}
