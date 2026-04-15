package com.integrationhub.platform.spi;

import java.util.Map;

public interface TaskProvider {

    String type();

    TaskResult execute(TaskContext context, Map<String, Object> configuration);
}

