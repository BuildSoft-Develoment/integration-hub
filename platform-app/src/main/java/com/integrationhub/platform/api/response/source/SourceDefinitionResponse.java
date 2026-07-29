package com.integrationhub.platform.api.response.source;

public record SourceDefinitionResponse(
        Long id,
        String name,
        String sourceType,
        boolean active,
        String configurationJson,
        // ADR-016: INPUT / OUTPUT (sink) / BOTH. El picker de FILE_DELIVER filtra por OUTPUT/BOTH.
        String direction,
        // ADR-021 (E): entregar aqui MUEVE DINERO. El formulario de fuentes la muestra y el motor la usa
        // para marcar la ejecucion de tarea y no re-encolarla a ciegas tras una caida de nodo.
        boolean moneyCritical
) {
}
