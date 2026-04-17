package com.integrationhub.platform.spi.task;

import java.util.Map;

public interface TaskProvider {

    String type();

    TaskResult execute(TaskContext context, Map<String, Object> configuration);
}
