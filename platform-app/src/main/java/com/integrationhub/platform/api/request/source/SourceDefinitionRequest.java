package com.integrationhub.platform.api.request.source;

import com.integrationhub.platform.domain.SourceType;

public record SourceDefinitionRequest(
        String name,
        SourceType sourceType,
        boolean active,
        String configurationJson
) {
}
