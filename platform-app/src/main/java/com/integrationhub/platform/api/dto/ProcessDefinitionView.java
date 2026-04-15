package com.integrationhub.platform.api.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ProcessDefinitionView(
        Long id,
        String name,
        String description,
        boolean active,
        boolean scheduled,
        String scheduleEvery,
        LocalDateTime nextRunAt,
        LocalDateTime lastRunAt,
        String flowLayoutJson,
        List<ProcessTaskDefinitionView> tasks
) {
}

