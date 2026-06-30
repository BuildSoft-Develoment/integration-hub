package com.integrationhub.examples.plugin.sidecar;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import com.integrationhub.platform.task.RemoteTaskResumePayload;
import com.integrationhub.platform.task.ResumeCallbackSignature;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Orquestador de referencia para un plugin backend out-of-process.
 */
public final class ReferencePluginSidecar {

    private static final TypeReference<Map<String, Object>> PAYLOAD_TYPE = new TypeReference<>() {
    };

    private final String pluginId;
    private final URI platformBaseUri;
    private final String resumeSecret;
    private final PluginTaskHandler handler;
    private final ObjectMapper objectMapper;

    public ReferencePluginSidecar(
            String pluginId,
            URI platformBaseUri,
            String resumeSecret,
            PluginTaskHandler handler,
            ObjectMapper objectMapper) {
        this.pluginId = requireText(pluginId, "pluginId");
        this.platformBaseUri = platformBaseUri == null ? URI.create("http://localhost:8080") : platformBaseUri;
        this.resumeSecret = requireText(resumeSecret, "resumeSecret");
        this.handler = handler == null ? new EchoPluginTaskHandler(this.pluginId) : handler;
        this.objectMapper = objectMapper == null ? new ObjectMapper() : objectMapper;
    }

    public ResumeCallbackRequest toResumeCallback(AsyncTaskEnvelope envelope, String resumeToken) {
        if (envelope == null) {
            throw new IllegalArgumentException("envelope must not be null");
        }
        var payload = parsePayload(envelope.payload());
        RemoteTaskResumePayload result;
        try {
            result = handler.handle(envelope, payload);
        } catch (RuntimeException error) {
            result = RemoteTaskResumePayload.failed(
                    pluginId,
                    envelope.taskType(),
                    envelope.idempotencyKey(),
                    "sidecar failed: " + message(error),
                    Map.of("errorType", error.getClass().getSimpleName()));
        }
        var rawBody = writeBody(result);
        var headers = new LinkedHashMap<String, String>();
        headers.put("Content-Type", "application/json");
        headers.put("X-Signature", ResumeCallbackSignature.headerValue(resumeSecret, rawBody));
        headers.put("X-Idempotency-Key", envelope.idempotencyKey());
        headers.put("X-Trace-Id", envelope.traceId());
        return new ResumeCallbackRequest(resumeUri(resumeToken), rawBody, headers, result);
    }

    private Map<String, Object> parsePayload(String rawPayload) {
        try {
            if (rawPayload == null || rawPayload.isBlank()) {
                return Map.of();
            }
            return objectMapper.readValue(rawPayload, PAYLOAD_TYPE);
        } catch (JsonProcessingException error) {
            throw new IllegalArgumentException("AsyncTaskEnvelope.payload is not valid JSON", error);
        }
    }

    private String writeBody(RemoteTaskResumePayload payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException error) {
            throw new IllegalStateException("Cannot serialize resume payload", error);
        }
    }

    private URI resumeUri(String resumeToken) {
        var encodedToken = URLEncoder.encode(requireText(resumeToken, "resumeToken"), StandardCharsets.UTF_8)
                .replace("+", "%20");
        var base = platformBaseUri.toString();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return URI.create(base + "/api/process-executions/resume/" + encodedToken);
    }

    private static String requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " must not be blank");
        }
        return value.trim();
    }

    private static String message(RuntimeException error) {
        return error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage();
    }
}
