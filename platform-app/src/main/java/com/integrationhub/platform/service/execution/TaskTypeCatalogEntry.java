package com.integrationhub.platform.service.execution;

public record TaskTypeCatalogEntry(
        String type,
        String origin,
        String provider,
        String pluginId,
        String pluginVersion,
        String transport,
        String status,
        String reason,
        // ADR-015: capacidad de offload async del tipo (SUPPORTED/SLICE_ONLY/UNSUPPORTED).
        // La UI la usa para ofrecer el toggle async solo donde es correcto.
        String asyncOffload,
        // ADR-021: el provider declara un config-schema no vacio (GET /api/plugins/config-schema/{type}).
        // La UI lo usa para ofrecer un tipo SIN formulario compilado: con schema puede renderizar
        // ih-schema-form; sin schema no habria forma de configurarlo y no se ofrece.
        boolean configurable) {
}
