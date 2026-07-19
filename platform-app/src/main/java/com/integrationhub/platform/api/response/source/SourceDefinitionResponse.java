package com.integrationhub.platform.api.response.source;

public record SourceDefinitionResponse(
        Long id,
        String name,
        String sourceType,
        boolean active,
        String configurationJson,
        // ADR-016: INPUT / OUTPUT (sink) / BOTH. El picker de FILE_DELIVER filtra por OUTPUT/BOTH.
        String direction
) {
}
