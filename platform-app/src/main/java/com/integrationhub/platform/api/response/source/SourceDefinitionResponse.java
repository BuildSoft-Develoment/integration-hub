package com.integrationhub.platform.api.response.source;

import com.integrationhub.platform.domain.SourceType;

public record SourceDefinitionResponse(
        Long id,
        String name,
        SourceType sourceType,
        boolean active,
        String configurationJson
) {
}
