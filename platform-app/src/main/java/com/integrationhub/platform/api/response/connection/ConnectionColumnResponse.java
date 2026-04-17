package com.integrationhub.platform.api.response.connection;

public record ConnectionColumnResponse(
        String schema,
        String table,
        String name,
        String dataType,
        boolean nullable,
        Integer size,
        Integer scale
) {
}

