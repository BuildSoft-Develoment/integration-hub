package com.integrationhub.platform.api.response.process;

/**
 * Response DTO de una task definition.
 *
 * <p>{@code taskType} es {@code String} desde el cierre de M-1a (T-015 spec 003).
 * Ver ADR-009.</p>
 */
public record ProcessTaskDefinitionResponse(
        Long id,
        Integer taskOrder,
        String taskType,
        boolean active,
        String configurationJson,
        DefinitionRefResponse sourceDefinition,
        DefinitionRefResponse readerDefinition
) {
}
