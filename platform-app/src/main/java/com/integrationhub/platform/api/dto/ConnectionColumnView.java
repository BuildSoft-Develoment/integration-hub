package com.integrationhub.platform.api.dto;

public record ConnectionColumnView(
        String schema,
        String table,
        String name,
        String dataType,
        boolean nullable,
        Integer size,
        Integer scale
) {
}

