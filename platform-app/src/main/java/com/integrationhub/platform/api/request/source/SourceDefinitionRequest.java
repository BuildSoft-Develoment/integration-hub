package com.integrationhub.platform.api.request.source;

public record SourceDefinitionRequest(
        String name,
        String sourceType,
        boolean active,
        String configurationJson,
        // ADR-016: INPUT (lectura) / OUTPUT (sink de FILE_DELIVER) / BOTH. null -> INPUT (compat clientes viejos).
        String direction
) {
}
