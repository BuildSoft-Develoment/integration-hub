package com.integrationhub.platform.service.reader;

/**
 * Entrada del catalogo de reader types (para UI/operacion). Espejo de
 * {@code TaskTypeCatalogEntry} sin el offload async (no aplica a readers).
 */
public record ReaderTypeCatalogEntry(
        String type,
        String origin,
        String provider,
        String pluginId,
        String pluginVersion,
        String transport,
        String status,
        String reason) {
}
