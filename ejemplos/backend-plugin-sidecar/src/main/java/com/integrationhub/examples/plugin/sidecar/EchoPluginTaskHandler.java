package com.integrationhub.examples.plugin.sidecar;

import com.integrationhub.platform.task.AsyncTaskEnvelope;
import com.integrationhub.platform.task.RemoteTaskResumePayload;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Handler minimo que simula un plugin externo con un type ACME_ECHO.
 */
public final class EchoPluginTaskHandler implements PluginTaskHandler {

    public static final String TASK_TYPE = "ACME_ECHO";

    private final String pluginId;

    public EchoPluginTaskHandler(String pluginId) {
        if (pluginId == null || pluginId.isBlank()) {
            throw new IllegalArgumentException("pluginId must not be blank");
        }
        this.pluginId = pluginId.trim();
    }

    @Override
    public RemoteTaskResumePayload handle(AsyncTaskEnvelope envelope, Map<String, Object> payload) {
        if (!TASK_TYPE.equals(envelope.taskType())) {
            return RemoteTaskResumePayload.failed(
                    pluginId,
                    envelope.taskType(),
                    envelope.idempotencyKey(),
                    "unsupported taskType: " + envelope.taskType(),
                    Map.of("expectedTaskType", TASK_TYPE));
        }
        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("echo", configuration(payload).getOrDefault("message", ""));
        outputs.put("traceId", envelope.traceId());
        outputs.put("processExecutionId", envelope.processExecutionId());
        outputs.put("taskDefinitionId", envelope.taskDefinitionId());
        return RemoteTaskResumePayload.completed(
                pluginId,
                envelope.taskType(),
                envelope.idempotencyKey(),
                "ACME_ECHO completed by sidecar",
                outputs);
    }

    private Map<String, Object> configuration(Map<String, Object> payload) {
        var raw = payload == null ? null : payload.get("configuration");
        if (!(raw instanceof Map<?, ?> map)) {
            return Map.of();
        }
        var copy = new LinkedHashMap<String, Object>();
        for (var entry : map.entrySet()) {
            if (entry.getKey() instanceof String key) {
                copy.put(key, entry.getValue());
            }
        }
        return copy;
    }
}
