package com.integrationhub.platform.spi;

import com.integrationhub.platform.entity.ProcessExecution;
import com.integrationhub.platform.entity.ProcessTaskDefinition;
import java.util.HashMap;
import java.util.Map;

public class TaskContext {

    private final ProcessExecution processExecution;
    private final ProcessTaskDefinition taskDefinition;
    private final Map<String, Object> attributes = new HashMap<>();

    public TaskContext(ProcessExecution processExecution, ProcessTaskDefinition taskDefinition) {
        this.processExecution = processExecution;
        this.taskDefinition = taskDefinition;
    }

    public ProcessExecution processExecution() {
        return processExecution;
    }

    public ProcessTaskDefinition taskDefinition() {
        return taskDefinition;
    }

    public Map<String, Object> attributes() {
        return attributes;
    }
}

