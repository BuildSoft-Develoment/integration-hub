package com.integrationhub.platform.api;

import com.integrationhub.platform.domain.TaskType;

public record ProcessTaskRequest(
        Integer taskOrder,
        TaskType taskType,
        Long sourceDefinitionId,
        Long readerDefinitionId,
        String configurationJson
) {
}
