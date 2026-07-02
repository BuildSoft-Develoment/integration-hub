package com.integrationhub.examples.plugin.sidecar;

import com.integrationhub.platform.task.AsyncTaskEnvelope;
import com.integrationhub.platform.task.RemoteTaskResumePayload;

import java.util.Map;

/**
 * Punto de extension del sidecar: cada plugin real aporta su handler.
 */
@FunctionalInterface
public interface PluginTaskHandler {

    RemoteTaskResumePayload handle(AsyncTaskEnvelope envelope, Map<String, Object> payload);
}
