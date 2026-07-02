package com.integrationhub.examples.plugin.sidecar;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import com.integrationhub.platform.task.RemoteTaskResumePayload;
import com.integrationhub.platform.task.ResumeCallbackSignature;
import org.junit.jupiter.api.Test;

import java.net.URI;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ReferencePluginSidecarTest {

    private static final String SECRET = "resume-secret";
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void buildsSignedResumeCallbackForSuccessfulTask() throws Exception {
        var sidecar = sidecar(new EchoPluginTaskHandler("acme-tasks"));

        var request = sidecar.toResumeCallback(envelope(EchoPluginTaskHandler.TASK_TYPE), "resume token/1");

        assertEquals("http://localhost:8080/api/process-executions/resume/resume%20token%2F1",
                request.uri().toString());
        assertTrue(ResumeCallbackSignature.verifyHeader(
                SECRET,
                request.rawBody(),
                request.headers().get("X-Signature")));
        assertEquals("plugin:acme-tasks:42:7:ACME_ECHO", request.headers().get("X-Idempotency-Key"));
        assertEquals("exec-42", request.headers().get("X-Trace-Id"));

        var body = objectMapper.readValue(request.rawBody(), MAP_TYPE);
        assertEquals("acme-tasks", body.get(RemoteTaskResumePayload.PLUGIN_ID));
        assertEquals(EchoPluginTaskHandler.TASK_TYPE, body.get(RemoteTaskResumePayload.TASK_TYPE));
        assertEquals("plugin:acme-tasks:42:7:ACME_ECHO", body.get(RemoteTaskResumePayload.IDEMPOTENCY_KEY));
        assertEquals(Boolean.TRUE, body.get(RemoteTaskResumePayload.SUCCESS));
        assertEquals("ACME_ECHO completed by sidecar", body.get(RemoteTaskResumePayload.DETAILS));
        var outputs = (Map<?, ?>) body.get(RemoteTaskResumePayload.OUTPUTS);
        assertEquals("hola", outputs.get("echo"));
        assertEquals("exec-42", outputs.get("traceId"));
    }

    @Test
    void convertsUnsupportedTaskTypeIntoFailureCallback() throws Exception {
        var sidecar = sidecar(new EchoPluginTaskHandler("acme-tasks"));

        var request = sidecar.toResumeCallback(envelope("OTHER_TASK"), "resume-1");

        var body = objectMapper.readValue(request.rawBody(), MAP_TYPE);
        assertEquals(Boolean.FALSE, body.get(RemoteTaskResumePayload.SUCCESS));
        assertEquals("unsupported taskType: OTHER_TASK", body.get(RemoteTaskResumePayload.DETAILS));
        assertTrue(ResumeCallbackSignature.verifyHeader(
                SECRET,
                request.rawBody(),
                request.headers().get("X-Signature")));
    }

    @Test
    void convertsHandlerExceptionIntoFailureCallback() throws Exception {
        var sidecar = sidecar((envelope, payload) -> {
            throw new IllegalStateException("remote dependency unavailable");
        });

        var request = sidecar.toResumeCallback(envelope(EchoPluginTaskHandler.TASK_TYPE), "resume-1");

        var body = objectMapper.readValue(request.rawBody(), MAP_TYPE);
        assertEquals(Boolean.FALSE, body.get(RemoteTaskResumePayload.SUCCESS));
        assertEquals("sidecar failed: remote dependency unavailable", body.get(RemoteTaskResumePayload.DETAILS));
        assertTrue(ResumeCallbackSignature.verifyHeader(
                SECRET,
                request.rawBody(),
                request.headers().get("X-Signature")));
    }

    @Test
    void malformedEnvelopePayloadFailsBeforeCallback() {
        var sidecar = sidecar(new EchoPluginTaskHandler("acme-tasks"));
        var envelope = new AsyncTaskEnvelope(
                "exec-42",
                42L,
                7L,
                EchoPluginTaskHandler.TASK_TYPE,
                "KAFKA",
                "plugin:acme-tasks:42:7:ACME_ECHO",
                1,
                "{not-json}",
                Map.of());

        var error = assertThrows(IllegalArgumentException.class,
                () -> sidecar.toResumeCallback(envelope, "resume-1"));
        assertTrue(error.getMessage().contains("not valid JSON"));
    }

    private ReferencePluginSidecar sidecar(PluginTaskHandler handler) {
        return new ReferencePluginSidecar(
                "acme-tasks",
                URI.create("http://localhost:8080"),
                SECRET,
                handler,
                objectMapper);
    }

    private AsyncTaskEnvelope envelope(String taskType) throws Exception {
        var payload = objectMapper.writeValueAsString(Map.of(
                "pluginId", "acme-tasks",
                "pluginVersion", "1.0.0",
                "spiVersion", "1",
                "taskType", taskType,
                "processExecutionId", 42L,
                "taskDefinitionId", 7L,
                "configuration", Map.of("message", "hola")));
        return new AsyncTaskEnvelope(
                "exec-42",
                42L,
                7L,
                taskType,
                "KAFKA",
                "plugin:acme-tasks:42:7:" + taskType,
                1,
                payload,
                Map.of("pluginId", "acme-tasks"));
    }
}
