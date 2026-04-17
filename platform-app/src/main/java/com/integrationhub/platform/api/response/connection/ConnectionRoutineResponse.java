package com.integrationhub.platform.api.response.connection;

public record ConnectionRoutineResponse(
        String schema,
        String name,
        String qualifiedName,
        String routineType
) {
}
