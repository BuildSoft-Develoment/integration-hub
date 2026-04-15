package com.integrationhub.platform.api;

import java.util.List;

public record ProcessDefinitionRequest(
        String name,
        String description,
        boolean active,
        boolean scheduled,
        String scheduleEvery,
        String flowLayoutJson,
        List<ProcessTaskRequest> tasks
) {
}

