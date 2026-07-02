package com.integrationhub.platform.task;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Payload canonico que un plugin out-of-process envia al endpoint de resume.
 *
 * <p>El sidecar publica este JSON como body de
 * {@code POST /api/process-executions/resume/{token}}. El motor lo recibe como
 * {@code externalEvent} y {@code RemoteTaskProvider} lo transforma nuevamente en
 * {@code TaskResult}.</p>
 */
public record RemoteTaskResumePayload(
        String pluginId,
        String taskType,
        String idempotencyKey,
        boolean success,
        String details,
        Map<String, Object> outputs) {

    public static final String PLUGIN_ID = "pluginId";
    public static final String TASK_TYPE = "taskType";
    public static final String IDEMPOTENCY_KEY = "idempotencyKey";
    public static final String SUCCESS = "success";
    public static final String DETAILS = "details";
    public static final String OUTPUTS = "outputs";

    public RemoteTaskResumePayload {
        outputs = outputs == null ? Map.of() : Collections.unmodifiableMap(new LinkedHashMap<>(outputs));
    }

    public static RemoteTaskResumePayload completed(
            String pluginId,
            String taskType,
            String idempotencyKey,
            String details,
            Map<String, Object> outputs) {
        return new RemoteTaskResumePayload(pluginId, taskType, idempotencyKey, true, details, outputs);
    }

    public static RemoteTaskResumePayload failed(
            String pluginId,
            String taskType,
            String idempotencyKey,
            String details,
            Map<String, Object> outputs) {
        return new RemoteTaskResumePayload(pluginId, taskType, idempotencyKey, false, details, outputs);
    }

    public Map<String, Object> asExternalEvent() {
        var event = new LinkedHashMap<String, Object>();
        event.put(PLUGIN_ID, pluginId);
        event.put(TASK_TYPE, taskType);
        event.put(IDEMPOTENCY_KEY, idempotencyKey);
        event.put(SUCCESS, success);
        event.put(DETAILS, details);
        event.put(OUTPUTS, outputs);
        return Collections.unmodifiableMap(event);
    }
}
