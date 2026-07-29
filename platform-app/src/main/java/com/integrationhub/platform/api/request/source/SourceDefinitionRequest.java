package com.integrationhub.platform.api.request.source;

public record SourceDefinitionRequest(
        String name,
        String sourceType,
        boolean active,
        String configurationJson,
        // ADR-016: INPUT (lectura) / OUTPUT (sink de FILE_DELIVER) / BOTH. null -> INPUT (compat clientes viejos).
        String direction,
        // ADR-021 (E): entregar aqui MUEVE DINERO. Marca el banco, para que el motor no re-encole a ciegas
        // una entrega interrumpida. Solo tiene sentido con direction de salida. Primitivo, asi que un
        // cliente viejo que no lo mande cae en false — el default seguro.
        boolean moneyCritical
) {
}
