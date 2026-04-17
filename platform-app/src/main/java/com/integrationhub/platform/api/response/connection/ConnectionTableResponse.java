package com.integrationhub.platform.api.response.connection;

public record ConnectionTableResponse(
        String schema,
        String name,
        String qualifiedName
) {
}

