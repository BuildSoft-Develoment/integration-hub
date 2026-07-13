package com.integrationhub.platform.service.source;

/**
 * Entrada del catalogo de source types (para UI/operacion). Espejo de
 * {@code ReaderTypeCatalogEntry}.
 */
public record SourceTypeCatalogEntry(
        String type,
        String origin,
        String provider,
        String pluginId,
        String pluginVersion,
        String transport,
        String status,
        String reason) {
}
