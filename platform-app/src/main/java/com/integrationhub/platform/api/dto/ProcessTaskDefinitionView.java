package com.integrationhub.platform.api.dto;

import com.integrationhub.platform.domain.TaskType;

public record ProcessTaskDefinitionView(
        Long id,
        Integer taskOrder,
        TaskType taskType,
        boolean active,
        String configurationJson,
        DefinitionRefView sourceDefinition,
        DefinitionRefView readerDefinition
) {
}