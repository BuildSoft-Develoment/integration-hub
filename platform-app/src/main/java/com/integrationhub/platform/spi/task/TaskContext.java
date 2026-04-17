package com.integrationhub.platform.spi.task;

import java.util.HashMap;
import java.util.Map;

public class TaskContext {

    private final Long processExecutionId;
    private final Long taskDefinitionId;
    private final Map<String, Object> attributes = new HashMap<>();

    public TaskContext(Long processExecutionId, Long taskDefinitionId) {
        this.processExecutionId = processExecutionId;
        this.taskDefinitionId = taskDefinitionId;
    }

    public Long processExecutionId() {
        return processExecutionId;
    }

    public Long taskDefinitionId() {
        return taskDefinitionId;
    }

    public Map<String, Object> attributes() {
        return attributes;
    }
}
