package com.integrationhub.platform.api.response.process;

public record TaskTypeResponse(
        String type,
        String origin,
        String provider,
        String pluginId,
        String pluginVersion,
        String transport,
        String status,
        String reason,
        String asyncOffload,
        // ADR-021: el provider declara config-schema no vacio. La UI ofrece un tipo sin formulario
        // compilado solo si es configurable (lo renderiza con ih-schema-form).
        boolean configurable) {
}
