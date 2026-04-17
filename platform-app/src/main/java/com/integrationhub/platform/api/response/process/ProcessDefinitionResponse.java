package com.integrationhub.platform.api.response.process;

import java.time.LocalDateTime;
import java.util.List;

public record ProcessDefinitionResponse(
        Long id,
        String name,
        String description,
        boolean active,
        boolean scheduled,
        String scheduleEvery,
        LocalDateTime nextRunAt,
        LocalDateTime lastRunAt,
        String flowLayoutJson,
        List<ProcessTaskDefinitionResponse> tasks
) {
}

