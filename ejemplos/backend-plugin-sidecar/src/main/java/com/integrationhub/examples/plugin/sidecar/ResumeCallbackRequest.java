package com.integrationhub.examples.plugin.sidecar;

import com.integrationhub.platform.task.RemoteTaskResumePayload;

import java.net.URI;
import java.util.Map;

/**
 * Request listo para que el sidecar lo envie al endpoint de resume del core.
 */
public record ResumeCallbackRequest(
        URI uri,
        String rawBody,
        Map<String, String> headers,
        RemoteTaskResumePayload payload) {

    public ResumeCallbackRequest {
        headers = headers == null ? Map.of() : Map.copyOf(headers);
    }
}
