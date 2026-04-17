package com.integrationhub.platform.api.response.process;

import com.integrationhub.platform.domain.TaskType;

public record ProcessTaskDefinitionResponse(
        Long id,
        Integer taskOrder,
        TaskType taskType,
        boolean active,
        String configurationJson,
        DefinitionRefResponse sourceDefinition,
        DefinitionRefResponse readerDefinition
) {
}
