package com.integrationhub.platform.api;

import com.integrationhub.platform.domain.SourceType;

public record SourceDefinitionRequest(
        String name,
        SourceType sourceType,
        boolean active,
        String configurationJson
) {
}
