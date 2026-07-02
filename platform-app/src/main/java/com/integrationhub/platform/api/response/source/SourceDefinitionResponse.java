package com.integrationhub.platform.api.response.source;

public record SourceDefinitionResponse(
        Long id,
        String name,
        String sourceType,
        boolean active,
        String configurationJson
) {
}
