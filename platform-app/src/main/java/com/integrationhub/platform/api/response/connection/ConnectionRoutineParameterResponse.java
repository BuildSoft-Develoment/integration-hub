package com.integrationhub.platform.api.response.connection;

public record ConnectionRoutineParameterResponse(
        String schema,
        String routineName,
        String parameterName,
        String jdbcType,
        String direction,
        Integer position
) {
}
