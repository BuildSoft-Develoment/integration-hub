package com.integrationhub.platform.api.request.source;

public record SourceDefinitionRequest(
        String name,
        String sourceType,
        boolean active,
        String configurationJson
) {
}
