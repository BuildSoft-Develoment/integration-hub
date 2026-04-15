package com.integrationhub.platform.api.dto;

public record ConnectionRoutineParameterView(
        String schema,
        String routineName,
        String parameterName,
        String jdbcType,
        String direction,
        Integer position
) {
}
