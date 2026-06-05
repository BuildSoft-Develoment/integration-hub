package com.integrationhub.platform.provider.task.common;

import com.integrationhub.platform.spi.task.TaskContext;

import java.util.LinkedHashMap;
import java.util.Map;

public final class TaskOutputSupport {

    private TaskOutputSupport() {
    }

    @SuppressWarnings("unchecked")
    public static void mergeTaskOutputs(Map<String, Object> target, TaskContext context) {
        if (target == null || context == null) {
            return;
        }
        var rawOutputs = context.attributes().get("taskOutputs");
        if (!(rawOutputs instanceof Map<?, ?> outputMap)) {
            return;
        }
        outputMap.forEach((key, value) -> {
            if (key != null && !String.valueOf(key).isBlank()) {
                target.put(String.valueOf(key), value);
            }
        });
    }

    public static void mergeMetadata(Map<String, Object> target, TaskContext context) {
        if (target == null || context == null) {
            return;
        }
        var rawMetadata = context.attributes().get("metadata");
        if (!(rawMetadata instanceof Map<?, ?> metadataMap)) {
            return;
        }
        target.put("metadata", metadataMap);
        metadataMap.forEach((key, value) -> {
            if (key != null && !String.valueOf(key).isBlank()) {
                target.put(String.valueOf(key), value);
            }
        });
    }

    public static void mergeCurrentRecord(Map<String, Object> target, TaskContext context) {
        if (target == null || context == null) {
            return;
        }
        var rawRecord = context.attributes().get("currentRecord");
        if (!(rawRecord instanceof Map<?, ?> recordMap)) {
            return;
        }
        recordMap.forEach((key, value) -> {
            if (key != null && !String.valueOf(key).isBlank()) {
                target.put(String.valueOf(key), value);
            }
        });
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> copyTaskOutputs(TaskContext context) {
        var result = new LinkedHashMap<String, Object>();
        if (context == null) {
            return result;
        }
        var rawOutputs = context.attributes().get("taskOutputs");
        if (rawOutputs instanceof Map<?, ?> outputMap) {
            outputMap.forEach((key, value) -> {
                if (key != null && !String.valueOf(key).isBlank()) {
                    result.put(String.valueOf(key), value);
                }
            });
        }
        return result;
    }
}
