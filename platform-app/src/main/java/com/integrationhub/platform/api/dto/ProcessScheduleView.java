package com.integrationhub.platform.api.dto;

import java.time.LocalDateTime;

public record ProcessScheduleView(
        Long id,
        String name,
        String description,
        boolean active,
        boolean scheduled,
        String scheduleEvery,
        LocalDateTime nextRunAt,
        LocalDateTime lastRunAt
) {
}