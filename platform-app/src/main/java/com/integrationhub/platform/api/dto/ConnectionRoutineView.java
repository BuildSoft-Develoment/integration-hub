package com.integrationhub.platform.api.dto;

public record ConnectionRoutineView(
        String schema,
        String name,
        String qualifiedName,
        String routineType
) {
}
