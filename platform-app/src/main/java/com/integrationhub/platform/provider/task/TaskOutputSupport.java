package com.integrationhub.platform.provider.task;

import com.integrationhub.platform.spi.TaskContext;

import java.util.LinkedHashMap;
import java.util.Map;

final class TaskOutputSupport {

    private TaskOutputSupport() {
    }

    @SuppressWarnings("unchecked")
    static void mergeTaskOutputs(Map<String, Object> target, TaskContext context) {
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

    @SuppressWarnings("unchecked")
    static Map<String, Object> copyTaskOutputs(TaskContext context) {
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