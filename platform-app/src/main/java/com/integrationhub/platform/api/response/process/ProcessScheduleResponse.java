package com.integrationhub.platform.api.response.process;

import java.time.LocalDateTime;

public record ProcessScheduleResponse(
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
