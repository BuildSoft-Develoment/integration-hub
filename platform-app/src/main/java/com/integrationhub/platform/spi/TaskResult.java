package com.integrationhub.platform.spi;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

public record TaskResult(boolean success, String details, Map<String, Object> outputs) {

    public TaskResult {
        outputs = outputs == null ? Map.of() : Collections.unmodifiableMap(new LinkedHashMap<>(outputs));
    }

    public static TaskResult success(String details) {
        return new TaskResult(true, details, Map.of());
    }

    public static TaskResult success(String details, Map<String, Object> outputs) {
        return new TaskResult(true, details, outputs);
    }

    public static TaskResult failure(String details) {
        return new TaskResult(false, details, Map.of());
    }

    public static TaskResult failure(String details, Map<String, Object> outputs) {
        return new TaskResult(false, details, outputs);
    }
}