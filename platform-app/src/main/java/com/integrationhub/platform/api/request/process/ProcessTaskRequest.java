package com.integrationhub.platform.api.request.process;

/**
 * Request DTO para alta/edicion de task definitions.
 *
 * <p>{@code taskType} es {@code String} desde el cierre de M-1a (T-015 spec 003):
 * la API acepta cualquier tipo registrado en {@code TaskTypeRegistry} (motor +
 * verticales). Antes era el enum {@code TaskType}, que obligaba a editar el
 * dominio para anadir tipos. Ver ADR-009.</p>
 */
public record ProcessTaskRequest(
        Integer taskOrder,
        String taskType,
        Long sourceDefinitionId,
        Long readerDefinitionId,
        String configurationJson
) {
}
